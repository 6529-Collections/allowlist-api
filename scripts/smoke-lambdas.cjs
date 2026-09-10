const { execFileSync, spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const environment = process.argv[2];
const regions = {
  staging: 'eu-west-1',
  production: 'us-east-1',
};
const region = regions[environment];

if (!region) {
  throw new Error('Expected smoke environment `staging` or `production`.');
}
if (process.env.AWS_REGION && process.env.AWS_REGION !== region) {
  throw new Error(
    `AWS_REGION ${process.env.AWS_REGION} does not match ${environment} region ${region}.`,
  );
}

const apiEvent = {
  body: null,
  headers: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
  path: '/api-json',
  pathParameters: null,
  queryStringParameters: null,
  requestContext: {},
  resource: '/{proxy+}',
  stageVariables: null,
};

const functions = [
  {
    name: 'allowlist-token-pool-downloader',
    payload: { __allowlistLambdaSmokeTest: true },
    validate: (response) => response?.ok === true,
  },
  {
    name: 'allowlist-worker',
    payload: { __allowlistLambdaSmokeTest: true },
    validate: (response) => response?.ok === true,
  },
  {
    name: 'allowlist-api',
    payload: apiEvent,
    validate: (response) => {
      if (response?.statusCode !== 200) {
        return false;
      }
      const body = JSON.parse(response.body);
      const headers = response.headers ?? {};
      return (
        body?.openapi === '3.0.0' &&
        !Object.keys(headers).some(
          (header) => header.toLowerCase() === 'x-powered-by',
        )
      );
    },
  },
];

const forbiddenLogPatterns = [
  /Runtime\.ImportModuleError/i,
  /Runtime\.InvalidEntrypoint/i,
  /Runtime\.HandlerNotFound/i,
  /Cannot find module/i,
  /error while loading shared libraries/i,
  /ERR_REQUIRE_ESM/i,
  /require\(\) of ES Module/i,
  /Sentry[^\n]{0,120}(?:failed|error|exception)/i,
  /bootstrap[^\n]{0,120}(?:failed|error|exception)/i,
  /nodejs\d+\.x[^\n]{0,120}(?:unsupported|not supported)/i,
];

const scratchDirectory = mkdtempSync(
  join(tmpdir(), `allowlist-${environment}-smoke-`),
);

function invoke(lambda, responseFile) {
  const args = [
    'lambda',
    'invoke',
    '--function-name',
    lambda.name,
    '--payload',
    JSON.stringify(lambda.payload),
    '--cli-binary-format',
    'raw-in-base64-out',
    '--log-type',
    'Tail',
    responseFile,
    '--region',
    region,
    '--no-cli-pager',
    '--output',
    'json',
  ];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = spawnSync('aws', args, { encoding: 'utf8' });
    if (result.status === 0) {
      return JSON.parse(result.stdout);
    }
    const errorOutput = `${result.stderr ?? ''}\n${result.stdout ?? ''}`;
    if (attempt === 1 && errorOutput.includes('ResourceNotReadyException')) {
      console.log(`${lambda.name} was inactive; waiting for reactivation.`);
      execFileSync(
        'aws',
        [
          'lambda',
          'wait',
          'function-active-v2',
          '--function-name',
          lambda.name,
          '--region',
          region,
          '--no-cli-pager',
        ],
        { stdio: 'inherit' },
      );
      continue;
    }
    throw new Error(
      `Unable to invoke ${lambda.name}: ${errorOutput.trim().slice(0, 500)}`,
    );
  }
  throw new Error(`Unable to invoke ${lambda.name}.`);
}

try {
  for (const lambda of functions) {
    const responseFile = join(scratchDirectory, `${lambda.name}.json`);
    writeFileSync(responseFile, '', { mode: 0o600 });
    const metadata = invoke(lambda, responseFile);
    const logs = Buffer.from(metadata.LogResult ?? '', 'base64').toString(
      'utf8',
    );
    const response = JSON.parse(readFileSync(responseFile, 'utf8'));

    const forbiddenPattern = forbiddenLogPatterns.find((pattern) =>
      pattern.test(logs),
    );
    if (forbiddenPattern) {
      throw new Error(
        `${lambda.name} logs matched forbidden runtime pattern ${forbiddenPattern}.`,
      );
    }
    if (metadata.StatusCode !== 200 || metadata.FunctionError) {
      const errorType = String(response?.errorType ?? 'unknown error');
      const errorMessage = String(response?.errorMessage ?? 'no error message')
        .replace(/https?:\/\/\S+/gi, '[URL REDACTED]')
        .slice(0, 500);
      throw new Error(
        `${lambda.name} returned a Lambda function error (${metadata.FunctionError ?? 'unknown'}): ${errorType}: ${errorMessage}`,
      );
    }
    if (!logs.includes('Init Duration:')) {
      throw new Error(`${lambda.name} did not report a cold-start duration.`);
    }
    if (!lambda.validate(response)) {
      throw new Error(`${lambda.name} returned an invalid smoke response.`);
    }

    const report = logs
      .split('\n')
      .find((line) => line.startsWith('REPORT RequestId:'));
    console.log(
      `PASS ${lambda.name}: ${report?.trim() ?? 'cold-start report received'}`,
    );
  }
} finally {
  rmSync(scratchDirectory, { recursive: true, force: true });
}

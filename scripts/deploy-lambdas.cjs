const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const environment = process.argv[2];
const regions = {
  staging: 'eu-west-1',
  production: 'us-east-1',
};
const region = regions[environment];

if (!region) {
  throw new Error('Expected deployment environment `staging` or `production`.');
}
if (process.env.AWS_REGION && process.env.AWS_REGION !== region) {
  throw new Error(
    `AWS_REGION ${process.env.AWS_REGION} does not match ${environment} region ${region}.`,
  );
}
if (!process.env.SENTRY_DSN) {
  throw new Error('SENTRY_DSN must be set before deployment.');
}

const archive = resolve('.serverless/allowlist-api.zip');
if (!existsSync(archive)) {
  throw new Error(`Missing ${archive}; package and verify the artifact first.`);
}

// Workers are updated before the API that can enqueue work. Each update is
// completed and checked before the next function begins.
const functions = [
  {
    name: 'allowlist-token-pool-downloader',
    handler: 'dist/token-pool-downloader-lambda.handler',
  },
  { name: 'allowlist-worker', handler: 'dist/worker-lambda.handler' },
  { name: 'allowlist-api', handler: 'dist/api-lambda.handler' },
];

function aws(args, capture = false) {
  return execFileSync(
    'aws',
    [...args, '--region', region, '--no-cli-pager'],
    capture ? { encoding: 'utf8' } : { stdio: 'inherit' },
  );
}

for (const lambda of functions) {
  console.log(`Deploying ${lambda.name} to ${environment} (${region})`);
  const revisionId = aws(
    [
      'lambda',
      'get-function-configuration',
      '--function-name',
      lambda.name,
      '--query',
      'RevisionId',
      '--output',
      'text',
    ],
    true,
  ).trim();
  aws([
    'lambda',
    'update-function-code',
    '--function-name',
    lambda.name,
    '--zip-file',
    `fileb://${archive}`,
    '--publish',
    '--revision-id',
    revisionId,
    '--query',
    '[FunctionArn,Version,CodeSize]',
    '--output',
    'text',
  ]);
  aws([
    'lambda',
    'wait',
    'function-updated-v2',
    '--function-name',
    lambda.name,
  ]);

  const configuration = JSON.parse(
    aws(
      [
        'lambda',
        'get-function-configuration',
        '--function-name',
        lambda.name,
        '--query',
        '{environment:Environment.Variables,handler:Handler,runtime:Runtime,revisionId:RevisionId}',
        '--output',
        'json',
      ],
      true,
    ),
  );
  const desiredEnvironment = {
    ...configuration.environment,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENV: environment === 'production' ? 'production' : 'staging',
  };
  const environmentChanged = Object.entries(desiredEnvironment).some(
    ([key, value]) => configuration.environment?.[key] !== value,
  );
  if (
    configuration.handler !== lambda.handler ||
    configuration.runtime !== 'nodejs24.x' ||
    environmentChanged
  ) {
    const secretsDirectory = mkdtempSync(join(tmpdir(), 'allowlist-env-'));
    const environmentFile = join(secretsDirectory, 'environment.json');
    try {
      writeFileSync(
        environmentFile,
        JSON.stringify({ Variables: desiredEnvironment }),
        { mode: 0o600 },
      );
      aws([
        'lambda',
        'update-function-configuration',
        '--function-name',
        lambda.name,
        '--handler',
        lambda.handler,
        '--runtime',
        'nodejs24.x',
        '--environment',
        `file://${environmentFile}`,
        '--revision-id',
        configuration.revisionId,
        '--query',
        '[FunctionArn,Runtime,Handler,LastUpdateStatus]',
        '--output',
        'text',
      ]);
    } finally {
      rmSync(secretsDirectory, { recursive: true, force: true });
    }
    aws([
      'lambda',
      'wait',
      'function-updated-v2',
      '--function-name',
      lambda.name,
    ]);
  }
  aws([
    'lambda',
    'get-function-configuration',
    '--function-name',
    lambda.name,
    '--query',
    '[State,LastUpdateStatus,Runtime,Handler,CodeSize]',
    '--output',
    'text',
  ]);
}

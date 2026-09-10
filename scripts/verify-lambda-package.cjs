const {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} = require('node:fs');
const { createHash } = require('node:crypto');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const packageDirectory = join(process.cwd(), '.serverless');
const archives = readdirSync(packageDirectory).filter((file) =>
  file.endsWith('.zip'),
);

if (archives.length !== 1) {
  throw new Error(
    `Expected exactly one Lambda archive in .serverless, found ${archives.length}`,
  );
}

const archive = join(packageDirectory, archives[0]);
const entries = execFileSync('unzip', ['-Z1', archive], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
  .trim()
  .split('\n');

const requiredFiles = [
  'dist/api-lambda.js',
  'dist/api-lambda.js.map',
  'dist/worker-lambda.js',
  'dist/worker-lambda.js.map',
  'dist/token-pool-downloader-lambda.js',
  'dist/token-pool-downloader-lambda.js.map',
  'src/api-lambda.js',
  'src/worker-lambda.js',
  'src/token-pool-downloader-lambda.js',
  'config/database.json',
];
const requiredPrefixes = [
  'migrations/',
  'node_modules/@codegenie/serverless-express/',
  'node_modules/@nestjs/core/',
  'node_modules/@nestjs/platform-express/',
  'node_modules/@sentry/aws-serverless/',
  'node_modules/express/',
];

for (const file of requiredFiles) {
  if (!entries.includes(file)) {
    throw new Error(`Lambda archive is missing ${file}`);
  }
}

for (const prefix of requiredPrefixes) {
  if (!entries.some((entry) => entry.startsWith(prefix))) {
    throw new Error(`Lambda archive is missing ${prefix}`);
  }
}

const forbiddenPrefixes = [
  'node_modules/@nestjs/cli/',
  'node_modules/@sentry/cli/',
  'node_modules/esbuild/',
  'node_modules/eslint/',
  'node_modules/jest/',
  'node_modules/serverless/',
  'node_modules/supertest/',
  'node_modules/ts-jest/',
  'node_modules/ts-node/',
  'node_modules/typescript/',
];
const forbiddenEntries = entries.filter(
  (entry) =>
    (entry.startsWith('src/') && entry.endsWith('.ts')) ||
    entry.includes('serverless-plugin-typescript') ||
    entry.includes('serverless-plugin-warmup') ||
    forbiddenPrefixes.some((prefix) => entry.startsWith(prefix)),
);

if (forbiddenEntries.length > 0) {
  throw new Error(
    `Lambda archive contains development/build inputs:\n${forbiddenEntries
      .slice(0, 50)
      .join('\n')}`,
  );
}

const extractionDirectory = mkdtempSync(join(tmpdir(), 'allowlist-package-'));

function directorySize(directory) {
  let total = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    total += entry.isDirectory() ? directorySize(path) : statSync(path).size;
  }
  return total;
}

try {
  execFileSync('unzip', ['-q', archive, '-d', extractionDirectory]);
  for (const handler of [
    'api-lambda',
    'worker-lambda',
    'token-pool-downloader-lambda',
  ]) {
    const compiledHandler = readFileSync(
      join(extractionDirectory, `dist/${handler}.js`),
      'utf8',
    );
    if (!compiledHandler.includes('//# debugId=')) {
      throw new Error(`dist/${handler}.js has no injected Sentry debug ID`);
    }
  }
  execFileSync(
    process.execPath,
    [
      '-e',
      [
        "require('./dist/api-lambda.js')",
        "require('./dist/worker-lambda.js')",
        "require('./dist/token-pool-downloader-lambda.js')",
        "require('./src/api-lambda.js')",
        "require('./src/worker-lambda.js')",
        "require('./src/token-pool-downloader-lambda.js')",
      ].join(';'),
    ],
    {
      cwd: extractionDirectory,
      env: {
        ...process.env,
        NODE_OPTIONS: [
          '--no-experimental-require-module',
          process.env.NODE_OPTIONS,
        ]
          .filter(Boolean)
          .join(' '),
        SENTRY_DSN: '',
      },
      stdio: 'inherit',
    },
  );

  const uncompressedSize = directorySize(extractionDirectory);
  if (uncompressedSize >= 250 * 1024 * 1024) {
    throw new Error('Uncompressed artifact exceeds the 250 MiB Lambda limit');
  }
  const archiveSize = statSync(archive).size;
  if (archiveSize >= 50 * 1024 * 1024) {
    throw new Error('Artifact exceeds the 50 MiB direct-upload Lambda limit');
  }
  const sha256 = createHash('sha256')
    .update(readFileSync(archive))
    .digest('hex');
  console.log(
    `Verified ${archives[0]} (${(archiveSize / 1024 / 1024).toFixed(1)} MiB compressed, ${(uncompressedSize / 1024 / 1024).toFixed(1)} MiB uncompressed, SHA-256 ${sha256})`,
  );
} finally {
  rmSync(extractionDirectory, { recursive: true, force: true });
}

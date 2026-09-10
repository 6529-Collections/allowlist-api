const {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} = require('node:fs');
const { execFileSync } = require('node:child_process');
const { join, resolve } = require('node:path');

const projectDirectory = process.cwd();
const buildDirectory = join(projectDirectory, '.lambda-package');
const artifactDirectory = join(projectDirectory, '.serverless');
const archive = join(artifactDirectory, 'allowlist-api.zip');
const yarnEntrypoint = process.env.npm_execpath;

if (!yarnEntrypoint) {
  throw new Error('Run this packager through `yarn lambda:package`.');
}

for (const requiredDirectory of ['dist', 'config', 'migrations']) {
  if (!existsSync(join(projectDirectory, requiredDirectory))) {
    throw new Error(
      `Missing ${requiredDirectory}; run the application build before packaging.`,
    );
  }
}

rmSync(buildDirectory, { recursive: true, force: true });
rmSync(artifactDirectory, { recursive: true, force: true });
mkdirSync(buildDirectory, { recursive: true });
mkdirSync(artifactDirectory, { recursive: true });

for (const directory of ['dist', 'config', 'migrations']) {
  cpSync(join(projectDirectory, directory), join(buildDirectory, directory), {
    recursive: true,
  });
}
cpSync(join(projectDirectory, 'package.json'), join(buildDirectory, 'package.json'));

execFileSync(
  process.execPath,
  [
    yarnEntrypoint,
    'install',
    '--production=true',
    '--frozen-lockfile',
    '--ignore-scripts',
    '--modules-folder',
    join(buildDirectory, 'node_modules'),
    '--registry=https://registry.npmjs.org/',
  ],
  { cwd: projectDirectory, stdio: 'inherit' },
);

const compatibilityHandlers = {
  'api-lambda.js': "module.exports = require('../dist/api-lambda.js');\n",
  'worker-lambda.js': "module.exports = require('../dist/worker-lambda.js');\n",
  'token-pool-downloader-lambda.js':
    "module.exports = require('../dist/token-pool-downloader-lambda.js');\n",
};
const compatibilityDirectory = join(buildDirectory, 'src');
mkdirSync(compatibilityDirectory, { recursive: true });
for (const [file, contents] of Object.entries(compatibilityHandlers)) {
  writeFileSync(join(compatibilityDirectory, file), contents);
}

function pruneRuntimeTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '@types') {
        rmSync(path, { recursive: true, force: true });
      } else {
        pruneRuntimeTree(path);
      }
    } else if (entry.name.endsWith('.d.ts') || entry.name === '.yarn-integrity') {
      unlinkSync(path);
    }
  }
}

function normalizeTimestamps(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      normalizeTimestamps(path);
    }
    utimesSync(path, new Date(0), new Date(0));
  }
}

pruneRuntimeTree(buildDirectory);
normalizeTimestamps(buildDirectory);

execFileSync('zip', ['-X', '-q', '-r', resolve(archive), '.'], {
  cwd: buildDirectory,
  stdio: 'inherit',
});

console.log(
  `Created ${archive} (${(statSync(archive).size / 1024 / 1024).toFixed(1)} MiB)`,
);

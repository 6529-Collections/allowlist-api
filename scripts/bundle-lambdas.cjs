const { rmSync, renameSync } = require('node:fs');
const { build } = require('esbuild');

const compiledDirectory = 'dist';
const bundleDirectory = '.lambda-bundle';
const bundledNestPackages = new Set([
  '@nestjs/axios',
  '@nestjs/common',
  '@nestjs/config',
  '@nestjs/core',
  '@nestjs/jwt',
  '@nestjs/mapped-types',
  '@nestjs/passport',
  '@nestjs/platform-express',
  '@nestjs/schedule',
  '@nestjs/swagger',
]);

const runtimeDependencyBoundary = {
  name: 'runtime-dependency-boundary',
  setup(build) {
    build.onResolve({ filter: /^@nestjs\// }, (args) => {
      const packageName = args.path.split('/').slice(0, 2).join('/');
      if (bundledNestPackages.has(packageName)) {
        return {
          path: require.resolve(args.path, { paths: [args.resolveDir] }),
        };
      }
      return { path: args.path, external: true };
    });
    build.onResolve({ filter: /^[^.\/]/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

async function main() {
  rmSync(bundleDirectory, { recursive: true, force: true });

  try {
    await build({
      entryPoints: [
        `${compiledDirectory}/api-lambda.js`,
        `${compiledDirectory}/worker-lambda.js`,
        `${compiledDirectory}/token-pool-downloader-lambda.js`,
        `${compiledDirectory}/main.js`,
      ],
      outdir: bundleDirectory,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node24',
      banner: {
        js: 'var __bundleImportMetaUrl = require("node:url").pathToFileURL(__filename).href;',
      },
      define: {
        'import.meta.url': '__bundleImportMetaUrl',
      },
      sourcemap: true,
      sourcesContent: true,
      legalComments: 'none',
      logLevel: 'info',
      plugins: [runtimeDependencyBoundary],
    });
    rmSync(compiledDirectory, { recursive: true, force: true });
    renameSync(bundleDirectory, compiledDirectory);
  } catch (error) {
    rmSync(bundleDirectory, { recursive: true, force: true });
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

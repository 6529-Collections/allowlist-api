import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Logger } from '@nestjs/common';

const envs = ['local', 'development', 'production'];
const SECRET = 'prod/lambdas';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const logger = new Logger('env');

export async function initEnv() {
  if (!process.env.NODE_ENV) {
    await initEnvFromSecrets();
  } else {
    await initEnvFromLocal();
  }
}

async function initEnvFromSecrets() {
  logger.log('Loading secrets');

  const secretsManager = new SecretsManager({ region: 'us-east-1' });

  const secret = await secretsManager.getSecretValue({ SecretId: SECRET });

  if (secret.SecretString) {
    const secretValue = JSON.parse(secret.SecretString);

    Object.keys(secretValue).forEach(function (key) {
      process.env[key] = secretValue[key];
    });
  }

  if (!process.env.NODE_ENV) {
    logger.error(`NODE_ENV missing. Exiting...`);
    process.exit();
  }

  if (!envs.includes(process.env.NODE_ENV)) {
    logger.error(`Invalid environment '${process.env.NODE_ENV}'. Exiting...`);
    process.exit();
  }

  logger.log('Secrets loaded');
}

async function initEnvFromLocal() {
  const envPath = path.join(__dirname, '..', `.env.${process.env.NODE_ENV}`);
  const dotenvConfigOutput = dotenv.config({
    path: envPath,
  });
  Object.keys(dotenvConfigOutput.parsed).forEach(function (key) {
    process.env[key] = dotenvConfigOutput.parsed[key];
  });
}

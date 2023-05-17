/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process');
const controllerName = process.argv[2];

if (!controllerName) {
  console.error('Please provide an controller name.');
  process.exit(1);
}

const hygenCommand = `hygen api-endpoint new --controllerName ${controllerName}`;
exec(hygenCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing hygen command: ${error.message}`);
    console.error(`Error details: ${error}`);
    return;
  }

  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }

  console.log(`Output: ${stdout}`);
});

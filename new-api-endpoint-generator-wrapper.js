const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const requestedName = process.argv[2];
if (!requestedName || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(requestedName)) {
  console.error('Provide a controller name containing only letters, digits, _ or -.');
  process.exit(1);
}

const words = requestedName
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .split(/[-_\s]+/)
  .filter(Boolean)
  .map((word) => word.toLowerCase());
const className = words
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join('');
const variableName = className[0].toLowerCase() + className.slice(1);
const pathName = words.join('-');
const endpointDirectory = join('src', 'api', pathName);
const controllerFile = join(endpointDirectory, `${pathName}.controller.ts`);
const serviceFile = join(endpointDirectory, `${pathName}.service.ts`);

if (existsSync(controllerFile) || existsSync(serviceFile)) {
  throw new Error(`Endpoint ${pathName} already exists.`);
}

mkdirSync(join(endpointDirectory, 'models'), { recursive: true });
writeFileSync(join(endpointDirectory, 'models', '.gitkeep'), '');
writeFileSync(
  controllerFile,
  `import { Controller } from '@nestjs/common';\nimport { ${className}Service } from './${pathName}.service';\n\n@Controller('your-controller-endpoint/${pathName}')\nexport class ${className}Controller {\n  constructor(private readonly ${variableName}Service: ${className}Service) {}\n}\n`,
);
writeFileSync(
  serviceFile,
  `import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class ${className}Service {}\n`,
);

const apiModulePath = join('src', 'api', 'api.module.ts');
let apiModule = readFileSync(apiModulePath, 'utf8');
const injections = [
  [
    '// Placeholder for future imports',
    `import { ${className}Service } from './${pathName}/${pathName}.service';\nimport { ${className}Controller } from './${pathName}/${pathName}.controller';\n`,
  ],
  [
    '    // Placeholder for future controllers',
    `    ${className}Controller,\n`,
  ],
  ['    // Placeholder for future services', `    ${className}Service,\n`],
];
for (const [marker, insertion] of injections) {
  if (!apiModule.includes(marker)) {
    throw new Error(`Missing ApiModule generator marker: ${marker}`);
  }
  apiModule = apiModule.replace(marker, `${insertion}${marker}`);
}
writeFileSync(apiModulePath, apiModule);
console.log(`Created ${className}Controller and ${className}Service.`);

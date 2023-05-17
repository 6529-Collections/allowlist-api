---
inject: true
to: src/api/api.module.ts
before: // Placeholder for future imports
---
import { <%= controllerName %>Service } from './<%= h.changeCase.paramCase(controllerName) %>/<%= h.changeCase.paramCase(controllerName) %>.service';
import { <%= controllerName %>Controller } from './<%= h.changeCase.paramCase(controllerName) %>/<%= h.changeCase.paramCase(controllerName) %>.controller';

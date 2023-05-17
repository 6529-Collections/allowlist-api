---
to: src/api/<%= h.changeCase.paramCase(controllerName) %>/<%= h.changeCase.paramCase(controllerName) %>.controller.ts
unless_exists: true
---
import { Controller } from '@nestjs/common';
import { <%= controllerName %>Service } from './<%= h.changeCase.paramCase(controllerName) %>.service';

@Controller('your-controller-endpoint/<%= h.changeCase.paramCase(controllerName) %>')
export class <%= controllerName %>Controller {
  constructor(private readonly <%= h.changeCase.camelCase(controllerName) %>Service: <%= controllerName %>Service) {}
}

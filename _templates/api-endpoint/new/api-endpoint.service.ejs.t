---
to: src/api/<%= h.changeCase.paramCase(controllerName) %>/<%= h.changeCase.paramCase(controllerName) %>.service.ts
unless_exists: true
---
import { Injectable } from '@nestjs/common';

@Injectable()
export class <%= controllerName %>Service {
  constructor() {}
}

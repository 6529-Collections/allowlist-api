import { Controller, Post } from '@nestjs/common';

@Controller('/allowlist')
export class AllowlistController {
  @Post()
  async create() {
    return 'does nothing yet';
  }
}

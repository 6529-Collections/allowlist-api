import { Injectable } from '@nestjs/common';
import { AllowlistRepository } from '../repository/allowlist/allowlist.repository';

@Injectable()
export class CommonService {
  constructor(private readonly allowlistRepository: AllowlistRepository) {}

  async deleteAllowlist(allowlistId: string): Promise<void> {
    await this.allowlistRepository.delete(allowlistId);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { AllowlistRunsRepository } from '../../repositories/allowlist-runs/allowlist-runs.repository';
import { AllowlistRunResponseApiModel } from './models/allowlist-run-response-api.model';
import { RunnerProxy } from '../../runs/runner-proxy';

@Injectable()
export class AllowlistRunsService {
  constructor(
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistRunsRepository: AllowlistRunsRepository,
    private readonly runnerProxy: RunnerProxy,
  ) {}

  async create(allowlistId: string): Promise<AllowlistRunResponseApiModel> {
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    const allowlistRunDto = await this.allowlistRunsRepository.save(
      allowlistId,
    );
    await this.runnerProxy.start(allowlistRunDto.id);
    return allowlistRunDto;
  }

  async get(
    allowlistId: string,
    runId: string,
  ): Promise<AllowlistRunResponseApiModel> {
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }

    const run = await this.allowlistRunsRepository.findById(runId);
    if (!run) {
      throw new BadRequestException(`Run with ID ${runId} does not exist`);
    }

    return run;
  }

  async getAllForAllowlist(
    allowlistId: string,
  ): Promise<AllowlistRunResponseApiModel[]> {
    const entity = await this.allowlistsRepository.findById(allowlistId);
    if (!entity) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }
    return this.allowlistRunsRepository.getAllForAllowlist(allowlistId);
  }
}

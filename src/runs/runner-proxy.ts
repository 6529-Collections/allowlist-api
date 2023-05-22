import { RunsService } from './runs.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RunnerProxy {
  private readonly logger = new Logger(RunnerProxy.name);
  constructor(private readonly runsService: RunsService) {}

  async start(allowlistId: string) {
    this.logger.log(
      `Starting run for allowlist ${allowlistId} in the same process`,
    );
    this.runsService.start(allowlistId);
    this.logger.log(
      `run for allowlist ${allowlistId} started in the same process`,
    );
  }
}

import { RunsService } from './runs.service';
import { Injectable, Logger } from '@nestjs/common';
import SnsService from '../sns/sns.service';

@Injectable()
export class RunnerProxy {
  private readonly logger = new Logger(RunnerProxy.name);

  constructor(
    private readonly runsService: RunsService,
    private readonly snsService: SnsService,
  ) {}

  async start(allowlistRunId: string) {
    if (process.env.SNS_TOPIC_ARN) {
      await this.snsService.publishMessage({ allowlistRunId });
    } else {
      this.logger.log(
        `Starting allowlist run ${allowlistRunId} in the same process`,
      );
      this.runsService.start(allowlistRunId);
      this.logger.log(
        `Allowlist run ${allowlistRunId} started in the same process`,
      );
    }
  }
}

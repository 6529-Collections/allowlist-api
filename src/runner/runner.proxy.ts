import { RunnerService } from './runner.service';
import { Injectable, Logger } from '@nestjs/common';
import SnsService from '../sns/sns.service';

@Injectable()
export class RunnerProxy {
  private readonly logger = new Logger(RunnerProxy.name);

  constructor(
    private readonly runsService: RunnerService,
    private readonly snsService: SnsService,
  ) {}

  async start(allowlistId: string) {
    const snstopicarn = process.env.SNS_TOPIC_ARN;
    this.logger.log(`Publishing about ${allowlistId} to ${snstopicarn}`);
    if (snstopicarn) {
      await this.snsService.publishMessage({ allowlistRunId: allowlistId });
    } else {
      this.logger.log(
        `Starting run for allowlist ${allowlistId} in the same process`,
      );
      this.runsService.start(allowlistId);
      this.logger.log(
        `Run for allowlist ${allowlistId} started in the same process`,
      );
    }
  }
}

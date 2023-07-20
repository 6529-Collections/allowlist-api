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
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    if (snsTopicArn) {
      await this.snsService.publishMessage({
        payload: { allowlistRunId: allowlistId },
        topicArn: snsTopicArn,
      });
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

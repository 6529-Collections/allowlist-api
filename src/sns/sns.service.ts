import { Injectable, Logger } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';

@Injectable()
export default class SnsService {
  private client: SNSClient;
  private readonly logger = new Logger(SnsService.name);

  constructor() {
    const region = process.env.ALLOWLIST_AWS_REGION;
    this.logger.log(`Loading secrets from region ${region}`);
    this.client = new SNSClient({ region });
  }

  async publishMessage(payload: any) {
    const topicArn = process.env.SNS_TOPIC_ARN;
    payload.randomId = randomUUID();
    const input = {
      TopicArn: topicArn,
      Message: JSON.stringify(payload),
      MessageGroupId: randomUUID(),
    };
    const response = await this.client.send(new PublishCommand(input));
    this.logger.log(
      `Message ${input.Message} sent to the topic ${input.TopicArn}`,
    );
    this.logger.log('MessageID is ' + response.MessageId);

    return {
      MessageId: response.MessageId,
      SequenceNumber: response.SequenceNumber,
    };
  }
}

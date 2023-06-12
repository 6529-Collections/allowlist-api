import { Injectable, Logger } from '@nestjs/common';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

@Injectable()
export default class SnsService {
  private client: SNSClient;
  private readonly logger = new Logger(SnsService.name);

  constructor() {
    this.client = new SNSClient({ region: 'us-east-1' });
  }

  async publishMessage(payload: any) {
    const topicArn = process.env.SNS_TOPIC_ARN;
    const input = {
      TopicArn: topicArn,
      Message: JSON.stringify(payload),
      MessageGroupId: 'messageGroup1',
    };
    // Create promise and SNS service object
    this.logger.log(`Publishing ${input.Message} to ${input.TopicArn}`);
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

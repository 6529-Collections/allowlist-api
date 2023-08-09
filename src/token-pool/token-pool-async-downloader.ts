import { Injectable, Logger } from '@nestjs/common';
import SnsService from '../sns/sns.service';
import { TokenPoolDownloaderService } from './token-pool-downloader.service';
import { TokenPoolDownloaderParams } from './token-pool.types';

@Injectable()
export class TokenPoolAsyncDownloader {
  private readonly logger = new Logger(TokenPoolAsyncDownloader.name);

  constructor(
    private readonly tokenPoolDownloaderService: TokenPoolDownloaderService,
    private readonly snsService: SnsService,
  ) {}

  async start({ config, state }: TokenPoolDownloaderParams) {
    const {
      contract,
      tokenIds,
      tokenPoolId,
      allowlistId,
      blockNo,
      consolidateBlockNo,
    } = config;

    await this.tokenPoolDownloaderService.prepare({
      contract,
      tokenIds,
      tokenPoolId,
      allowlistId,
      blockNo,
      consolidateBlockNo,
    });
    const snsTopicArn = process.env.SNS_TOKEN_POOL_DOWNLOADER_TOPIC_ARN;
    if (snsTopicArn) {
      await this.snsService.publishMessage({
        payload: { config, state },
        topicArn: snsTopicArn,
      });
    } else {
      this.logger.log(
        `Starting to download tokenpool ${tokenPoolId} in the same process`,
      );
      this.tokenPoolDownloaderService
        .start({ config, state })
        .then(async (result) => {
          if (result?.continue) {
            return await this.start({ config, state });
          }
          return result;
        });
      this.logger.log(
        `Tokenpool ${tokenPoolId} download started in the same process`,
      );
    }
  }
}

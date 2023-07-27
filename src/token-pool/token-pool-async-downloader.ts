import { Injectable, Logger } from '@nestjs/common';
import SnsService from '../sns/sns.service';
import { TokenPoolDownloaderService } from './token-pool-downloader.service';

@Injectable()
export class TokenPoolAsyncDownloader {
  private readonly logger = new Logger(TokenPoolAsyncDownloader.name);

  constructor(
    private readonly tokenPoolDownloaderService: TokenPoolDownloaderService,
    private readonly snsService: SnsService,
  ) {}

  async start({
    contract,
    tokenIds,
    tokenPoolId,
    allowlistId,
    blockNo,
    consolidateWallets,
  }: {
    readonly contract: string;
    readonly tokenIds?: string;
    readonly tokenPoolId: string;
    readonly allowlistId: string;
    readonly blockNo: number;
    readonly consolidateWallets: boolean;
  }) {
    await this.tokenPoolDownloaderService.prepare({
      contract,
      tokenIds,
      tokenPoolId,
      allowlistId,
      blockNo,
      consolidateWallets,
    });
    const snsTopicArn = process.env.SNS_TOKEN_POOL_DOWNLOADER_TOPIC_ARN;
    if (snsTopicArn) {
      await this.snsService.publishMessage({
        payload: { tokenPoolId: tokenPoolId },
        topicArn: snsTopicArn,
      });
    } else {
      this.logger.log(
        `Starting to download tokenpool ${tokenPoolId} in the same process`,
      );
      this.tokenPoolDownloaderService.start(tokenPoolId);
      this.logger.log(
        `Tokenpool ${tokenPoolId} download started in the same process`,
      );
    }
  }
}

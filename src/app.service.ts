import { Inject, Injectable, Logger } from '@nestjs/common';
import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { Time } from './time';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);
  constructor(
    @Inject(AllowlistCreator.name) private allowlistCreator: AllowlistCreator,
  ) {}

  //@Timeout(0)
  async run() {
    const operations: AllowlistOperation[] = [
      {
        code: AllowlistOperationCode.CREATE_ALLOWLIST,
        params: {
          id: 'allowlist-1',
          name: 'Allowlist 1',
          description: 'Allowlist 1 description',
        },
      },
      {
        code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
        params: {
          id: 'transfer-pool-1',
          name: 'Transfer Pool 1',
          description: 'Transfer Pool 1 description',
          contract: '0x33fd426905f149f8376e227d0c9d3340aad17af1',
          blockNo: 17195021,
        },
      },
    ];
    this.logger.log(`Doing mongo based prefill operations`);
    const mongoPrefillStart = Time.now();
    await this.allowlistCreator.execute(operations);
    this.logger.log(
      `Mongo based prefill took ${mongoPrefillStart.diffFromNow()}`,
    );
    this.logger.log(`Doing mongo based filled run`);
    const mongoFilledStart = Time.now();
    await this.allowlistCreator.execute(operations);
    this.logger.log(
      `Mongo based filled run took ${mongoFilledStart.diffFromNow()}`,
    );
    const local = AllowlistCreator.getInstance({
      etherscanApiKey: process.env.ETHERSCAN_API_KEY,
    });
    this.logger.log(`Doing a local prefill`);
    const localPrefillStart = Time.now();
    await local.execute(operations);
    this.logger.log(
      `Local prefill finished in ${localPrefillStart.diffFromNow()}`,
    );
    this.logger.log(`Doing a local filled run`);
    const localFilledStart = Time.now();
    await local.execute(operations);
    this.logger.log(
      `Local filled run finished in ${localFilledStart.diffFromNow()}`,
    );
  }
}

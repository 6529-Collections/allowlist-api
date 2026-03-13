import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AllowlistLibExecutionContext {
  readonly tokenPoolId: string;
  readonly contract: string;
  readonly blockNo: number;
  readonly consolidateBlockNo: number | null;
}

@Injectable()
export class AllowlistLibExecutionContextService {
  private readonly storage =
    new AsyncLocalStorage<AllowlistLibExecutionContext>();

  run<T>(
    context: AllowlistLibExecutionContext,
    callback: () => Promise<T> | T,
  ): Promise<T> | T {
    return this.storage.run(context, callback);
  }

  getLogPrefix(): string {
    const context = this.storage.getStore();
    if (!context) {
      return '';
    }
    return [
      `tokenPoolId=${context.tokenPoolId}`,
      `contract=${context.contract}`,
      `blockNo=${context.blockNo}`,
      `consolidateBlockNo=${context.consolidateBlockNo ?? 'null'}`,
    ].join(' ');
  }
}

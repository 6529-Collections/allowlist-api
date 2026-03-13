import { AllowlistLibExecutionContextService } from '../allowlist-lib/allowlist-lib-execution-context.service';
import { TokenPoolDownloaderService } from './token-pool-downloader.service';

describe('TokenPoolDownloaderService', () => {
  it('marks the token pool as failed when allowlist execution times out', async () => {
    const tokenPoolDownloadRepository = {
      changeStatusToError: jest.fn(),
    };
    const service = new TokenPoolDownloaderService(
      tokenPoolDownloadRepository as any,
      {} as any,
      {
        execute: jest.fn().mockRejectedValue(
          new Error(
            'Arweave CSV download timed out after 30000ms for https://arweave.net/example',
          ),
        ),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      new AllowlistLibExecutionContextService(),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(
      (service as any).runOperationsAndFinishUp({
        entity: {
          token_pool_id: 'pool-1',
          contract: '0xabc',
          token_ids: null,
          allowlist_id: 'allowlist-1',
          block_no: 123,
          consolidate_block_no: 456,
        },
        state: {
          runsCount: 1,
          startingBlocks: [],
        },
      }),
    ).rejects.toThrow(
      'Token pool pool-1 execution failed during consolidation or download: Arweave CSV download timed out after 30000ms for https://arweave.net/example',
    );
    expect(tokenPoolDownloadRepository.changeStatusToError).toHaveBeenCalledWith(
      {
        tokenPoolId: 'pool-1',
      },
    );

    consoleErrorSpy.mockRestore();
  });
});

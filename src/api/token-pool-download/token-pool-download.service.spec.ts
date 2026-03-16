import { TokenPoolDownloadService } from './token-pool-download.service';
import { TokenPoolDownloadStatus } from '../../repository/token-pool-download/token-pool-download-status';
import { TokenPoolDownloadStage } from '../../repository/token-pool-download/token-pool-download-stage';

describe('TokenPoolDownloadService', () => {
  afterEach(() => {
    delete process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS;
    jest.restoreAllMocks();
  });

  it('maps stale downloads to failed while preserving the raw status', async () => {
    process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS = '1200000';
    jest.spyOn(Date, 'now').mockReturnValue(2_500_000);
    const tokenPoolDownloadRepository = {
      getByAllowlistId: jest.fn().mockResolvedValue([
        {
          contract: '0xabc',
          token_ids: '1-2',
          token_pool_id: 'pool-1',
          allowlist_id: 'allowlist-1',
          block_no: 123,
          consolidate_block_no: null,
          status: TokenPoolDownloadStatus.CLAIMED,
          created_at: BigInt(1000),
          updated_at: BigInt(1000),
          claimed_at: BigInt(1000),
          last_heartbeat_at: BigInt(1000),
          attempt_count: 2,
          stage: TokenPoolDownloadStage.INDEXING_SINGLE,
          progress: JSON.stringify({ latestFetchedBlockNo: 99 }),
        },
      ]),
    };
    const service = new TokenPoolDownloadService(
      tokenPoolDownloadRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const response = await service.getByAllowlistId('allowlist-1');

    expect(response).toEqual([
      expect.objectContaining({
        tokenPoolId: 'pool-1',
        status: TokenPoolDownloadStatus.FAILED,
        rawStatus: TokenPoolDownloadStatus.CLAIMED,
        stale: true,
        attemptCount: 2,
        failureCount: 0,
        retryable: true,
        progress: { latestFetchedBlockNo: 99 },
      }),
    ]);
    expect(response[0].errorReason).toContain(
      'has not reported progress for more than 20 minutes',
    );
  });

  it('does not stale legacy claimed rows without timestamps', async () => {
    process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS = '1200000';
    jest.spyOn(Date, 'now').mockReturnValue(2_500_000);
    const tokenPoolDownloadRepository = {
      getByAllowlistId: jest.fn().mockResolvedValue([
        {
          contract: '0xabc',
          token_pool_id: 'pool-legacy',
          allowlist_id: 'allowlist-1',
          block_no: 123,
          consolidate_block_no: null,
          status: TokenPoolDownloadStatus.CLAIMED,
        },
      ]),
    };
    const service = new TokenPoolDownloadService(
      tokenPoolDownloadRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const response = await service.getByAllowlistId('allowlist-1');

    expect(response).toEqual([
      expect.objectContaining({
        tokenPoolId: 'pool-legacy',
        status: TokenPoolDownloadStatus.CLAIMED,
        rawStatus: TokenPoolDownloadStatus.CLAIMED,
        stale: false,
        retryable: false,
      }),
    ]);
  });

  it('retries a stale snapshot in place and records the stale failure history', async () => {
    process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS = '1200000';
    jest.spyOn(Date, 'now').mockReturnValue(2_500_000);
    const entity = {
      contract: '0xabc',
      token_pool_id: 'pool-1',
      allowlist_id: 'allowlist-1',
      block_no: 123,
      consolidate_block_no: null,
      status: TokenPoolDownloadStatus.CLAIMED,
      created_at: BigInt(1000),
      updated_at: BigInt(1000),
      claimed_at: BigInt(1000),
      last_heartbeat_at: BigInt(1000),
      attempt_count: 2,
      failure_count: 1,
      stage: TokenPoolDownloadStage.INDEXING_SINGLE,
    };
    const tokenPoolDownloadRepository = {
      getByAllowlistId: jest.fn(),
      getByTokenPoolId: jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce({
          ...entity,
          status: TokenPoolDownloadStatus.PENDING,
          created_at: BigInt(2_500_000),
          updated_at: BigInt(2_500_000),
          last_heartbeat_at: BigInt(2_500_000),
          failure_count: 2,
          last_failure_reason:
            'Token pool download has not reported progress for more than 20 minutes while in stage INDEXING_SINGLE',
        }),
      recordFailureHistory: jest.fn().mockResolvedValue(undefined),
    };
    const allowlistOperationRepository = {
      getAllowlistOperationsByCode: jest.fn().mockResolvedValue([
        {
          params: JSON.stringify({
            id: 'pool-1',
            contract: '0xabc',
            blockNo: 123,
            consolidateBlockNo: null,
          }),
        },
      ]),
    };
    const tokenPoolAsyncDownloader = {
      start: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TokenPoolDownloadService(
      tokenPoolDownloadRepository as any,
      {} as any,
      {} as any,
      allowlistOperationRepository as any,
      tokenPoolAsyncDownloader as any,
    );

    const response = await service.retry({
      allowlistId: 'allowlist-1',
      tokenPoolId: 'pool-1',
    });

    expect(tokenPoolDownloadRepository.recordFailureHistory).toHaveBeenCalled();
    expect(tokenPoolAsyncDownloader.start).toHaveBeenCalledWith({
      config: {
        tokenPoolId: 'pool-1',
        tokenIds: undefined,
        contract: '0xabc',
        blockNo: 123,
        consolidateBlockNo: null,
        allowlistId: 'allowlist-1',
      },
      state: {
        runsCount: 0,
        startingBlocks: [],
      },
    });
    expect(response).toEqual(
      expect.objectContaining({
        tokenPoolId: 'pool-1',
        status: TokenPoolDownloadStatus.PENDING,
        failureCount: 2,
      }),
    );
  });

  it('throws if a retry cannot refetch the token pool download row', async () => {
    process.env.TOKEN_POOL_DOWNLOAD_STALE_AFTER_MS = '1200000';
    jest.spyOn(Date, 'now').mockReturnValue(2_500_000);
    const entity = {
      contract: '0xabc',
      token_pool_id: 'pool-1',
      allowlist_id: 'allowlist-1',
      block_no: 123,
      consolidate_block_no: null,
      status: TokenPoolDownloadStatus.FAILED,
      created_at: BigInt(1000),
      updated_at: BigInt(1000),
      claimed_at: BigInt(1000),
      last_heartbeat_at: BigInt(1000),
      attempt_count: 2,
      failure_count: 1,
      stage: TokenPoolDownloadStage.FAILED,
    };
    const tokenPoolDownloadRepository = {
      getByAllowlistId: jest.fn(),
      getByTokenPoolId: jest
        .fn()
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(null),
      recordFailureHistory: jest.fn().mockResolvedValue(undefined),
    };
    const allowlistOperationRepository = {
      getAllowlistOperationsByCode: jest.fn().mockResolvedValue([
        {
          params: JSON.stringify({
            id: 'pool-1',
            contract: '0xabc',
            blockNo: 123,
            consolidateBlockNo: null,
          }),
        },
      ]),
    };
    const tokenPoolAsyncDownloader = {
      start: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TokenPoolDownloadService(
      tokenPoolDownloadRepository as any,
      {} as any,
      {} as any,
      allowlistOperationRepository as any,
      tokenPoolAsyncDownloader as any,
    );

    await expect(
      service.retry({
        allowlistId: 'allowlist-1',
        tokenPoolId: 'pool-1',
      }),
    ).rejects.toThrow(
      'Token pool download with ID pool-1 no longer exists after retry',
    );
  });
});

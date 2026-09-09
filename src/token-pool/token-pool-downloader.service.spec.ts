import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AlchemyApiClient } from '../alchemy-api/alchemy-api.client';
import { DB } from '../repository/db';
import { TokenPoolDownloadEntity } from '../repository/token-pool-download/token-pool-download.entity';
import { TokenPoolDownloadRepository } from '../repository/token-pool-download/token-pool-download.repository';
import { TokenPoolDownloadStatus } from '../repository/token-pool-download/token-pool-download-status';
import { TokenPoolTokenRepository } from '../repository/token-pool-token/token-pool-token.repository';
import { TransferRepository } from '../repository/transfer/transfer.repository';
import { TokenPoolDownloaderService } from './token-pool-downloader.service';

describe(TokenPoolDownloaderService.name, () => {
  const getOwnersForContract = jest.fn();
  let service: TokenPoolDownloaderService;
  const entity = {
    contract: '0x1111111111111111111111111111111111111111',
    token_pool_id: 'token-pool',
    allowlist_id: 'allowlist',
    block_no: 12_345_678,
    consolidate_block_no: null,
    status: TokenPoolDownloadStatus.CLAIMED,
  } as TokenPoolDownloadEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenPoolDownloaderService(
      {} as TokenPoolDownloadRepository,
      {} as TokenPoolTokenRepository,
      {} as AllowlistCreator,
      {} as TransferRepository,
      {
        nft: { getOwnersForContract },
      } as unknown as AlchemyApiClient,
      {} as DB,
    );
  });

  it('selects the fast path when a historical owner snapshot is available', async () => {
    getOwnersForContract.mockResolvedValue({
      owners: [
        {
          ownerAddress: '0x2222222222222222222222222222222222222222',
          tokenBalances: [{ tokenId: '0x2a', balance: 2 }],
        },
      ],
      pageKey: 'next-page',
    });

    await expect((service as any).attemptThroughAlchemy(entity)).resolves.toBe(
      true,
    );
    expect(getOwnersForContract).toHaveBeenCalledWith(entity.contract, {
      withTokenBalances: true,
      block: entity.block_no.toString(),
    });
  });

  it('selects the Etherscan fallback when historical owner probing fails', async () => {
    getOwnersForContract.mockRejectedValue(new Error('snapshot unavailable'));

    await expect((service as any).attemptThroughAlchemy(entity)).resolves.toBe(
      false,
    );
  });
});

import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AlchemyApiService } from '../../alchemy-api/alchemy-api.service';
import { UpstreamProviderError } from '../../common/upstream-provider.error';
import { EtherscanApiService } from '../../etherscan-api/etherscan-api.service';
import { SeizeApiService } from '../../seize-api/seize-api.service';
import { Time } from '../../time';
import { TransposeApiService } from '../../transpose-api/transpose-api.service';
import { OtherService } from './other.service';

describe(OtherService.name, () => {
  const getBlockNumber = jest.fn();
  const getAlchemyTokenIds = jest.fn();
  const getTransposeTokenIds = jest.fn();
  const getBlockTimeMillis = jest.fn();
  let service: OtherService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OtherService(
      {
        getBlockNumber,
        getContractTokenIds: getAlchemyTokenIds,
      } as unknown as AlchemyApiService,
      {
        getContractTokenIds: getTransposeTokenIds,
      } as unknown as TransposeApiService,
      {} as SeizeApiService,
      { getBlockTimeMillis } as unknown as EtherscanApiService,
    );
    jest.spyOn((service as any).logger, 'warn').mockImplementation();
  });

  it('uses one shared provider context for both batch prediction bounds', async () => {
    jest.spyOn(Time, 'currentMillis').mockReturnValue(1_000_000);
    getBlockNumber.mockResolvedValue(24_000_000);
    getBlockTimeMillis.mockResolvedValue(12_000);

    await service.predictBlockNumbers({
      minTimestamp: 1_012_000,
      maxTimestamp: 1_024_000,
      blockNumberIncludes: [1],
    });

    expect(getBlockNumber).toHaveBeenCalledTimes(1);
    expect(getBlockTimeMillis).toHaveBeenCalledTimes(1);
    expect(getBlockTimeMillis).toHaveBeenCalledWith({
      currentBlock: 24_000_000,
    });
  });

  it('paginates Transpose token IDs until completion', async () => {
    getTransposeTokenIds
      .mockResolvedValueOnce({ tokens: ['1'], continuation: '1' })
      .mockResolvedValueOnce({ tokens: ['2', '3'], continuation: null });

    await expect(
      service.getContractTokenIdsAsString(
        '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      ),
    ).resolves.toEqual({ tokenIds: '1-3' });
    expect(getTransposeTokenIds).toHaveBeenNthCalledWith(1, {
      address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      continuation: null,
    });
    expect(getTransposeTokenIds).toHaveBeenNthCalledWith(2, {
      address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      continuation: '1',
    });
    expect(getAlchemyTokenIds).not.toHaveBeenCalled();
  });

  it('falls back through real Alchemy V3 pages without changing large IDs', async () => {
    const largeTokenId = '900719925474099312345678901234567890';
    const pageKey =
      '0x0000000000000000000000000000000000000000000000000000000000000003';
    getTransposeTokenIds.mockRejectedValue(
      new UpstreamProviderError('Transpose', 'unavailable', 503),
    );
    getAlchemyTokenIds
      .mockResolvedValueOnce({
        tokens: ['2'],
        continuation: pageKey,
      })
      .mockResolvedValueOnce({
        tokens: ['3', largeTokenId],
        continuation: null,
      });

    await expect(
      service.getContractTokenIdsAsString(
        '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      ),
    ).resolves.toEqual({ tokenIds: `2-3,${largeTokenId}` });
    expect(getAlchemyTokenIds).toHaveBeenNthCalledWith(1, {
      address: '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      continuation: null,
    });
    expect(getAlchemyTokenIds).toHaveBeenNthCalledWith(2, {
      address: '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      continuation: pageKey,
    });
  });

  it('rejects repeated provider pagination tokens before looping', async () => {
    const getPage = jest
      .fn()
      .mockResolvedValue({ tokens: ['1'], continuation: 'same-page' });

    await expect(
      (service as any).collectTokenIds(getPage),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
    expect(getPage).toHaveBeenCalledTimes(2);
  });

  it('maps exhausted temporary providers to a stable 503', async () => {
    getTransposeTokenIds.mockRejectedValue(
      new UpstreamProviderError('Transpose', 'unavailable', 503),
    );
    getAlchemyTokenIds.mockRejectedValue(
      new UpstreamProviderError('Alchemy', 'rate-limited', 429),
    );

    await expect(
      service.getContractTokenIdsAsString(
        '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps invalid fallback responses to a stable 502', async () => {
    getTransposeTokenIds.mockRejectedValue(
      new UpstreamProviderError('Transpose', 'rejected', 403),
    );
    getAlchemyTokenIds.mockRejectedValue(
      new UpstreamProviderError('Alchemy', 'invalid-response', 200),
    );

    await expect(
      service.getContractTokenIdsAsString(
        '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('preserves a permanent primary failure when the fallback is temporary', async () => {
    getTransposeTokenIds.mockRejectedValue(
      new UpstreamProviderError('Transpose', 'invalid-response', 200),
    );
    getAlchemyTokenIds.mockRejectedValue(
      new UpstreamProviderError('Alchemy', 'rate-limited', 429),
    );

    await expect(
      service.getContractTokenIdsAsString(
        '0x07e24ee32163da59297b5341bef8f8a2eead271e',
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps Etherscan rate limits to a stable 503', async () => {
    jest.spyOn(Time, 'currentMillis').mockReturnValue(1_000_000);
    getBlockNumber.mockResolvedValue(24_000_000);
    getBlockTimeMillis.mockRejectedValue(
      new UpstreamProviderError('Etherscan', 'rate-limited', 200),
    );

    await expect(
      service.predictBlockNumber({ timestamp: 1_012_000 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

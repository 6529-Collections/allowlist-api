import { HttpService } from '@nestjs/axios';
import { UpstreamProviderError } from '../common/upstream-provider.error';
import { EtherscanApiService } from './etherscan-api.service';

describe(EtherscanApiService.name, () => {
  const axiosGet = jest.fn();
  let service: EtherscanApiService;

  const successResponse = {
    data: {
      status: '1',
      message: 'OK',
      result: {
        CurrentBlock: '24000000',
        CountdownBlock: '24000010',
        RemainingBlock: '10',
        EstimateTimeInSec: '120',
      },
    },
    headers: { 'x-request-id': 'etherscan-request' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALLOWLIST_ETHERSCAN_API_KEY = 'test-key';
    service = new EtherscanApiService({
      axiosRef: { get: axiosGet },
    } as unknown as HttpService);
  });

  it('uses one defect-free countdown request and calculates block time', async () => {
    axiosGet.mockResolvedValue(successResponse);

    await expect(
      service.getBlockTimeMillis({ blockNumber: 24_000_010 }),
    ).resolves.toBe(12_000);
    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(axiosGet).toHaveBeenCalledWith('https://api.etherscan.io/v2/api', {
      params: {
        chainid: '1',
        module: 'block',
        action: 'getblockcountdown',
        blockno: 24_000_010,
        apikey: 'test-key',
      },
    });
  });

  it('retries provider rate-limit responses with bounded backoff', async () => {
    axiosGet
      .mockResolvedValueOnce({
        data: {
          status: '0',
          message: 'NOTOK',
          result: 'Max calls per sec rate limit reached (3/sec)',
        },
        headers: {},
      })
      .mockResolvedValueOnce(successResponse);
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    await expect(
      service.getBlockTimeMillis({ blockNumber: 24_000_010 }),
    ).resolves.toBe(12_000);
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect((service as any).sleep).toHaveBeenCalledWith(500);
  });

  it('coalesces concurrent requests and caches the estimate', async () => {
    axiosGet.mockResolvedValue(successResponse);

    const first = service.getBlockTimeMillis({ blockNumber: 24_000_010 });
    const second = service.getBlockTimeMillis({ blockNumber: 24_000_020 });

    await expect(Promise.all([first, second])).resolves.toEqual([
      12_000, 12_000,
    ]);
    await expect(
      service.getBlockTimeMillis({ blockNumber: 24_000_030 }),
    ).resolves.toBe(12_000);
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('classifies exhausted rate limits as temporary provider failures', async () => {
    axiosGet.mockResolvedValue({
      data: {
        status: '0',
        message: 'NOTOK',
        result: 'Max calls per sec rate limit reached (3/sec)',
      },
      headers: { 'x-request-id': 'rate-limit-request' },
    });
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
    jest.spyOn((service as any).logger, 'error').mockImplementation();

    const result = service.getBlockTimeMillis({ blockNumber: 24_000_010 });
    await expect(result).rejects.toMatchObject<Partial<UpstreamProviderError>>({
      kind: 'rate-limited',
      upstreamStatus: 200,
      requestId: 'rate-limit-request',
      isTemporary: true,
    });
    expect(axiosGet).toHaveBeenCalledTimes(3);
  });
});

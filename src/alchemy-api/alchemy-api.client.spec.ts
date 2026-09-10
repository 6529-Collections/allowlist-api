import { HttpService } from '@nestjs/axios';
import { jest } from '@jest/globals';
import { AlchemyClient as AllowlistAlchemyClient } from '@6529-collections/allowlist-lib';
import { AlchemyService } from '@6529-collections/allowlist-lib/services/alchemy.service';
import { AlchemyApiClient, AlchemyJsonRpcProvider } from './alchemy-api.client';
import { AlchemyConfig } from './alchemy.config';

describe(AlchemyApiClient.name, () => {
  const axiosGet = jest.fn();
  const getBlockNumber = jest.fn();
  const resolveName = jest.fn();
  const lookupAddress = jest.fn();
  let client: AlchemyApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AlchemyApiClient(
      new AlchemyConfig({ key: 'api key/with-special-characters' }),
      { axiosRef: { get: axiosGet } } as unknown as HttpService,
      {
        getBlockNumber,
        resolveName,
        lookupAddress,
      } as AlchemyJsonRpcProvider,
    );
  });

  it('gets Ethereum mainnet block numbers through the JSON-RPC provider', async () => {
    getBlockNumber.mockResolvedValue(24_123_456);

    await expect(client.getBlockNumber()).resolves.toBe(24_123_456);
    expect(getBlockNumber).toHaveBeenCalledTimes(1);
  });

  it('passes through JSON-RPC provider errors', async () => {
    const providerError = new Error('RPC unavailable');
    getBlockNumber.mockRejectedValue(providerError);

    await expect(client.getBlockNumber()).rejects.toBe(providerError);
  });

  it('delegates ENS resolution and reverse lookup to the JSON-RPC provider', async () => {
    resolveName.mockResolvedValue(null);
    lookupAddress.mockResolvedValue('example.eth');

    await expect(client.core.resolveName('missing.eth')).resolves.toBeNull();
    await expect(
      client.core.lookupAddress('0x1111111111111111111111111111111111111111'),
    ).resolves.toBe('example.eth');
  });

  it('maps an unregistered ENS name to the legacy null result', async () => {
    resolveName.mockRejectedValue({
      code: 'CALL_EXCEPTION',
      revert: { name: 'ResolverNotFound' },
    });

    await expect(client.core.resolveName('missing.eth')).resolves.toBeNull();
  });

  it('preserves ENS provider failures unrelated to a missing resolver', async () => {
    const providerError = Object.assign(new Error('RPC unavailable'), {
      code: 'SERVER_ERROR',
    });
    resolveName.mockRejectedValue(providerError);

    await expect(client.core.resolveName('example.eth')).rejects.toBe(
      providerError,
    );
  });

  it('maps the maintained v3 contract metadata response to the existing contract', async () => {
    axiosGet.mockResolvedValue({
      data: {
        address: '0x1111111111111111111111111111111111111111',
        name: 'Collection',
        tokenType: 'erc721',
        openseaMetadata: {
          collectionName: 'OpenSea Collection',
          safelistRequestStatus: 'verified',
          imageUrl: 'https://example.com/image.png',
          description: 'Description',
        },
      },
    });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).resolves.toEqual({
      address: '0x1111111111111111111111111111111111111111',
      name: 'Collection',
      tokenType: 'ERC721',
      openSea: {
        collectionName: 'OpenSea Collection',
        safelistRequestStatus: 'verified',
        imageUrl: 'https://example.com/image.png',
        description: 'Description',
      },
    });
    expect(axiosGet).toHaveBeenCalledWith(
      'https://eth-mainnet.g.alchemy.com/nft/v3/api%20key%2Fwith-special-characters/getContractMetadata',
      {
        params: {
          contractAddress: '0x1111111111111111111111111111111111111111',
        },
        headers: { accept: '*/*' },
      },
    );
  });

  it('preserves an empty contract metadata response for service fallbacks', async () => {
    axiosGet.mockResolvedValue({ data: null });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).resolves.toBeNull();
  });

  it('filters unknown verification statuses in exact-address metadata', async () => {
    axiosGet.mockResolvedValue({
      data: {
        address: '0x1111111111111111111111111111111111111111',
        name: 'Collection',
        tokenType: 'ERC1155',
        openseaMetadata: { safelistRequestStatus: 'unrecognized' },
      },
    });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).resolves.toMatchObject({
      tokenType: 'ERC1155',
      openSea: { safelistRequestStatus: undefined },
    });
  });

  it('preserves historical owner options, token balances, and page keys', async () => {
    axiosGet.mockResolvedValue({
      data: {
        ownerAddresses: [
          {
            ownerAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
            tokenBalances: [{ tokenId: '0x2a', balance: '2' }],
          },
        ],
        pageKey: 'next-page',
      },
    });

    await expect(
      client.nft.getOwnersForContract(
        '0x1111111111111111111111111111111111111111',
        {
          withTokenBalances: true,
          block: '123456',
          pageKey: 'current-page',
        },
      ),
    ).resolves.toEqual({
      owners: [
        {
          ownerAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
          tokenBalances: [{ tokenId: '0x2a', balance: '2' }],
        },
      ],
      pageKey: 'next-page',
    });
    expect(axiosGet).toHaveBeenCalledWith(
      'https://eth-mainnet.g.alchemy.com/nft/v2/api%20key%2Fwith-special-characters/getOwnersForCollection',
      {
        params: {
          withTokenBalances: true,
          block: '123456',
          pageKey: 'current-page',
          contractAddress: '0x1111111111111111111111111111111111111111',
        },
        headers: { accept: '*/*' },
      },
    );
  });

  it('rejects malformed owner responses', async () => {
    axiosGet.mockResolvedValue({ data: null });

    await expect(
      client.nft.getOwnersForContract(
        '0x1111111111111111111111111111111111111111',
        { withTokenBalances: true },
      ),
    ).rejects.toThrow('Invalid Alchemy owners response');
  });

  it('preserves precision-safe contract token pagination semantics', async () => {
    const pageKey =
      '0x0000000000000000000000000000000000000000000000000000000000000003';
    axiosGet.mockResolvedValue({
      data: {
        nfts: [{ tokenId: '10' }, { tokenId: '42' }],
        pageKey,
      },
    });

    await expect(
      client.getContractTokenIds({
        address: '0x1111111111111111111111111111111111111111',
        continuation: pageKey,
      }),
    ).resolves.toEqual({
      tokens: ['10', '42'],
      continuation: pageKey,
    });
    expect(axiosGet).toHaveBeenCalledWith(
      'https://eth-mainnet.g.alchemy.com/nft/v3/api%20key%2Fwith-special-characters/getNFTsForContract',
      {
        params: {
          withMetadata: false,
          contractAddress: '0x1111111111111111111111111111111111111111',
          startToken: pageKey,
          limit: 100,
        },
        headers: { accept: '*/*' },
      },
    );
  });

  it('ends contract token pagination when Alchemy omits the page key', async () => {
    axiosGet.mockResolvedValue({
      data: { nfts: [{ tokenId: '9007199254740993' }] },
    });

    await expect(
      client.getContractTokenIds({
        address: '0x1111111111111111111111111111111111111111',
        continuation: null,
      }),
    ).resolves.toEqual({
      tokens: ['9007199254740993'],
      continuation: null,
    });
  });

  it('rejects malformed contract token responses and page keys', async () => {
    axiosGet.mockResolvedValueOnce({ data: {} });

    await expect(
      client.getContractTokenIds({
        address: '0x1111111111111111111111111111111111111111',
        continuation: null,
      }),
    ).rejects.toThrow('Invalid Alchemy contract tokens response');

    axiosGet.mockResolvedValueOnce({
      data: { nfts: [{ tokenId: '42' }], pageKey: 42 },
    });

    await expect(
      client.getContractTokenIds({
        address: '0x1111111111111111111111111111111111111111',
        continuation: null,
      }),
    ).rejects.toThrow('Invalid Alchemy contract tokens response');
  });

  it('maps non-retryable HTTP provider errors to the SDK-compatible error', async () => {
    axiosGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: 'invalid request' },
    });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).rejects.toThrow('400: invalid request');
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('preserves structured provider error details', async () => {
    axiosGet.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: { code: -32000, message: 'rate limited' },
      },
    });
    jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).rejects.toThrow('429: {"code":-32000,"message":"rate limited"}');
    expect(axiosGet).toHaveBeenCalledTimes(5);
  });

  it('retries rate-limited provider requests with bounded backoff', async () => {
    jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);
    axiosGet
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 429, data: 'rate limited' },
      })
      .mockResolvedValueOnce({ data: null });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).resolves.toBeNull();
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect((client as any).sleep).toHaveBeenCalledWith(1_000);
  });

  it('retries transient network and server errors', async () => {
    jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);
    axiosGet
      .mockRejectedValueOnce({ isAxiosError: true, message: 'socket reset' })
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 503, data: 'provider unavailable' },
      })
      .mockResolvedValueOnce({ data: null });

    await expect(
      client.getContractMetadata('0x1111111111111111111111111111111111111111'),
    ).resolves.toBeNull();
    expect(axiosGet).toHaveBeenCalledTimes(3);
  });
});

describe('allowlist-lib AlchemyClient contract', () => {
  it('paginates historical owner snapshots and converts token balances', async () => {
    const getOwnersForContract = jest
      .fn()
      .mockResolvedValueOnce({
        owners: [
          {
            ownerAddress: '0x1111111111111111111111111111111111111111',
            tokenBalances: [{ tokenId: '0x2a', balance: '2' }],
          },
        ],
        pageKey: 'second-page',
      })
      .mockResolvedValueOnce({
        owners: [
          {
            ownerAddress: '0x2222222222222222222222222222222222222222',
            tokenBalances: [{ tokenId: '0x2b', balance: 1 }],
          },
        ],
      });
    const alchemyService = new AlchemyService({
      nft: { getOwnersForContract },
      core: {
        resolveName: jest.fn(),
        lookupAddress: jest.fn(),
      },
    } as AllowlistAlchemyClient);

    await expect(
      alchemyService.getCollectionOwnersInBlock({
        contract: '0x3333333333333333333333333333333333333333',
        block: 123456,
      }),
    ).resolves.toEqual([
      {
        ownerAddress: '0x1111111111111111111111111111111111111111',
        tokens: [{ tokenId: '42', balance: 2 }],
      },
      {
        ownerAddress: '0x2222222222222222222222222222222222222222',
        tokens: [{ tokenId: '43', balance: 1 }],
      },
    ]);
    expect(getOwnersForContract).toHaveBeenNthCalledWith(
      1,
      '0x3333333333333333333333333333333333333333',
      {
        withTokenBalances: true,
        block: '123456',
        pageKey: undefined,
      },
    );
    expect(getOwnersForContract).toHaveBeenNthCalledWith(
      2,
      '0x3333333333333333333333333333333333333333',
      {
        withTokenBalances: true,
        block: '123456',
        pageKey: 'second-page',
      },
    );
  });
});

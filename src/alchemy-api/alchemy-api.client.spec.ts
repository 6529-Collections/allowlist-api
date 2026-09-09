import { HttpService } from '@nestjs/axios';
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

  it('maps v2 contract search results and filters unknown verification statuses', async () => {
    axiosGet.mockResolvedValue({
      data: [
        {
          address: '0x1111111111111111111111111111111111111111',
          contractMetadata: {
            name: 'Collection',
            tokenType: 'ERC1155',
            opensea: {
              safelistRequestStatus: 'unrecognized',
              description: 'Description',
            },
          },
        },
      ],
    });

    await expect(client.searchContractMetadata('collect')).resolves.toEqual([
      {
        address: '0x1111111111111111111111111111111111111111',
        name: 'Collection',
        tokenType: 'ERC1155',
        openSea: {
          collectionName: undefined,
          safelistRequestStatus: undefined,
          imageUrl: undefined,
          description: 'Description',
        },
      },
    ]);
    expect(axiosGet).toHaveBeenCalledWith(
      'https://eth-mainnet.g.alchemy.com/nft/v2/api%20key%2Fwith-special-characters/searchContractMetadata',
      {
        params: { query: 'collect' },
        headers: { accept: '*/*' },
      },
    );
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
    axiosGet.mockResolvedValue({ data: { owners: [] } });

    await expect(
      client.nft.getOwnersForContract(
        '0x1111111111111111111111111111111111111111',
        { withTokenBalances: true },
      ),
    ).rejects.toThrow('Invalid Alchemy owners response');
  });

  it('preserves contract token pagination semantics', async () => {
    axiosGet.mockResolvedValue({
      data: { nfts: [{ tokenId: '10' }, { tokenId: '11' }] },
    });

    await expect(
      client.getContractTokenIds({
        address: '0x1111111111111111111111111111111111111111',
        continuation: '10',
      }),
    ).resolves.toEqual({ tokens: ['10', '11'], continuation: '12' });
  });

  it('maps non-retryable HTTP provider errors to the SDK-compatible error', async () => {
    axiosGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: 'provider unavailable' },
    });

    await expect(client.searchContractMetadata('collection')).rejects.toThrow(
      '503: provider unavailable',
    );
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('retries rate-limited provider requests with bounded backoff', async () => {
    jest.spyOn(client as any, 'sleep').mockResolvedValue(undefined);
    axiosGet
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 429, data: 'rate limited' },
      })
      .mockResolvedValueOnce({ data: [] });

    await expect(client.searchContractMetadata('collection')).resolves.toEqual(
      [],
    );
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect((client as any).sleep).toHaveBeenCalledWith(1_000);
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

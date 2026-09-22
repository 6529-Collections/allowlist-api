import { HttpService } from '@nestjs/axios';
import { jest } from '@jest/globals';
import {
  AllowlistCreator,
  AllowlistOperationCode,
} from '@6529-collections/allowlist-lib';
import { ContractSchema } from '@6529-collections/allowlist-lib/app-types';
import { AlchemyService } from '@6529-collections/allowlist-lib/services/alchemy.service';
import { AlchemyApiClient, AlchemyJsonRpcProvider } from './alchemy-api.client';
import { AlchemyConfig } from './alchemy.config';

const CONTRACT = '0x33fd426905f149f8376e227d0c9d3340aad17af1';
const OWNER_10 = '0x1111111111111111111111111111111111111111';
const OWNER_16 = '0x2222222222222222222222222222222222222222';
const UINT256_MAX =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

describe('Alchemy ownership compatibility with the published library', () => {
  const axiosGet = jest.fn();
  let client: AlchemyApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AlchemyApiClient(
      new AlchemyConfig({ key: 'test-key' }),
      { axiosRef: { get: axiosGet } } as unknown as HttpService,
      {} as AlchemyJsonRpcProvider,
    );
  });

  it.each([
    ['0', '0'],
    ['10', '10'],
    ['16', '16'],
    ['00010', '10'],
    ['0x0a', '10'],
    ['0X0A', '10'],
    ['0x0010', '16'],
    ['9007199254740993', '9007199254740993'],
    [UINT256_MAX, UINT256_MAX],
    [`0x${'f'.repeat(64)}`, UINT256_MAX],
  ])(
    'preserves provider ID %s as decimal token %s',
    async (input, expected) => {
      axiosGet.mockResolvedValue({
        data: {
          ownerAddresses: [
            {
              ownerAddress: OWNER_10,
              tokenBalances: [{ tokenId: input, balance: '2' }],
            },
          ],
        },
      });
      await expect(
        new AlchemyService(client).getCollectionOwnersInBlock({
          contract: CONTRACT,
          block: 26031727,
        }),
      ).resolves.toEqual([
        { ownerAddress: OWNER_10, tokens: [{ tokenId: expected, balance: 2 }] },
      ]);
    },
  );

  it.each([
    '',
    ' ',
    ' 10',
    '10 ',
    '-1',
    '+10',
    '1.5',
    '1e2',
    '0x',
    '0xgg',
    'a',
    `${UINT256_MAX}0`,
    `0x1${'0'.repeat(64)}`,
    null,
    undefined,
    10,
  ])('rejects malformed or out-of-range owner token ID %s', async (tokenId) => {
    axiosGet.mockResolvedValue({
      data: {
        ownerAddresses: [
          {
            ownerAddress: OWNER_10,
            tokenBalances: [{ tokenId, balance: 1 }],
          },
        ],
      },
    });
    await expect(
      client.nft.getOwnersForContract(CONTRACT, {
        withTokenBalances: true,
        block: '26031727',
      }),
    ).rejects.toThrow('Invalid Alchemy owners token ID');
  });

  it.each([null, {}, { tokenBalances: null }, { tokenBalances: {} }])(
    'rejects malformed owner entry %j with a controlled provider error',
    async (owner) => {
      axiosGet.mockResolvedValue({ data: { ownerAddresses: [owner] } });
      await expect(
        client.nft.getOwnersForContract(CONTRACT, {
          withTokenBalances: true,
          block: '26031727',
        }),
      ).rejects.toThrow('Invalid Alchemy owners token balances');
    },
  );

  it.each([
    ['10', OWNER_10, 2],
    ['16', OWNER_16, 1],
  ])(
    'selects only token %s holders across provider pages',
    async (tokenId, owner, count) => {
      axiosGet
        .mockResolvedValueOnce({
          data: {
            ownerAddresses: [
              {
                ownerAddress: OWNER_10,
                tokenBalances: [{ tokenId: '10', balance: 2 }],
              },
            ],
            pageKey: 'page-two',
          },
        })
        .mockResolvedValueOnce({
          data: {
            ownerAddresses: [
              {
                ownerAddress: OWNER_16,
                tokenBalances: [{ tokenId: '16', balance: 1 }],
              },
            ],
          },
        });
      const creator = AllowlistCreator.getInstance({
        alchemy: client,
        etherscanApiKey: 'test-key',
        seizeApiPath: '',
        ofacCheckEnabled: false,
        storage: {
          tokenPoolStorage: { getTokenPoolTokens: async () => [] },
          transfersStorage: {
            getLatestTransferBlockNo: async () => 0,
            getContractTransfersOrdered: async () => [],
            saveContractTransfers: async () => {},
          },
        },
      });
      jest
        .spyOn(creator.etherscanService, 'getContractSchema')
        .mockResolvedValue(ContractSchema.ERC1155);

      const state = await creator.execute([
        {
          code: AllowlistOperationCode.CREATE_ALLOWLIST,
          params: {
            id: 'plan',
            name: 'Plan',
            description: 'Parser regression plan',
          },
        },
        {
          code: AllowlistOperationCode.CREATE_TOKEN_POOL,
          params: {
            id: 'pool',
            name: 'Pool',
            description: 'Parser regression pool',
            contract: CONTRACT,
            blockNo: 26031727,
            tokenIds: tokenId,
            consolidateBlockNo: null,
          },
        },
      ]);
      expect(state.tokenPools.pool.tokens).toEqual(
        Array.from({ length: count }, () => ({
          id: tokenId,
          owner,
          contract: CONTRACT,
        })),
      );
      expect(axiosGet).toHaveBeenCalledTimes(2);
      expect(axiosGet).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          params: {
            contractAddress: CONTRACT,
            withTokenBalances: true,
            block: '26031727',
            pageKey: 'page-two',
          },
        }),
      );
    },
  );
});

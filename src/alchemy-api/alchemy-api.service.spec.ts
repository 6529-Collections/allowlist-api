import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { Alchemy, OpenSeaSafelistRequestStatus } from 'alchemy-sdk';
import { AlchemyApiService } from './alchemy-api.service';
import { AlchemyConfig } from './alchemy.config';

const MEMES_CONTRACT = '0x33fd426905f149f8376e227d0c9d3340aad17af1';
const MEMES_CHECKSUM_CONTRACT = '0x33FD426905F149f8376e227d0C9D3340AaD17aF1';
const MEME_LAB_CONTRACT = '0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb';
const GRADIENT_CONTRACT = '0x0c58ef43ff3032005e472cb5709f8908acb00205';
const RAW_CONTRACT = '0x07e24ee32163da59297b5341bef8f8a2eead271e';

const CANONICAL_COLLECTIONS = [
  {
    address: MEMES_CONTRACT,
    name: 'The Memes by 6529',
    tokenType: 'ERC1155',
    imageUrl: 'https://6529.io/memes-preview.png',
    descriptionFragment: 'focused on the fight for the open metaverse',
  },
  {
    address: MEME_LAB_CONTRACT,
    name: 'Meme Lab',
    tokenType: 'ERC1155',
    imageUrl:
      'https://i2c.seadn.io/ethereum/35e37c625ffb45f3a5e669d5b267a1ad/dd9de48b32f23da6535a028f1d8c36/d1dd9de48b32f23da6535a028f1d8c36.jpeg',
    descriptionFragment: 'artists to run whatever experiments they like',
  },
  {
    address: GRADIENT_CONTRACT,
    name: '6529 Gradient',
    tokenType: 'ERC721',
    imageUrl:
      'https://i2c.seadn.io/ethereum/9415f36597d64ab9be239e0c818430d4/dfbae56955745a231e038d7ad712ac/0fdfbae56955745a231e038d7ad712ac.png',
    descriptionFragment: '98 grayscale gradients in-between',
  },
  {
    address: RAW_CONTRACT,
    name: '6529 RAW',
    tokenType: 'ERC721',
    imageUrl:
      'https://i2c.seadn.io/ethereum/37e7c49010bc4d2ea70fe6908c0659a4/30ad5c9e46fc60931cb68ae69e36ea/3b30ad5c9e46fc60931cb68ae69e36ea.png',
    descriptionFragment: "6529's CC0 personal photography collection",
  },
] as const;

describe(AlchemyApiService.name, () => {
  const getContractMetadata = jest.fn();
  const searchContractMetadata = jest.fn();
  let service: AlchemyApiService;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    service = new AlchemyApiService(
      {
        nft: {
          getContractMetadata,
          searchContractMetadata,
        },
      } as unknown as Alchemy,
      {} as AlchemyConfig,
      {} as HttpService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(CANONICAL_COLLECTIONS)(
    'fills degraded $name identity metadata with canonical values',
    async ({ address, name, tokenType, imageUrl, descriptionFragment }) => {
      getContractMetadata.mockResolvedValue({
        name: null,
        tokenType: 'UNKNOWN',
        openSea: null,
      });

      await expect(service.getContractMetadata(address)).resolves.toEqual({
        id: address,
        address,
        name,
        tokenType,
        imageUrl,
        description: expect.stringContaining(descriptionFragment),
        openseaVerified: false,
      });
    },
  );

  it('preserves valid provider metadata and verification status', async () => {
    getContractMetadata.mockResolvedValue({
      name: 'Provider Memes Name',
      tokenType: 'ERC1155',
      openSea: {
        description: 'Provider description',
        imageUrl: 'https://provider.example/memes.png',
        safelistRequestStatus: OpenSeaSafelistRequestStatus.VERIFIED,
      },
    });

    await expect(
      service.getContractMetadata(MEMES_CHECKSUM_CONTRACT),
    ).resolves.toEqual({
      id: MEMES_CHECKSUM_CONTRACT,
      address: MEMES_CHECKSUM_CONTRACT,
      name: 'Provider Memes Name',
      tokenType: 'ERC1155',
      imageUrl: 'https://provider.example/memes.png',
      description: 'Provider description',
      openseaVerified: true,
    });
  });

  it.each(CANONICAL_COLLECTIONS)(
    'returns canonical $name identity metadata when the provider returns no metadata',
    async ({ address, name, tokenType, imageUrl, descriptionFragment }) => {
      getContractMetadata.mockResolvedValue(null);

      await expect(service.getContractMetadata(address)).resolves.toEqual({
        id: address,
        address,
        name,
        tokenType,
        imageUrl,
        description: expect.stringContaining(descriptionFragment),
        openseaVerified: false,
      });
    },
  );

  it.each(CANONICAL_COLLECTIONS)(
    'returns canonical $name identity metadata when the provider fails',
    async ({ address, name, tokenType, imageUrl, descriptionFragment }) => {
      getContractMetadata.mockRejectedValue(new Error('provider unavailable'));

      await expect(service.getContractMetadata(address)).resolves.toEqual({
        id: address,
        address,
        name,
        tokenType,
        imageUrl,
        description: expect.stringContaining(descriptionFragment),
        openseaVerified: false,
      });
    },
  );

  it('only substitutes and logs degraded Memes fields', async () => {
    getContractMetadata.mockResolvedValue({
      name: 'Provider Memes Name',
      tokenType: 'ERC1155',
      openSea: {
        description: 'N/A',
        imageUrl: 'https://provider.example/memes.png',
        safelistRequestStatus: OpenSeaSafelistRequestStatus.VERIFIED,
      },
    });

    await expect(service.getContractMetadata(MEMES_CONTRACT)).resolves.toEqual(
      expect.objectContaining({
        name: 'Provider Memes Name',
        tokenType: 'ERC1155',
        imageUrl: 'https://provider.example/memes.png',
        description: expect.stringContaining(
          'focused on the fight for the open metaverse',
        ),
        openseaVerified: true,
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      `[CONTRACT_METADATA_CANONICAL_FALLBACK] address=${MEMES_CONTRACT} fields=description`,
    );
  });

  it('does not alter degraded metadata for other contracts', async () => {
    const address = '0x1111111111111111111111111111111111111111';
    getContractMetadata.mockResolvedValue({
      name: null,
      tokenType: 'UNKNOWN',
      openSea: null,
    });

    await expect(service.getContractMetadata(address)).resolves.toEqual({
      id: address,
      address,
      name: 'N/A',
      tokenType: 'UNKNOWN',
      imageUrl: null,
      description: 'N/A',
      openseaVerified: false,
    });
  });

  it('continues to propagate provider failures for other contracts', async () => {
    const address = '0x1111111111111111111111111111111111111111';
    const providerError = new Error('provider unavailable');
    getContractMetadata.mockRejectedValue(providerError);

    await expect(service.getContractMetadata(address)).rejects.toBe(
      providerError,
    );
  });

  it('applies the canonical fallback to configured collection search results', async () => {
    searchContractMetadata.mockResolvedValue([
      {
        address: MEME_LAB_CONTRACT,
        name: 'N/A',
        tokenType: 'UNKNOWN',
        openSea: null,
      },
    ]);

    await expect(service.searchContractMetadata('memes')).resolves.toEqual([
      expect.objectContaining({
        id: MEME_LAB_CONTRACT,
        address: MEME_LAB_CONTRACT,
        name: 'Meme Lab',
        tokenType: 'ERC1155',
        imageUrl: CANONICAL_COLLECTIONS[1].imageUrl,
      }),
    ]);
  });
});

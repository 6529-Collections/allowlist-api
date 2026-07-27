import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { Alchemy, OpenSeaSafelistRequestStatus } from 'alchemy-sdk';
import { AlchemyApiService } from './alchemy-api.service';
import { AlchemyConfig } from './alchemy.config';

const MEMES_CONTRACT = '0x33fd426905f149f8376e227d0c9d3340aad17af1';
const MEMES_CHECKSUM_CONTRACT = '0x33FD426905F149f8376e227d0C9D3340AaD17aF1';

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

  it('fills degraded Memes identity metadata with canonical values', async () => {
    getContractMetadata.mockResolvedValue({
      name: null,
      tokenType: 'UNKNOWN',
      openSea: null,
    });

    await expect(
      service.getContractMetadata(MEMES_CHECKSUM_CONTRACT),
    ).resolves.toEqual({
      id: MEMES_CONTRACT,
      address: MEMES_CONTRACT,
      name: 'The Memes by 6529',
      tokenType: 'ERC1155',
      imageUrl: 'https://6529.io/memes-preview.png',
      description: expect.stringContaining(
        'focused on the fight for the open metaverse',
      ),
      openseaVerified: false,
    });
  });

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

  it('returns canonical Memes identity metadata when the provider returns no metadata', async () => {
    getContractMetadata.mockResolvedValue(null);

    await expect(service.getContractMetadata(MEMES_CONTRACT)).resolves.toEqual({
      id: MEMES_CONTRACT,
      address: MEMES_CONTRACT,
      name: 'The Memes by 6529',
      tokenType: 'ERC1155',
      imageUrl: 'https://6529.io/memes-preview.png',
      description: expect.stringContaining(
        'focused on the fight for the open metaverse',
      ),
      openseaVerified: false,
    });
  });

  it('returns canonical Memes identity metadata when the provider fails', async () => {
    getContractMetadata.mockRejectedValue(new Error('provider unavailable'));

    await expect(service.getContractMetadata(MEMES_CONTRACT)).resolves.toEqual({
      id: MEMES_CONTRACT,
      address: MEMES_CONTRACT,
      name: 'The Memes by 6529',
      tokenType: 'ERC1155',
      imageUrl: 'https://6529.io/memes-preview.png',
      description: expect.stringContaining(
        'focused on the fight for the open metaverse',
      ),
      openseaVerified: false,
    });
  });

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

  it('applies the canonical fallback to Memes search results', async () => {
    searchContractMetadata.mockResolvedValue([
      {
        address: MEMES_CHECKSUM_CONTRACT,
        name: 'N/A',
        tokenType: 'UNKNOWN',
        openSea: null,
      },
    ]);

    await expect(service.searchContractMetadata('memes')).resolves.toEqual([
      expect.objectContaining({
        id: MEMES_CONTRACT,
        address: MEMES_CONTRACT,
        name: 'The Memes by 6529',
        tokenType: 'ERC1155',
        imageUrl: 'https://6529.io/memes-preview.png',
      }),
    ]);
  });
});

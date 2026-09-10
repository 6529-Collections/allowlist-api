import { HttpService } from '@nestjs/axios';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import request from 'supertest';
import {
  AlchemyApiClient,
  AlchemyJsonRpcProvider,
} from '../../alchemy-api/alchemy-api.client';
import { AlchemyApiService } from '../../alchemy-api/alchemy-api.service';
import { AlchemyConfig } from '../../alchemy-api/alchemy.config';
import { configureApiApplication } from '../../api-bootstrap';
import { EtherscanApiService } from '../../etherscan-api/etherscan-api.service';
import { SeizeApiService } from '../../seize-api/seize-api.service';
import { TransposeApiService } from '../../transpose-api/transpose-api.service';
import { OtherController } from './other.controller';
import { OtherService } from './other.service';

const CONTRACT = '0x1111111111111111111111111111111111111111';

describe('EMMA collection metadata HTTP routes', () => {
  const axiosGet = jest.fn();
  let app: INestApplication;

  beforeAll(async () => {
    const client = new AlchemyApiClient(
      new AlchemyConfig({ key: 'test-key' }),
      { axiosRef: { get: axiosGet } } as unknown as HttpService,
      {} as AlchemyJsonRpcProvider,
    );
    const service = new OtherService(
      new AlchemyApiService(client),
      {} as TransposeApiService,
      {} as SeizeApiService,
      {} as EtherscanApiService,
    );
    const module = await Test.createTestingModule({
      controllers: [OtherController],
      providers: [{ provide: OtherService, useValue: service }],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApiApplication(app);
    await app.init();
  });

  beforeEach(() => {
    axiosGet.mockReset();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 for retired keyword search without contacting Alchemy', async () => {
    await request(app.getHttpServer())
      .post('/other/search-contract-metadata')
      .send({ keyword: 'memes' })
      .expect(404);

    expect(axiosGet).not.toHaveBeenCalled();
  });

  it('removes keyword search from OpenAPI while preserving shared metadata schemas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body.paths).not.toHaveProperty(
      '/other/search-contract-metadata',
    );
    expect(response.body.components.schemas).not.toHaveProperty(
      'SearchContractMetadataRequestApiModel',
    );
    const metadataSchema = {
      $ref: '#/components/schemas/SearchContractMetadataResponseApiModel',
    };
    expect(
      response.body.paths['/other/contract-metadata/{contract}'].get.responses[
        '200'
      ].content['application/json'].schema,
    ).toEqual(metadataSchema);
    expect(
      response.body.paths['/other/memes-collections'].get.responses['200']
        .content['application/json'].schema,
    ).toEqual({ type: 'array', items: metadataSchema });
  });

  it('preserves arbitrary-contract metadata through the supported exact-address endpoint', async () => {
    axiosGet.mockResolvedValue({
      data: {
        address: CONTRACT,
        name: 'Another collection',
        tokenType: 'ERC721',
        openseaMetadata: {
          imageUrl: 'https://example.com/collection.png',
          description: 'Collection description',
          safelistRequestStatus: 'verified',
        },
      },
    });

    await request(app.getHttpServer())
      .get(`/other/contract-metadata/${CONTRACT}`)
      .expect(200)
      .expect({
        id: CONTRACT,
        address: CONTRACT,
        name: 'Another collection',
        tokenType: 'ERC721',
        floorPrice: null,
        imageUrl: 'https://example.com/collection.png',
        description: 'Collection description',
        allTimeVolume: null,
        openseaVerified: true,
      });

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(axiosGet).toHaveBeenCalledWith(
      'https://eth-mainnet.g.alchemy.com/nft/v3/test-key/getContractMetadata',
      {
        params: { contractAddress: CONTRACT },
        headers: { accept: '*/*' },
      },
    );
  });

  it.each(['empty', 'unavailable'])(
    'keeps all five shortcuts available when external metadata is %s',
    async (providerState) => {
      if (providerState === 'empty') {
        axiosGet.mockResolvedValue({ data: null });
      } else {
        axiosGet.mockRejectedValue(new Error('provider unavailable'));
      }

      const response = await request(app.getHttpServer())
        .get('/other/memes-collections')
        .expect(200);

      expect(response.body).toHaveLength(5);
      expect(
        response.body.map((collection: { name: string; tokenType: string }) => [
          collection.name,
          collection.tokenType.toUpperCase(),
        ]),
      ).toEqual([
        ['The Memes by 6529', 'ERC1155'],
        ['Meme Lab', 'ERC1155'],
        ['6529 Gradient', 'ERC721'],
        ['6529 RAW', 'ERC721'],
        ['6529 Intern JPGs', 'ERC1155'],
      ]);
      expect(response.body[4].id).toBe(
        '0x495f947276749ce646f68ac8c248420045cb7b5e:opensea-6529internjpg',
      );
      expect(axiosGet).toHaveBeenCalledTimes(4);
      for (const [url] of axiosGet.mock.calls) {
        expect(url).toBe(
          'https://eth-mainnet.g.alchemy.com/nft/v3/test-key/getContractMetadata',
        );
      }
    },
  );
});

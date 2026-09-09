import { HttpService } from '@nestjs/axios';
import { jest } from '@jest/globals';
import { UpstreamProviderError } from '../common/upstream-provider.error';
import { TransposeApiService } from './transpose-api.service';
import { TransposeConfig } from './transpose.config';

describe(TransposeApiService.name, () => {
  const axiosPost = jest.fn();
  let service: TransposeApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransposeApiService(
      new TransposeConfig({ key: 'test-key' }),
      { axiosRef: { post: axiosPost } } as unknown as HttpService,
    );
  });

  it('uses parameterized SQL and requests stringified token IDs', async () => {
    axiosPost.mockResolvedValue({
      status: 200,
      data: {
        status: 'success',
        stats: { truncated: false },
        results: [{ token_id: '900719925474099312345678901234567890' }],
      },
      headers: {},
    });

    await expect(
      service.getContractTokenIds({
        address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
        continuation: null,
      }),
    ).resolves.toEqual({
      tokens: ['900719925474099312345678901234567890'],
      continuation: null,
    });

    const [, body] = axiosPost.mock.calls[0];
    expect(body.sql).toContain(
      "WHERE contract_address IN ('{{address_lower}}', '{{address_checksum}}')",
    );
    expect(body.sql).not.toContain(
      '0x0c58ef43ff3032005e472cb5709f8908acb00205',
    );
    expect(body).toMatchObject({
      parameters: {
        address_lower: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
        address_checksum: '0x0C58Ef43fF3032005e472cB5709f8908aCb00205',
      },
      options: { stringify_numbers: true },
    });
  });

  it('creates a precision-safe keyset continuation for full pages', async () => {
    const largeTokenId = '900719925474099312345678901234567890';
    const results = Array.from({ length: 1_000 }, (_, index) => ({
      token_id: index === 999 ? largeTokenId : `${index + 1}`,
    }));
    axiosPost.mockResolvedValueOnce({
      status: 200,
      data: {
        status: 'success',
        stats: { truncated: false },
        results,
      },
      headers: {},
    });

    await expect(
      service.getContractTokenIds({
        address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
        continuation: null,
      }),
    ).resolves.toMatchObject({ continuation: largeTokenId });

    axiosPost.mockResolvedValueOnce({
      status: 200,
      data: {
        status: 'success',
        stats: { truncated: false },
        results: [],
      },
      headers: {},
    });
    await service.getContractTokenIds({
      address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      continuation: largeTokenId,
    });

    const [, secondBody] = axiosPost.mock.calls[1];
    expect(secondBody.sql).toContain(
      "token_id > CAST('{{continuation}}' AS NUMERIC)",
    );
    expect(secondBody.parameters.continuation).toBe(largeTokenId);
  });

  it('rejects truncated or non-string token responses', async () => {
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    axiosPost.mockResolvedValueOnce({
      status: 200,
      data: {
        status: 'success',
        stats: { truncated: true },
        results: [{ token_id: '1' }],
      },
      headers: {},
    });
    await expect(
      service.getContractTokenIds({
        address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
        continuation: null,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });

    axiosPost.mockResolvedValueOnce({
      status: 200,
      data: {
        status: 'success',
        stats: { truncated: false },
        results: [{ token_id: Number('9007199254740993') }],
      },
      headers: {},
    });
    await expect(
      service.getContractTokenIds({
        address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
        continuation: null,
      }),
    ).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('classifies rate limits without exposing credentials', async () => {
    jest.spyOn((service as any).logger, 'error').mockImplementation();
    axiosPost.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 429,
        data: { message: 'rate limit reached' },
        headers: { 'x-request-id': 'transpose-request' },
      },
    });

    const result = service.getContractTokenIds({
      address: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
      continuation: null,
    });
    await expect(result).rejects.toMatchObject<Partial<UpstreamProviderError>>({
      kind: 'rate-limited',
      upstreamStatus: 429,
      requestId: 'transpose-request',
      isTemporary: true,
    });
    expect((service as any).logger.error).toHaveBeenCalledWith(
      expect.not.stringContaining('test-key'),
    );
  });
});

import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import {
  LoggerFactory,
  LogListener,
} from '@6529-collections/allowlist-lib/logging/logging-emitter';
import { SeizeApi } from '@6529-collections/allowlist-lib/services/seize/seize.api';
import axios from 'axios';
import {
  parseTimeoutMs,
  patchAllowlistCreatorSeizeApi,
} from './allowlist-lib-seize-timeout-patch';

const minimalTdhUploadContents =
  'wallet,ens,consolidation_key,consolidation_display,block,date,total_balance,boosted_tdh,tdh_rank,tdh,tdh__raw,boost,memes_balance,unique_memes,memes_cards_sets,memes_cards_sets_minus1,memes_cards_sets_minus2,genesis,nakamoto,boosted_memes_tdh,memes_tdh,memes_tdh__raw,tdh_rank_memes,memes,gradients_balance,boosted_gradients_tdh,gradients_tdh,gradients_tdh__raw,tdh_rank_gradients,gradients,nextgen_balance,boosted_nextgen_tdh,nextgen_tdh,nextgen_tdh__raw,nextgen\n' +
  '0xAbC,test.eth,key,display,1,20240101,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,[],0,0,0,0,1,[],0,0,0,0,[]\n';

class TestLogListener implements LogListener {
  readonly infoMessages: string[] = [];
  readonly errorMessages: string[] = [];

  debug = (): void => {};

  error = (message: string): void => {
    this.errorMessages.push(message);
  };

  info = (message: string): void => {
    this.infoMessages.push(message);
  };

  warn = (): void => {};
}

describe('patchAllowlistCreatorSeizeApi', () => {
  const axiosGetSpy = jest.spyOn(axios, 'get');
  const axiosIsAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError');

  beforeEach(() => {
    jest.resetAllMocks();
    axiosIsAxiosErrorSpy.mockImplementation(
      (value: unknown): value is Error =>
        !!value && typeof value === 'object' && 'isAxiosError' in value,
    );
  });

  afterAll(() => {
    axiosGetSpy.mockRestore();
    axiosIsAxiosErrorSpy.mockRestore();
  });

  it('falls back to the configured default timeout when env is invalid', () => {
    expect(parseTimeoutMs(undefined, 10000)).toBe(10000);
    expect(parseTimeoutMs('not-a-number', 10000)).toBe(10000);
    expect(parseTimeoutMs('5000', 10000)).toBe(5000);
  });

  it('surfaces Seize metadata timeouts with the configured timeout value', async () => {
    const listener = new TestLogListener();
    const seizeApi = new SeizeApi({} as any, 'https://www.example.com/api');
    const allowlistCreator = { seizeApi } as unknown as AllowlistCreator;

    patchAllowlistCreatorSeizeApi({
      allowlistCreator,
      loggerFactory: new LoggerFactory(listener),
      seizeMetadataTimeoutMs: 10,
      arweaveDownloadTimeoutMs: 25,
    });

    axiosGetSpy.mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 10ms exceeded',
    });

    await expect(
      (seizeApi as any).getDataForBlock({ path: '/uploads', blockId: 123 }),
    ).rejects.toThrow(
      'Seize metadata fetch timed out after 10ms for https://www.example.com/api/uploads?block=123&page_size=1',
    );
    expect(listener.infoMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Fetching Seize metadata from https://www.example.com/api/uploads?block=123&page_size=1',
        ),
      ]),
    );
  });

  it('logs and falls back to the next Arweave gateway after a timeout', async () => {
    const listener = new TestLogListener();
    const seizeApi = new SeizeApi({} as any, 'https://www.example.com/api');
    const allowlistCreator = { seizeApi } as unknown as AllowlistCreator;

    patchAllowlistCreatorSeizeApi({
      allowlistCreator,
      loggerFactory: new LoggerFactory(listener),
      seizeMetadataTimeoutMs: 10,
      arweaveDownloadTimeoutMs: 25,
    });

    axiosGetSpy
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              block: 17531454,
              url: 'https://arweave.net/abc123',
            },
          ],
        },
      })
      .mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 25ms exceeded',
      })
      .mockResolvedValueOnce({
        data: minimalTdhUploadContents,
        headers: { 'content-type': 'text/csv; charset=utf-8' },
      });

    const uploads = await seizeApi.getUploadsForBlock(17531454);

    expect(uploads).toHaveLength(1);
    expect(uploads[0].wallet).toBe('0xabc');
    expect(listener.infoMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Downloading from URL: https://gateway.arweave.net/abc123',
        ),
      ]),
    );
    expect(listener.errorMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'Failed to download from URL: https://arweave.net/abc123 because of error: Arweave CSV download timed out after 25ms for https://arweave.net/abc123',
        ),
      ]),
    );
  });
});

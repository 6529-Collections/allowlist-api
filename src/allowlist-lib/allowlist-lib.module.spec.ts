import { ConfigService } from '@nestjs/config';
import { Alchemy } from 'alchemy-sdk';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { TransferRepository } from '../repository/transfer/transfer.repository';
import { TokenPoolTokenRepository } from '../repository/token-pool-token/token-pool-token.repository';
import { AllowlistLibLogListener } from './allowlist-lib-log-listener.service';
import { createAllowlistCreator } from './allowlist-lib.module';

describe('AllowlistLibModule', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [undefined, true],
    ['true', true],
    ['false', false],
    ['FALSE', true],
    ['0', true],
  ])('maps OFAC_CHECK=%s to ofacCheckEnabled=%s', (ofacCheck, expected) => {
    const configService = new ConfigService({
      ALLOWLIST_ETHERSCAN_API_KEY: 'etherscan-key',
      ALLOWLIST_SEIZE_API_PATH: 'https://example.com',
      ALLOWLIST_SEIZE_API_KEY: 'seize-key',
      OFAC_CHECK: ofacCheck,
    });
    const getInstance = jest
      .spyOn(AllowlistCreator, 'getInstance')
      .mockReturnValue({} as AllowlistCreator);

    createAllowlistCreator(
      configService,
      {} as TransferRepository,
      {} as TokenPoolTokenRepository,
      {} as AllowlistLibLogListener,
      {} as Alchemy,
    );

    expect(getInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        ofacCheckEnabled: expected,
      }),
    );
  });
});

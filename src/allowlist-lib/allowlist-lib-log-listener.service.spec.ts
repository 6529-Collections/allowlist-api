import { Logger } from '@nestjs/common';
import { AllowlistLibExecutionContextService } from './allowlist-lib-execution-context.service';
import { AllowlistLibLogListener } from './allowlist-lib-log-listener.service';

describe('AllowlistLibLogListener', () => {
  it('prefixes messages with token pool context when present', () => {
    const executionContext = new AllowlistLibExecutionContextService();
    const listener = new AllowlistLibLogListener(executionContext);
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    executionContext.run(
      {
        tokenPoolId: 'pool-1',
        contract: '0xabc',
        blockNo: 42,
        consolidateBlockNo: 99,
      },
      () => listener.info('Downloading from URL: https://arweave.net/example'),
    );

    expect(logSpy).toHaveBeenCalledWith(
      '[tokenPoolId=pool-1 contract=0xabc blockNo=42 consolidateBlockNo=99] Downloading from URL: https://arweave.net/example',
    );

    logSpy.mockRestore();
  });
});

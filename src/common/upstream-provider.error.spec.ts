import {
  getProviderRequestId,
  sanitizeProviderMessage,
} from './upstream-provider.error';

describe('upstream provider diagnostics', () => {
  it('redacts credentials and bounds provider messages', () => {
    const message = sanitizeProviderMessage({
      apiKey: 'secret-value',
      authorization: 'Bearer provider-token',
      message: 'request failed',
      padding: 'x'.repeat(500),
    });

    expect(message).not.toContain('secret-value');
    expect(message).not.toContain('provider-token');
    expect(message).toContain('[REDACTED]');
    expect(message?.length).toBeLessThanOrEqual(300);
  });

  it('reads request IDs from plain and Axios-style headers', () => {
    expect(getProviderRequestId({ 'x-request-id': 'plain-request' })).toBe(
      'plain-request',
    );
    expect(
      getProviderRequestId({
        get: (name: string) =>
          name === 'x-alchemy-trace-id' ? 'alchemy-request' : undefined,
      }),
    ).toBe('alchemy-request');
  });
});

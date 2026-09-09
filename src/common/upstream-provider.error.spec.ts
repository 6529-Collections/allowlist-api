import {
  getProviderRequestId,
  sanitizeProviderMessage,
} from './upstream-provider.error';

describe('upstream provider diagnostics', () => {
  it('redacts credentials and bounds provider messages', () => {
    const message = sanitizeProviderMessage({
      apiKey: 'secret-value',
      authorization: 'Bearer provider-token',
      access_token: 'access-token',
      private_key: 'private-key',
      message: 'request failed',
      padding: 'x'.repeat(500),
    });

    expect(message).not.toContain('secret-value');
    expect(message).not.toContain('provider-token');
    expect(message).not.toContain('access-token');
    expect(message).not.toContain('private-key');
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
          name === 'x-alchemy-trace-id'
            ? 'alchemy-request\r\ninjected-line'
            : undefined,
      }),
    ).toBe('alchemy-request injected-line');
  });
});

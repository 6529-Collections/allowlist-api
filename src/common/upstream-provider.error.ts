export type UpstreamProviderFailureKind =
  | 'invalid-response'
  | 'rate-limited'
  | 'rejected'
  | 'unavailable';

export class UpstreamProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly kind: UpstreamProviderFailureKind,
    readonly upstreamStatus?: number,
    readonly requestId?: string,
    readonly providerMessage?: string,
    errorMessage?: string,
  ) {
    super(errorMessage ?? `${provider} provider ${kind}`);
    this.name = UpstreamProviderError.name;
  }

  get isTemporary(): boolean {
    return this.kind === 'rate-limited' || this.kind === 'unavailable';
  }
}

export function sanitizeProviderMessage(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  let message: string;
  if (typeof value === 'string') {
    message = value;
  } else {
    try {
      message = JSON.stringify(value) ?? String(value);
    } catch {
      message = String(value);
    }
  }

  return message
    .replace(/\s+/g, ' ')
    .replace(/Bearer\s+[^\s,}\]]+/gi, 'Bearer [REDACTED]')
    .replace(
      /("?(?:api[_-]?key|apikey|authorization|secret)"?\s*[=:]\s*"?)[^"\s,}\]]+/gi,
      '$1[REDACTED]',
    )
    .slice(0, 300);
}

export function getProviderRequestId(headers: unknown): string | undefined {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const values = headers as Record<string, unknown> & {
    get?: (name: string) => unknown;
  };
  for (const header of [
    'x-request-id',
    'x-amzn-requestid',
    'x-alchemy-trace-id',
  ]) {
    const value = values[header] ?? values.get?.(header);
    if (typeof value === 'string' && value.length > 0) {
      return value.slice(0, 128);
    }
  }
  return undefined;
}

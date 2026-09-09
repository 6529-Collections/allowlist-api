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
  } else if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    message = value.toString();
  } else if (typeof value === 'symbol') {
    message = value.description ?? '[symbol]';
  } else if (typeof value === 'function') {
    message = '[function]';
  } else {
    try {
      message = JSON.stringify(value) ?? '[unserializable provider response]';
    } catch {
      message = '[unserializable provider response]';
    }
  }

  return message
    .replace(/\s+/g, ' ')
    .replace(/Bearer\s+[^\s,}\]]+/gi, 'Bearer [REDACTED]')
    .replace(
      /("?(?:api[_-]?key|apikey|authorization|secret|token|access[_-]?token|private[_-]?key|session)"?\s*[=:]\s*"?)[^"\s,}\]]+/gi,
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
      return value
        .replace(/[\u0000-\u001f\u007f]+/g, ' ')
        .trim()
        .slice(0, 128);
    }
  }
  return undefined;
}

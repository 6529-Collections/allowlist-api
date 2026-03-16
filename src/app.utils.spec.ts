import { bigInt2Number, stringifyError } from './app.utils';

describe('bigInt2Number', () => {
  it('returns undefined for nullish values and non-finite coercions', () => {
    expect(bigInt2Number(undefined)).toBeUndefined();
    expect(bigInt2Number(null)).toBeUndefined();
    expect(bigInt2Number('NaN')).toBeUndefined();
    expect(bigInt2Number('Infinity')).toBeUndefined();
  });

  it('returns finite numeric coercions', () => {
    expect(bigInt2Number('42')).toBe(42);
    expect(bigInt2Number(BigInt(42))).toBe(42);
    expect(bigInt2Number(42)).toBe(42);
  });

  it('formats nested step-aware errors with metadata and causes', () => {
    const error = {
      code: 'CREATE_TOKEN_POOL_CONSOLIDATION_FAILED',
      message: 'Failed to consolidate token pool pool-1',
      metadata: {
        tokenPoolId: 'pool-1',
        consolidateBlockNo: 24670600,
      },
      cause: {
        code: 'SEIZE_UPLOAD_JSON_FIELD_PARSE_FAILED',
        message: 'Failed to parse JSON field "memes" from Seize /uploads row',
        metadata: {
          field: 'memes',
          sourcePath: '/uploads',
          rawValuePrefix: 'undefined',
        },
        cause: new SyntaxError('Unexpected token u in JSON at position 0'),
      },
    };

    expect(stringifyError(error)).toBe(
      '[CREATE_TOKEN_POOL_CONSOLIDATION_FAILED] Failed to consolidate token pool pool-1 (tokenPoolId="pool-1", consolidateBlockNo=24670600) Cause: [SEIZE_UPLOAD_JSON_FIELD_PARSE_FAILED] Failed to parse JSON field "memes" from Seize /uploads row (field="memes", sourcePath="/uploads", rawValuePrefix="undefined") Cause: Unexpected token u in JSON at position 0',
    );
  });
});

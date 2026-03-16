import { bigInt2Number } from './app.utils';

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
});

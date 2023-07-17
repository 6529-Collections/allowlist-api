export const isValidMongoId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

export function bigInt2Number(value?: bigint): number | undefined {
  if (value) {
    return Number(value);
  }
  return undefined;
}

export function formatNumberRange(numbers: (string | bigint)[]): string {
  const uniqueNumbers = [...new Set(numbers)];
  const sortedNumbers = uniqueNumbers
    .map((n) => BigInt(n))
    .sort((a, b) => Number(a - b));
  const ranges: string[] = [];
  let start = sortedNumbers[0];
  let end = start;
  for (let i = 1; i < sortedNumbers.length; i++) {
    if (sortedNumbers[i] === end + BigInt(1)) {
      end = sortedNumbers[i];
    } else {
      ranges.push(start === end ? start.toString() : `${start}-${end}`);
      start = sortedNumbers[i];
      end = start;
    }
  }
  ranges.push(start === end ? start.toString() : `${start}-${end}`);
  return ranges.join(',');
}

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

export const assertUnreachable = (_x: never): never => {
  // Throw an error with a message indicating that this function should not be reached.
  // This error should only be thrown if there's a bug in the code or a new case has been
  // introduced without updating the relevant switch-case or if-else constructs.
  throw new Error("Didn't expect to get here");
};

export function associateByToMap<T>(
  arr: T[],
  keyFinder: (item: T) => string,
): Map<string, T> {
  return new Map(arr.map((item) => [keyFinder(item), item]));
}

export function stringifyError(error: any): string {
  if (typeof error === 'string') {
    return error;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return JSON.stringify(error);
  }
}

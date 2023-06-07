export const isValidMongoId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

export function bigInt2Number(value?: bigint): number | undefined {
  if (value) {
    return Number(value);
  }
  return undefined;
}

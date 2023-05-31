export const isValidMongoId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

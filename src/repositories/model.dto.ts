import { Document } from 'mongoose';

export type ModelDto<T> = Omit<T, '_id'>;

export function mapModelToDto<T extends Document>(
  model: T,
): Omit<T, '_id' | '__v'> {
  const dto = model.toObject();
  delete dto._id;
  delete dto.__v;
  return dto;
}

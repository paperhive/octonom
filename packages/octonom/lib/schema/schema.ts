import { ValidationError } from '../errors';
import { IModel, Model } from '../model';

import { BooleanSchema } from './boolean';

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Defaults to false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Defaults to false. */
  replace?: boolean;
}
export type Path = Array<string | number>;
export type Validator<T, TModel> = (value: T, path: Path, instance: TModel) => Promise<void>;

export interface ISchema<T, TModel extends Model> {
  sanitize: (value: any, path: Path, instance: TModel, options?: ISanitizeOptions) => T;
  validate: Validator<T, TModel>;
}

export interface ISchemaMap {
  [field: string]: ISchema<any, Model>;
}

export async function runValidator<T, TModel extends Model>(
  validate: Validator<T, TModel>,
  value: T,
  path: Path,
  instance: TModel,
) {
  try {
    await validate(value, path, instance);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.reason = error.reason || 'custom';
      error.value = error.value || value;
      error.path = error.path || path;
      error.instance = error.instance || instance;
      throw error;
    }
    throw error;
  }
}

import { ValidationError } from '../errors';
import { IModel, Model } from '../model';

import { BooleanSchema } from './boolean';

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Defaults to false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Defaults to false. */
  replace?: boolean;
}

export interface IToObjectOptions {
  /** Turn populated references into references */
  unpopulate?: boolean;
}

export type Path = Array<string | number>;
export type Validator<T, TModel> = (value: T, path: Path, instance: TModel) => Promise<void>;

export interface ISchema<T, TModel extends Model> {
  /** Sanitize a value (e.g., used when setting properties on an instance). */
  sanitize: (value: any, path: Path, instance: TModel, options?: ISanitizeOptions) => T;
  /** Create a plain object representation of the value. */
  toObject?: (value: T, options?: IToObjectOptions) => any;
  /** Validate a value (e.g., used before saving an instance in a collection). */
  validate: Validator<T, TModel>;
}

export interface ISchemaMap {
  [field: string]: ISchema<any, Model>;
}

export interface ISchemaOptions<T> {
  required?: boolean;
  validate?: (value: T, path: Path, instance: Model) => Promise<void>;
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

import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, Path, runValidator } from './schema';

export interface IBooleanOptions {
  required?: boolean;
  default?: boolean | (() => boolean);
  validate?: (value: boolean, path: Path, instance: Model) => Promise<void>;
}

export class BooleanSchema<TModel extends Model = Model> implements ISchema<boolean, TModel> {
  constructor(public options: IBooleanOptions = {}) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (options.defaults && value === undefined) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (value !== true && value !== false) {
      throw new SanitizationError('Value is not a boolean.', 'no-boolean', value, path, instance);
    }
  }

  public async validate(value: boolean, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (value !== true && value !== false) {
      throw new ValidationError('Value is not a boolean.', 'no-boolean', value, path, instance);
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

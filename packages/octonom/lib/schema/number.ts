import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface INumberOptions extends ISchemaOptions<number> {
  default?: number | (() => number);
  integer?: boolean;
  min?: number;
  max?: number;
}

export class NumberSchema<TModel extends Model = Model> implements ISchema<number, TModel> {
  constructor(public options: INumberOptions = {}) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (options.defaults && value === undefined) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError('Value is not a number.', 'no-number', value, path, instance);
    }

    return value;
  }

  public async validate(value: number, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError('Value is not a number.', 'no-number', value, path, instance);
    }

    if (this.options.integer && !Number.isInteger(value)) {
      throw new ValidationError('Number is not an integer.', 'no-integer', value, path, instance);
    }

    if (this.options.min !== undefined && value < this.options.min) {
      throw new ValidationError(
        `Number must not be less than ${this.options.min}.`,
        'number-min', value, path, instance,
      );
    }

    if (this.options.max !== undefined && value > this.options.max) {
      throw new ValidationError(
        `Number must not be greater than ${this.options.max}.`,
        'number-max', value, path, instance,
      );
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

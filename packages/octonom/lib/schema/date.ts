import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface IDateOptions extends ISchemaOptions<Date> {
  default?: Date | (() => Date);
  min?: Date;
  max?: Date;
}

export class DateSchema<TModel extends Model = Model> implements ISchema<Date, TModel> {
  constructor(public options: IDateOptions = {}) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (options.defaults && value === undefined) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (!(value instanceof Date)) {
      throw new SanitizationError('Value is not a date.', 'no-date', value, path, instance);
    }

    return value;
  }

  public async validate(value: Date, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (!(value instanceof Date)) {
      throw new ValidationError('Value is not a date.', 'no-date', value, path, instance);
    }

    if (this.options.min !== undefined && value < this.options.min) {
      throw new ValidationError(`Date must not be before ${this.options.min}.`, 'date-min', value, path, instance);
    }

    if (this.options.max !== undefined && value > this.options.max) {
      throw new ValidationError(`Date must not be after ${this.options.max}.`, 'date-max', value, path, instance);
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

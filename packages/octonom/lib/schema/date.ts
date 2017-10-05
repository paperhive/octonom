import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, ISchemaParent, Path, validate } from './schema';

export type DateInstance = ISchemaInstance<Date>;

export interface IDateOptions extends ISchemaOptions<DateInstance> {
  default?: Date | (() => Date);
  min?: Date;
  max?: Date;
}

// TODO: catch date changes (it's an object!)

export class DateSchema implements ISchema<Date, DateInstance, Date> {
  constructor(public readonly options: IDateOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): DateInstance {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    return {
      parent: sanitizeOptions.parent,
      schema: this,
      value: new Date(sanitizedValue),
    };
  }

  public toObject(instance: DateInstance) {
    return instance.value;
  }

  public async validate(instance: DateInstance) {
    if (this.options.min !== undefined && instance.value < this.options.min) {
      throw new ValidationError(
        `Date must not be before ${this.options.min.toISOString()}.`, 'date-min',
        instance.parent,
      );
    }

    if (this.options.max !== undefined && instance.value > this.options.max) {
      throw new ValidationError(
        `Date must not be after ${this.options.max.toISOString()}.`, 'date-max',
        instance.parent,
      );
    }

    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    if (value === undefined && sanitizeOptions.defaults) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (!(value instanceof Date)) {
      throw new SanitizationError('Value is not a date.', 'no-date', sanitizeOptions.parent);
    }

    return value;
  }
}

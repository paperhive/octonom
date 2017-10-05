import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, ISchemaParent, Path, validate } from './schema';

export type NumberInstance = ISchemaInstance<number>;

export interface INumberOptions extends ISchemaOptions<NumberInstance> {
  default?: number | (() => number);
  integer?: boolean;
  min?: number;
  max?: number;
}

export class NumberSchema implements ISchema<number, NumberInstance, number> {
  constructor(public readonly options: INumberOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): NumberInstance {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    return {
      parent: sanitizeOptions.parent,
      schema: this,
      value: this.sanitize(value, sanitizeOptions),
    };
  }

  public toObject(instance: NumberInstance) {
    return instance.value;
  }

  public async validate(instance: NumberInstance) {
    if (typeof instance.value !== 'number' || !Number.isFinite(instance.value)) {
      throw new ValidationError('Value is not a number.', 'no-number', instance.parent);
    }

    if (this.options.integer && !Number.isInteger(instance.value)) {
      throw new ValidationError('Number is not an integer.', 'no-integer', instance.parent);
    }

    if (this.options.min !== undefined && instance.value < this.options.min) {
      throw new ValidationError(
        `Number must not be less than ${this.options.min}.`,
        'number-min', instance.parent,
      );
    }

    if (this.options.max !== undefined && instance.value > this.options.max) {
      throw new ValidationError(
        `Number must not be greater than ${this.options.max}.`,
        'number-max', instance.parent,
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

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new SanitizationError('Value is not a number.', 'no-number', sanitizeOptions.parent);
    }

    return value;
  }
}

import { SanitizationError, ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, validate } from './schema';

export type StringInstance = ISchemaInstance<string>;

export interface IStringOptions extends ISchemaOptions<StringInstance> {
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export class StringSchema implements ISchema<string, StringInstance> {
  constructor(public readonly options: IStringOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): StringInstance {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    return {
      value: sanitizedValue,
      parent: sanitizeOptions.parent,
    };
  }

  public toObject(instance: StringInstance) {
    return instance.value;
  }

  public async validate(instance: StringInstance) {
    if (instance.value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'no-string', instance.parent);
      }
      return;
    }

    if (typeof instance.value !== 'string') {
      throw new ValidationError('Value is not a string.', 'no-string', instance.parent);
    }

    if (this.options.enum && this.options.enum.indexOf(instance.value) === -1) {
      throw new ValidationError(
        `String not in enum: ${this.options.enum.join(', ')}.`,
        'string-enum', instance.parent,
      );
    }

    if (this.options.min && instance.value.length < this.options.min) {
      throw new ValidationError(
        `String must not have less than ${this.options.min} characters.`,
        'string-min', instance.parent,
      );
    }

    if (this.options.max && instance.value.length > this.options.max) {
      throw new ValidationError(
        `String must not have more than ${this.options.max} characters.`,
        'string-max', instance.parent,
      );
    }

    if (this.options.regex && !this.options.regex.test(instance.value)) {
      throw new ValidationError(`String does not match regex.`, 'string-regex', instance.parent);
    }

    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    if (value === undefined && sanitizeOptions.defaults) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new SanitizationError('Value is not a string.', 'no-string', sanitizeOptions.parent);
    }

    return value;
  }
}

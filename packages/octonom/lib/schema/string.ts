import { SanitizationError, ValidationError } from '../errors';
import { IOctoInstance, ISanitizeOptions, ISchema, ISchemaOptions, validate } from './value';

export interface IStringOptions extends ISchemaOptions<OctoString> {
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export type OctoString = IOctoInstance<string>;

export class StringSchema implements ISchema<string, OctoString> {
  constructor(public readonly options: IStringOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): OctoString {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    return {
      value: sanitizedValue,
      parent: sanitizeOptions.parent,
    };
  }

  public toObject(octoString: OctoString) {
    return octoString.value;
  }

  public async validate(octoString: OctoString) {
    if (octoString.value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'no-string', octoString.parent);
      }
      return;
    }

    if (typeof octoString.value !== 'string') {
      throw new ValidationError('Value is not a string.', 'no-string', octoString.parent);
    }

    if (this.options.enum && this.options.enum.indexOf(octoString.value) === -1) {
      throw new ValidationError(
        `String not in enum: ${this.options.enum.join(', ')}.`,
        'string-enum', octoString.parent,
      );
    }

    if (this.options.min && octoString.value.length < this.options.min) {
      throw new ValidationError(
        `String must not have less than ${this.options.min} characters.`,
        'string-min', octoString.parent,
      );
    }

    if (this.options.max && octoString.value.length > this.options.max) {
      throw new ValidationError(
        `String must not have more than ${this.options.max} characters.`,
        'string-max', octoString.parent,
      );
    }

    if (this.options.regex && !this.options.regex.test(octoString.value)) {
      throw new ValidationError(`String does not match regex.`, 'string-regex', octoString.parent);
    }

    await validate(this.options, octoString);
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

import { SanitizationError, ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaOptions, OctoValue } from './value';

export interface IStringOptions extends ISchemaOptions<OctoString> {
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export class OctoString extends OctoValue<string> {
  constructor(value: any, public schemaOptions: IStringOptions = {}, sanitizeOptions: ISanitizeOptions = {}) {
    super(value, schemaOptions, sanitizeOptions);
  }

  public async validate() {
    if (this.value === undefined) {
      if (this.schemaOptions.required) {
        throw new ValidationError('Required value is undefined.', 'required', this);
      }
      return;
    }

    if (this.schemaOptions.enum && this.schemaOptions.enum.indexOf(this.value) === -1) {
      throw new ValidationError(
        `String not in enum: ${this.schemaOptions.enum.join(', ')}.`,
        'string-enum', this,
      );
    }

    if (this.schemaOptions.min && this.value.length < this.schemaOptions.min) {
      throw new ValidationError(
        `String must not have less than ${this.schemaOptions.min} characters.`,
        'string-min', this,
      );
    }

    if (this.schemaOptions.max && this.value.length > this.schemaOptions.max) {
      throw new ValidationError(
        `String must not have more than ${this.schemaOptions.max} characters.`,
        'string-max', this,
      );
    }

    if (this.schemaOptions.regex && !this.schemaOptions.regex.test(this.value)) {
      throw new ValidationError(`String does not match regex.`, 'string-regex', this);
    }

    await super.validate();
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    if (sanitizeOptions.defaults && value === undefined) {
      return typeof this.schemaOptions.default === 'function'
        ? this.schemaOptions.default()
        : this.schemaOptions.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new SanitizationError('Value is not a string.', 'no-string', this.parent);
    }

    return value;
  }
}

export class StringSchema implements ISchema {
  constructor(public options: IStringOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    return new OctoString(value, this.options, sanitizeOptions);
  }
}

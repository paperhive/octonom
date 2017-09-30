import { SanitizationError, ValidationError } from '../errors';
import { ISanitizeOptions, ISchemaOptions, MetaValue } from './schema';

export interface IStringOptions extends ISchemaOptions<MetaString> {
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export class MetaString extends MetaValue<string> {
  public static createSchema = MetaString.createSchemaFactory<string, MetaString, IStringOptions>(MetaString, {});

  public static sanitize(value: any, schemaOptions: IStringOptions = {}, sanitizeOptions: ISanitizeOptions = {}) {
    if (sanitizeOptions.defaults && value === undefined) {
      return typeof schemaOptions.default === 'function'
        ? schemaOptions.default()
        : schemaOptions.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new SanitizationError('Value is not a string.', 'no-string', sanitizeOptions.parent);
    }

    return value;
  }

  constructor(value: string, public schemaOptions: IStringOptions, sanitizeOptions: ISanitizeOptions) {
    super(
      value,
      schemaOptions,
      sanitizeOptions,
    );
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
}

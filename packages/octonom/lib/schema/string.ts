import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface IStringOptions extends ISchemaOptions<string> {
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export class StringSchema<TModel extends Model = Model> implements ISchema<string, TModel> {
  constructor(public options: IStringOptions = {}) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (options && options.defaults && value === undefined) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new SanitizationError('Value is not a string.', 'no-string', value, path, instance);
    }

    return value;
  }

  public async validate(value: string, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (typeof value !== 'string') {
      throw new ValidationError('Value is not a string.', 'no-string', value, path, instance);
    }

    if (this.options.enum && this.options.enum.indexOf(value) === -1) {
      throw new ValidationError(
        `String not in enum: ${this.options.enum.join(', ')}.`,
        'string-enum', value, path, instance,
      );
    }

    if (this.options.min && value.length < this.options.min) {
      throw new ValidationError(
        `String must not have less than ${this.options.min} characters.`,
        'string-min', value, path, instance,
      );
    }

    if (this.options.max && value.length > this.options.max) {
      throw new ValidationError(
        `String must not have more than ${this.options.max} characters.`,
        'string-max', value, path, instance,
      );
    }

    if (this.options.regex && !this.options.regex.test(value)) {
      throw new ValidationError(`String does not match regex.`, 'string-regex', value, path, instance);
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

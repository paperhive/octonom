import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, ISchemaParent, Path, validate } from './schema';

export type BooleanInstance = ISchemaInstance<boolean>;

export interface IBooleanOptions extends ISchemaOptions<BooleanInstance> {
  default?: boolean | (() => boolean);
}

export class BooleanSchema implements ISchema<boolean, BooleanInstance, boolean> {
  constructor(public readonly options: IBooleanOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): BooleanInstance {
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

  public toObject(instance: BooleanInstance) {
    return instance.value;
  }

  public async validate(instance: BooleanInstance) {
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

    if (value !== true && value !== false) {
      throw new SanitizationError('Value is not a boolean.', 'no-boolean', sanitizeOptions.parent);
    }

    return value;
  }
}

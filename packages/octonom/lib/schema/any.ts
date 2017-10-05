import { cloneDeep } from 'lodash';

import { ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, ISchemaParent, validate } from './schema';

export type AnyInstance = ISchemaInstance<any>;

export interface IAnyOptions extends ISchemaOptions<AnyInstance> {
  default?: any | (() => any);
}

export class AnySchema implements ISchema<any, AnyInstance> {
  constructor(public readonly options: IAnyOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): AnyInstance {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    return {
      parent: sanitizeOptions.parent,
      schema: this,
      value: sanitizedValue,
    };
  }

  public toObject(instance: AnyInstance) {
    return cloneDeep(instance.value);
  }

  public async validate(instance: AnyInstance) {
    if (instance.value === undefined && this.options.required) {
      throw new ValidationError('Required value is undefined.', 'required', instance.parent);
    }

    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    if (value === undefined && sanitizeOptions.defaults) {
      value = typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    return value;
  }
}

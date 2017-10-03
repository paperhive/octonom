import { cloneDeep } from 'lodash';

import { ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaOptions, OctoValue } from './value';

export interface IAnyOptions extends ISchemaOptions<OctoAny> {
  default?: any | (() => any);
}

export class OctoAny extends OctoValue<any> {
  public value: any;

  constructor(value: any, public schemaOptions: IAnyOptions = {}, sanitizeOptions: ISanitizeOptions = {}) {
    super(schemaOptions, sanitizeOptions.parent);

    if (value === undefined && sanitizeOptions.defaults) {
      value = typeof this.schemaOptions.default === 'function'
        ? this.schemaOptions.default()
        : this.schemaOptions.default;
    }

    this.value = value;
  }

  public toObject() {
    return cloneDeep(this.value);
  }
}

export class AnySchema implements ISchema {
  constructor(public options: IAnyOptions = {}) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    return new OctoAny(value, this.options, sanitizeOptions);
  }
}

import { cloneDeep } from 'lodash';

import { ValidationError } from '../errors';
import { ISanitizeOptions, ISchemaOptions, OctoFactory, OctoValue } from './value';

export interface IAnyOptions extends ISchemaOptions<OctoAny> {
  default?: any | (() => any);
}

export class OctoAny extends OctoValue<any> {
  public static sanitize(value: any, schemaOptions: IAnyOptions = {}, sanitizeOptions: ISanitizeOptions = {}) {
    if (sanitizeOptions.defaults && value === undefined) {
      return typeof schemaOptions.default === 'function'
        ? schemaOptions.default()
        : schemaOptions.default;
    }

    return value;
  }

  constructor(value: any, public schemaOptions: IAnyOptions, sanitizeOptions: ISanitizeOptions) {
    super(value, schemaOptions, sanitizeOptions);
  }

  public toObject() {
    return cloneDeep(this.value);
  }

  public async validate() {
    if (this.value === undefined) {
      if (this.schemaOptions.required) {
        throw new ValidationError('Required value is undefined.', 'required', this);
      }
      return;
    }

    await super.validate();
  }
}

/* tslint:disable-next-line:variable-name */
export const OctoAnyFactory = new OctoFactory<OctoAny, IAnyOptions>(OctoAny, {});

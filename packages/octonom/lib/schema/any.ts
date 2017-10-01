import { cloneDeep } from 'lodash';

import { ValidationError } from '../errors';
import { ISanitizeOptions, ISchemaOptions, OctoFactory, OctoValue } from './value';

export interface IAnyOptions extends ISchemaOptions<OctoAny> {
  default?: any | (() => any);
}

export class OctoAny extends OctoValue<any> {
 constructor(value: any, public schemaOptions: IAnyOptions = {}, sanitizeOptions: ISanitizeOptions = {}) {
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

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    if (sanitizeOptions.defaults && value === undefined) {
      return typeof this.schemaOptions.default === 'function'
        ? this.schemaOptions.default()
        : this.schemaOptions.default;
    }

    return value;
  }
}

/* tslint:disable-next-line:variable-name */
export const OctoAnyFactory = new OctoFactory<OctoAny, IAnyOptions>(OctoAny, {});

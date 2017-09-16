import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ModelArray } from '../model-array';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface IAnyOptions extends ISchemaOptions<any> {
  default?: any | (() => any);
}

export class AnySchema<TModel extends Model = Model> implements ISchema<any, TModel> {
  constructor(public options: IAnyOptions = {}) {}

  public sanitize(value: any, path: Path, instance: TModel, options: ISanitizeOptions = {}) {
    if (options.defaults && value === undefined) {
      return typeof this.options.default === 'function'
        ? this.options.default()
        : this.options.default;
    }

    return value;
  }

  public async validate(value: any, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

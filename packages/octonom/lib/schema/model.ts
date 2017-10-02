import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, IToObjectOptions,
         OctoValue, Path, PopulateReference,
       } from './value';

export interface IModelOptions<T extends Model = Model> extends ISchemaOptions<OctoModel<T>> {
  model: IModelConstructor<T>;
  callParentHooks?: boolean;
}

export class OctoModel<T extends Model = Model> extends OctoValue<T> {
  constructor(value: any, public schemaOptions: IModelOptions<T>, sanitizeOptions: ISanitizeOptions) {
    super(value, schemaOptions, sanitizeOptions);
  }

  public async populate(populateReference: PopulateReference) {
    if (typeof populateReference !== 'object') {
      throw new Error('populateReference must be an object.');
    }

    return this.value.populate(populateReference);
  }

  public sanitize(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    if (value === undefined && !this.schemaOptions.required) {
      return undefined;
    }

    // create new instance
    return new this.schemaOptions.model(value || {}, sanitizeOptions);
  }

  public toObject(options?: IToObjectOptions) {
    return this.value.toObject(options) as T;
  }

  public async validate() {
    if (this.value === undefined) {
      if (this.schemaOptions.required) {
        throw new ValidationError('Required value is undefined.', 'required', this);
      }
      return;
    }

    await this.value.validate();

    await super.validate();
  }
}

export class ModelSchema<T extends Model = Model> implements ISchema {
  constructor(public options: IModelOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    return new OctoModel<T>(value, this.options, sanitizeOptions);
  }
}

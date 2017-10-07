import { Collection } from '../collection';
import { PopulationError, SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, IToObjectOptions,
         Path, PopulateReference, validate,
       } from './schema';

export interface IReferenceInstance<TModel extends Model = Model> extends ISchemaInstance<TModel | string> {
  id: string;
}
export type ReferenceInstance<TModel extends Model = Model> = IReferenceInstance<TModel>;

export interface IReferenceOptions<TModel extends Model = Model> extends ISchemaOptions<ReferenceInstance<TModel>> {
  collection: () => Collection<TModel>;
}

export class ReferenceSchema<TModel extends Model = Model> implements
    ISchema<TModel | string, ReferenceInstance<TModel>, Partial<TModel> | string> {
  constructor(public options: IReferenceOptions<TModel>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): ReferenceInstance<TModel> {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    const idField = this.options.collection().modelIdField;
    const id = typeof sanitizedValue === 'string'
      ? sanitizedValue
      : sanitizedValue[idField];

    if (id === undefined) {
      throw new SanitizationError('Reference id is undefined.', 'no-id', sanitizeOptions.parent);
    }

    const instance: ReferenceInstance<TModel> = {
      value: sanitizedValue,
      id,
      schema: this,
    };

    return instance;
  }

  public async populate(instance: ReferenceInstance<TModel>, populateReference: PopulateReference<TModel>) {
    const modelInstance = await this.options.collection().findById(instance.id);

    if (populateReference !== true) {
      await modelInstance.populate(populateReference);
    }

    instance.value = modelInstance;

    return instance.value;
  }

  public toObject(instance: ReferenceInstance<TModel>, options: IToObjectOptions = {}): Partial<TModel> | string {
    if (typeof instance.value === 'string') {
      return instance.value;
    }
    return options.unpopulate
      ? instance.value[this.options.collection().modelIdField]
      : instance.value.toObject(options);
  }

  public async validate(instance: ReferenceInstance<TModel>) {
    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions = {}): TModel | string {
    if (value === undefined || typeof value === 'string') {
      return value;
    }

    // If it's not an id we expect a model. We don't instantiate from
    // a plain object because an object coming from a database will only
    // contain the id and if it has been populated it will already be a model.
    const model = this.options.collection().model;
    if (!(value instanceof model)) {
      throw new SanitizationError('Value is not an instance or an id.');
    }

    // clone model instance
    return new model(value, sanitizeOptions);
  }

}

import { getShadowInstance, IModelConstructor, Model } from '../model';
import { ObjectInstance } from './object';
import { ISanitizeOptions, ISchema, ISchemaOptions,
         IToObjectOptions, PopulateReference, validate,
       } from './schema';

export interface IModelInstance<T extends Model = Model> extends ObjectInstance<T> {
  schema: ModelSchema<T>;
  rawObject: T;
}
export type ModelInstance<T extends Model> = IModelInstance<T>;

export interface IModelOptions<T extends Model = Model> extends ISchemaOptions<ModelInstance<T>> {
  model: IModelConstructor<T>;
  callParentHooks?: boolean;
}

export class ModelSchema<T extends Model = Model> implements ISchema<T, ModelInstance<T>, Partial<T>> {
  constructor(public readonly options: IModelOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    if (value === undefined && !this.options.required) {
      return undefined;
    }

    const modelInstance = new this.options.model(value || {}, sanitizeOptions);

    const instance = modelInstance[getShadowInstance]() as ModelInstance<T>;
    return instance;
  }

  public async populate(instance: ModelInstance<T>, populateReference: PopulateReference) {
    if (typeof populateReference !== 'object') {
      throw new Error('populateReference must be an object.');
    }

    return instance.value.populate(populateReference);
  }

  public toObject(instance: ModelInstance<T>, options?: IToObjectOptions) {
    return instance.value.toObject();
  }

  public async validate(instance: ModelInstance<T>) {
    await instance.value.validate();
    await validate(this.options, instance);
  }
}

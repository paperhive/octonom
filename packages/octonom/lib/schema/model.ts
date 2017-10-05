import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ObjectInstance } from './object';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions,
         ISchemaParentInstance, IToObjectOptions,
         Path, PopulateReference, validate,
       } from './schema';

export type ModelInstance<T extends Model = Model> = ISchemaParentInstance<T>;

export interface IModelOptions<T extends Model = Model> extends ISchemaOptions<ModelInstance<T>> {
  model: IModelConstructor<T>;
  callParentHooks?: boolean;
}

export class ModelSchema<T extends Model = Model> implements ISchema<T, ModelInstance<T>, Partial<T>> {
  constructor(public options: IModelOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    if (value === undefined && !this.options.required) {
      return undefined;
    }

    const instance: ModelInstance<T> = {
      parent: sanitizeOptions.parent,
      schema: this,
      value: undefined,
      beforeChange: (path: Path, newValue: any, oldInstance: ISchemaInstance) => {
        if (this.options.callParentHooks !== false && instance.parent) {
          instance.parent.instance.beforeChange([instance.parent.path].concat(path), newValue, oldInstance);
        }
      },
      afterChange: (path: Path, newValue: any, newInstance: ISchemaInstance) => {
        if (this.options.callParentHooks !== false && instance.parent) {
          instance.parent.instance.afterChange([instance.parent.path].concat(path), newValue, newInstance);
        }
      },
    };

    instance.value = new this.options.model(value || {}, sanitizeOptions);

    return instance;
  }

  /*
  public async populate(populateReference: PopulateReference) {
    if (typeof populateReference !== 'object') {
      throw new Error('populateReference must be an object.');
    }

    return this.value.populate(populateReference);
  }
  */
  public toObject(instance: ModelInstance<T>, options?: IToObjectOptions) {
    return instance.value.toObject();
  }

  public async validate(instance: ModelInstance<T>) {
    await instance.value.validate();
    await validate(this.options, instance);
  }
}

import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, IToObjectOptions,
         Path, PopulateReference, runValidator,
       } from './schema';

export interface IModelOptions<TModel extends Model = Model> extends ISchemaOptions<TModel> {
  model: IModelConstructor<TModel>;
}

export class ModelSchema<TModel extends Model = Model> implements ISchema<Model, TModel> {
  constructor(public options: IModelOptions) {}

  public async populate(value: Model, populateReference: PopulateReference) {
    if (typeof populateReference !== 'object') {
      throw new Error('populateReference must be an object.');
    }

    return value.populate(populateReference);
  }

  public sanitize(value: any, path: Path, instance: TModel, options: ISanitizeOptions = {}) {
    if (value instanceof this.options.model) {
      // already a model
      return value;
    }

    if (value === undefined) {
      return this.options.required ? new this.options.model({}) : undefined;
    }

    if (typeof value !== 'object') {
      throw new SanitizationError(
        'Value is not an object or a model instance.', 'no-object-or-instance',
        value, path, instance,
      );
    }

    // create new instance
    return new this.options.model(value);
  }

  public toObject(value: Model, options?: IToObjectOptions) {
    return value.toObject(options);
  }

  public async validate(value: Model, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (!(value instanceof this.options.model)) {
      throw new ValidationError(
        `Value is not an instance of ${this.options.model.name}.`,
        'no-instance', value, path, instance,
      );
    }

    try {
      await value.validate();
    } catch (error) {
      if (error instanceof ValidationError) {
        const newPath = path.concat(error.path);
        throw new ValidationError(error.message, error.reason, error.value, newPath, instance);
      }

      throw error;
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

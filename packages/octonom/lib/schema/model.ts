import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ISanitizeOptions, ISchema, Path, runValidator } from './schema';

export interface IModelOptions<TModel extends Model = Model> {
  required?: boolean;
  model: IModelConstructor<TModel>;
  validate?: (value: TModel, path: Array<string | number>, instance: Model) => Promise<void>;
}

export class ModelSchema<TModel extends Model = Model> implements ISchema<Model, TModel> {
  constructor(public options?: IModelOptions) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (value instanceof this.options.model) {
      // already a model
      return value;
    } else {
      if (value === undefined && !this.options.required) {
        return undefined;
      }
      // create new instance
      return new this.options.model(value || {});
    }
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

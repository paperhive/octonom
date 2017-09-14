import { Collection } from '../collection';
import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface IReferenceOptions<TModel extends Model = Model> extends ISchemaOptions<string | TModel> {
  collection: () => Collection<TModel>;
}

export class ReferenceSchema<TModel extends Model = Model> implements ISchema<Model, TModel> {
  constructor(public options: IReferenceOptions) {}

  public sanitize(value: any, path: Path, instance: TModel, options?: ISanitizeOptions) {
    if (value === undefined) {
      return undefined;
    }

    // valid data?
    if (!(value instanceof this.options.collection().model) && !(typeof value === 'string')) {
      throw new SanitizationError('Value is not an instance or an id.');
    }

    return value;
  }

  public async validate(value: string | Model, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    // valid data?
    if (!(value instanceof this.options.collection().model) && !(typeof value === 'string')) {
      throw new ValidationError(
        'Value is not an instance or an id.', 'no-id-or-instance',
        value, path, instance,
      );
    }

    // note: we do not run validation on a populated reference since it's not part of
    //       the model instance
    const collection = this.options.collection();
    if (typeof value !== 'string' && !(value instanceof collection.model)) {
      throw new ValidationError(
        `Value is not an id or ${collection.model.name} instance.`,
        'no-number', value, path, instance,
      );
    }

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

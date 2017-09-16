import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ModelArray } from '../model-array';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchema, ISchemaOptions, Path, runValidator } from './schema';

export interface IArrayOptions extends ISchemaOptions<any[]> {
  elementSchema: ISchema<any, Model>;
  minLength?: number;
  maxLength?: number;
}

export class ArraySchema<TModel extends Model = Model> implements ISchema<any[], TModel> {
  constructor(public options: IArrayOptions) {}

  public sanitize(value: any, path: Path, instance: TModel, options: ISanitizeOptions = {}) {
    if (value === undefined) {
      return this.options.required ? [] : undefined;
    }

    if (!(value instanceof Array)) {
      throw new SanitizationError('Value is not an array.', 'no-array', value, path, instance);
    }

    if (this.options.elementSchema instanceof ModelSchema) {
      // is the provided data already a ModelArray?
      if (value instanceof ModelArray) {
        // does the ModelArray's model match the definition?
        if (value.model !== this.options.elementSchema.options.model) {
          throw new SanitizationError('ModelArray model mismatch.', 'model-mismatch', value, path, instance);
        }

        return value;
      }

      // create new ModelArray instance
      return new ModelArray(this.options.elementSchema.options.model, value);
    } else {
      // return sanitized elements
      return value.map((element, index) => {
        const newPath = path.slice();
        newPath.push(index);
        this.options.elementSchema.sanitize(element, newPath, instance, options);
      });
    }
  }

  public async validate(value: any[], path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (!(value instanceof Array)) {
      throw new ValidationError('Value is not an array.', 'no-array', value, path, instance);
    }

    if (this.options.minLength !== undefined && value.length < this.options.minLength) {
      throw new ValidationError(
        `Array must have at least ${this.options.minLength} elements.`,
        'array-min-length', value, path, instance,
      );
    }

    if (this.options.maxLength !== undefined && value.length > this.options.maxLength) {
      throw new ValidationError(
        `Array must have at most ${this.options.maxLength} elements.`,
        'array-max-length', value, path, instance,
      );
    }

    // validate all elements
    await Promise.all(value.map(async (element, index) => {
      const newPath = path.slice();
      newPath.push(index);
      await this.options.elementSchema.validate(element, newPath, instance);
    }));

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

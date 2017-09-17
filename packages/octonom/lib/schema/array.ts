import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ModelArray } from '../model-array';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchema, ISchemaOptions, IToObjectOptions,
         Path, PopulateReference, runValidator,
       } from './schema';

export interface IArrayOptions extends ISchemaOptions<any[]> {
  elementSchema: ISchema<any, Model>;
  minLength?: number;
  maxLength?: number;
}

export class ArraySchema<TModel extends Model = Model> implements ISchema<any[], TModel> {
  constructor(public options: IArrayOptions) {}

  public async populate(value: any[], populateReference: PopulateReference) {
    if (!this.options.elementSchema.populate) {
      throw new Error('Array elements are not populatable.');
    }

    const instances = await Promise.all(value.map(element => {
      return this.options.elementSchema.populate(element, populateReference);
    }));

    if (this.options.elementSchema instanceof ModelSchema) {
      return new ModelArray(this.options.elementSchema.options.model, instances);
    }

    return instances;
  }

  public sanitize(value: any, path: Path, instance: TModel, options: ISanitizeOptions = {}) {
    if (value === undefined) {
      if (this.options.required) {
        return this.options.elementSchema instanceof ModelSchema
          ? new ModelArray(this.options.elementSchema.options.model)
          : [];
      }
      return undefined;
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
        return this.options.elementSchema.sanitize(element, newPath, instance, options);
      });
    }
  }

  public toObject(value: any[], options?: IToObjectOptions) {
    return value.map(element => {
      if (this.options.elementSchema.toObject) {
        return this.options.elementSchema.toObject(element, options);
      }
      return element;
    });
  }

  public async validate(value: any[], path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (this.options.elementSchema instanceof ModelSchema) {
      if (!(value instanceof ModelArray)) {
        throw new ValidationError('Value is not a ModelArray.', 'no-array', value, path, instance);
      }
    } else if (!(value instanceof Array)) {
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

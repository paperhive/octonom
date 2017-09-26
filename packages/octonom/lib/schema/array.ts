import { SanitizationError, ValidationError } from '../errors';
import { IHooks } from '../hooks';
import { Model } from '../model';
import { ModelArray } from '../model-array';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchema, ISchemaOptions, IToObjectOptions,
         Path, PopulateReference, runValidator,
       } from './schema';

function hooksPrependPath(options: IHooks, path: Path) {
  return {
    ...options,
    beforeSet: setOptions => options.beforeSet({...setOptions, path: path.concat(setOptions.path)}),
    afterSet: setOptions => options.afterSet({...setOptions, path: path.concat(setOptions.path)}),
  };
}

export function proxifyArray(
  elementSchema: ISchema<any, Model>,
  array: any[],
  path: Path,
  instance: Model,
  hooks: IHooks,
) {
  if (!(array instanceof Array)) {
    throw new Error('Expected an Array.');
  }

  // execute an operation on an array, resanitize if indices changed and trigger set hooks
  function wrapArrayMutation(target, operation, args) {
    // execute on clone
    const clone = target.slice();
    const result = clone[operation](...args);

    const sanitizedArray = clone.map((element, index) => {
      if (index < target.length && element === target[index]) {
        return element;
      }
      return elementSchema.sanitize(element, path.concat([index]), instance, hooksPrependPath(hooks, [index]));
    });

    if (hooks.beforeSet) {
      hooks.beforeSet({instance, path: [], data: sanitizedArray});
    }

    target.splice(0, target.length, ...sanitizedArray);

    if (hooks.afterSet) {
      hooks.afterSet({instance, path: [], data: sanitizedArray});
    }

    return result;
  }

  // execute a function and trigger set hooks if a single element changed
  function wrapElementOperation(target, key, value, fun) {
    if (hooks.beforeSet) {
      hooks.beforeSet({instance, path: [key], data: value});
    }

    const result = fun();

    if (hooks.afterSet) {
      hooks.afterSet({instance, path: [key], data: value});
    }

    return result;
  }

  return new Proxy(array, {
    get(target, key, receiver) {
      switch (key) {
        case 'copyWithin':
        case 'fill':
        case 'pop':
        case 'push':
        case 'reverse':
        case 'splice':
        case 'unshift':
          return (...args) => wrapArrayMutation(target, key, args);
      }

      return target[key];
    },
    set(target, key, value, receiver) {
      if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
        const numKey = typeof key === 'number' ? key : parseInt(key, 10);
        wrapElementOperation(target, numKey, value, () => {
          target[numKey] = elementSchema.sanitize(
            value, path.concat([numKey]), instance, hooksPrependPath(hooks, [numKey]),
          );
        });
      } else {
        target[key] = value;
      }
      return true;
    },
    deleteProperty(target, key) {
      if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
        const numKey = typeof key === 'number' ? key : parseInt(key, 10);
        wrapElementOperation(target, numKey, undefined, () => delete target[numKey]);
      } else {
        delete target[key];
      }
      return true;
    },
  });
}

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
    let newValue = value;
    if (newValue === undefined) {
      if (!this.options.required) {
        return undefined;
      }
      newValue = [];
    }

    if (!(newValue instanceof Array)) {
      throw new SanitizationError('Value is not an array.', 'no-array', value, path, instance);
    }

    // create sanitized array
    const array = newValue.map((element, index) => {
      const newPath = path.concat([index]);
      return this.options.elementSchema.sanitize(element, newPath, instance, hooksPrependPath(options, [index]));
    });

    // return proxied array
    return proxifyArray(this.options.elementSchema, array, path, instance, options);
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

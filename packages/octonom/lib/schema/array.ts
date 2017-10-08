import { SanitizationError, ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions,
         ISchemaParentInstance, IToObjectOptions,
         Path, PopulateReference, validate,
       } from './schema';

export interface IArrayInstance<T> extends ISchemaParentInstance<T[]> {
  instanceArray: Array<ISchemaInstance<T>>;
  rawArray: T[];
}
export type ArrayInstance<T> = IArrayInstance<T>;

export interface IArrayOptions<T = any> extends ISchemaOptions<ArrayInstance<T>> {
  elementSchema: ISchema<T, ISchemaInstance<T>>;
  minLength?: number;
  maxLength?: number;
  callParentHooks?: boolean;
}

/** Creates a proxy array that a user can interact with.
 *  All change operations on the array are intercepted for reflecting the changes
 *  in instanceArray and calling the beforeChange/afterChange handlers.
 *  Note: this is a bit lengthy since we need to cover the full js array API.
 */
export function proxifyArray<T>(
  array: T[],
  instanceArray: Array<ISchemaInstance<T>>,
  parentInstance: ISchemaParentInstance,
  elementSchema: ISchema<T, ISchemaInstance<T>>,
) {
  return new Proxy(array, {
    get(target, key, receiver) {
      switch (key) {
        case 'copyWithin':
          throw new Error('not yet implemented');
        case 'fill':
          throw new Error('not yet implemented');
        case 'pop':
          return () => {
            const clone = target.slice();
            clone.pop();
            parentInstance.beforeChange([], clone, parentInstance);

            const removedInstance = instanceArray.pop();
            delete removedInstance.parent;
            const result = target.pop();

            parentInstance.afterChange([], clone, parentInstance);

            return result;
          };
        case 'push':
          return (...args: any[]) => {
            const clone = target.slice();
            clone.push(...args);
            parentInstance.beforeChange([], clone, parentInstance);

            const newInstances = args.map((arg, index) => {
              return elementSchema.create(
                arg,
                {parent: {instance: parentInstance, path: target.length + index}},
              );
            });
            instanceArray.push(...newInstances);
            const result = target.push(...newInstances.map(el => el.value));

            parentInstance.afterChange([], clone, parentInstance);

            return result;
          };
        case 'reverse':
          return () => {
            const clone = target.slice();
            clone.reverse();
            parentInstance.beforeChange([], clone, parentInstance);

            instanceArray.reverse();
            instanceArray.forEach((instance, index) => instance.parent.path = index);
            target.reverse();

            parentInstance.afterChange([], clone, parentInstance);

            return receiver;
          };
        case 'sort':
          return (compare: (a, b) => number) => {
            const mapped = instanceArray.map((instance, index) => ({instance, index}));
            mapped.sort((a, b) => {
              if (compare) {
                return compare(a.instance.value, b.instance.value);
              } else {
                if (a.instance.value < b.instance.value) {
                  return -1;
                }

                if (a.instance.value > b.instance.value) {
                  return 1;
                }

                return 0;
              }
            });
            const clone = mapped.map(el => el.instance.value);

            parentInstance.beforeChange([], clone, parentInstance);

            instanceArray.splice(0, instanceArray.length, ...mapped.map((el, index) => {
              el.instance.parent.path = index;
              return el.instance;
            }));
            target.splice(0, target.length, ...mapped.map(el => el.instance.value));

            parentInstance.afterChange([], clone, parentInstance);

            return receiver;
          };
        case 'splice':
          return (start, deleteCount, ...args: any[]) => {
            if (deleteCount === undefined || deleteCount > target.length - start) {
              deleteCount = target.length - start;
            }
            const clone = instanceArray.map(el => el.value);
            clone.splice(start, deleteCount, ...args);
            parentInstance.beforeChange([], clone, parentInstance);

            const newInstances = args.map((arg, index) => {
              return elementSchema.create(
                arg,
                {parent: {instance: parentInstance, path: start + index}},
              );
            });
            const removedInstances = instanceArray.splice(start, deleteCount, ...newInstances);
            removedInstances.forEach(instance => delete instance.parent);
            instanceArray.slice(start + newInstances.length).forEach((instance, index) => {
              instance.parent.path = start + newInstances.length + index;
            });
            const result = target.splice(start, deleteCount, ...newInstances.map(el => el.value));

            parentInstance.afterChange([], clone, parentInstance);

            return result;
          };
        // case 'toString':
        //   return () => target.map(el => el.value).toString();
        case 'unshift':
          return (...args: any[]) => {
            const clone = instanceArray.map(el => el.value);
            clone.unshift(...args);
            parentInstance.beforeChange([], clone, parentInstance);

            const newInstances = args.map((arg, index) => {
              return elementSchema.create(
                arg,
                {parent: {instance: parentInstance, path: index}},
              );
            });

            instanceArray.unshift(...newInstances);
            instanceArray.slice(newInstances.length).forEach((instance, index) => {
              instance.parent.path = newInstances.length + index;
            });
            const result = target.unshift(...newInstances.map(el => el.value));

            parentInstance.afterChange([], clone, parentInstance);

            return result;
          };
      }

      return target[key];
    },
    set(target, key, value, receiver) {
      if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
        const numKey = typeof key === 'number' ? key : parseInt(key, 10);
        const oldInstance = instanceArray[numKey];

        parentInstance.beforeChange([numKey], value, oldInstance);

        const newInstance = elementSchema.create(
          value,
          {parent: {instance: parentInstance, path: numKey}},
        );

        if (oldInstance) {
          delete oldInstance.parent;
        }

        instanceArray[numKey] = newInstance;
        target[numKey] = newInstance ? newInstance.value : undefined;

        parentInstance.afterChange([numKey], value, newInstance);
      } else {
        target[key] = value;
      }
      return true;
    },
    deleteProperty: (target, key) => {
      if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
        const numKey = typeof key === 'number' ? key : parseInt(key, 10);
        const oldInstance = instanceArray[numKey];

        parentInstance.beforeChange([numKey], undefined, oldInstance);

        if (oldInstance) {
          delete oldInstance.parent;
        }

        delete instanceArray[numKey];
        delete target[numKey];

        parentInstance.afterChange([numKey], undefined, undefined);
      } else {
        delete target[key];
      }
      return true;
    },
  }) as T[];
}

export class ArraySchema<T> implements ISchema<T[], ArrayInstance<T>, T[]> {
  constructor(public readonly options: IArrayOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): ArrayInstance<T> {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    const instance: ArrayInstance<T> = {
      instanceArray: undefined,
      rawArray: undefined,
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

    instance.instanceArray = sanitizedValue.map(
      (element, index) => this.options.elementSchema.create(
        element,
        {...sanitizeOptions, parent: {instance, path: index}},
      ),
    );
    instance.rawArray = instance.instanceArray.map(element => element.value);
    instance.value = proxifyArray<T>(instance.rawArray, instance.instanceArray, instance, this.options.elementSchema);

    return instance;
  }

  public async populate(instance: ArrayInstance<T>, populateReference: PopulateReference) {
    await Promise.all(instance.instanceArray.map(async (element, index) => {
      instance.rawArray[index] = await this.options.elementSchema.populate(element, populateReference);
    }));
    return instance.value;
  }

  public toObject(instance: ArrayInstance<T>, options: IToObjectOptions = {}): T[] {
    return instance.instanceArray.map(element => element ? element.schema.toObject(element, options) : undefined);
  }

  public async validate(instance: ArrayInstance<T>): Promise<void> {
    if (this.options.minLength !== undefined && instance.value.length < this.options.minLength) {
      throw new ValidationError(
        `Array must have at least ${this.options.minLength} elements.`,
        'array-min-length', instance.parent,
      );
    }

    if (this.options.maxLength !== undefined && instance.value.length > this.options.maxLength) {
      throw new ValidationError(
        `Array must have at most ${this.options.maxLength} elements.`,
        'array-max-length', instance.parent,
      );
    }

    // validate all elements
    await Promise.all(instance.instanceArray.map(
      element => this.options.elementSchema.validate(element),
    ));

    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    if (value === undefined) {
      if (this.options.required && sanitizeOptions.defaults) {
        return [];
      }
      return undefined;
    }

    if (!(value instanceof Array)) {
      throw new SanitizationError('Value is not an array.', 'no-array', sanitizeOptions.parent);
    }

    return value;
  }
}

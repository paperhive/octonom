import { SanitizationError, ValidationError } from '../errors';
import { IHooks } from '../hooks';
import { Model } from '../model';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchema, ISchemaOptions, IToObjectOptions,
         OctoFactory, OctoValue, Path, PopulateReference,
       } from './value';

export interface IArrayOptions<T = any> extends ISchemaOptions<OctoArray<T>> {
  elementSchema: ISchema;
  minLength?: number;
  maxLength?: number;
  callParentHooks?: boolean;
}

export class OctoArray<T = any> extends OctoValue<T[]> {
  public octoValues: Array<OctoValue<any>>;

  constructor(value: any, public schemaOptions: IArrayOptions<T>, sanitizeOptions: ISanitizeOptions) {
    super(value, schemaOptions, sanitizeOptions);
  }

  public beforeChange(path: Path, value: any, oldOctoValue: OctoValue<any>) {
    if (this.parent && this.parent.octoValue.beforeChange) {
      this.parent.octoValue.beforeChange([this.parent.path].concat(path), value, oldOctoValue);
    }
  }

  public afterChange(path: Path, value: any, newOctoValue: OctoValue<any>) {
    if (this.parent && this.parent.octoValue.afterChange) {
      this.parent.octoValue.afterChange([this.parent.path].concat(path), value, newOctoValue);
    }
  }

  public async populate(populateReference: PopulateReference) {
    if (!this.octoValues) {
      return;
    }

    const array = await Promise.all(this.octoValues.map(element => element.populate(populateReference)));
    this.value.splice(0, this.value.length, ...array);

    return this.value;
  }

  public toObject(options?: IToObjectOptions) {
    if (!this.octoValues) {
      return;
    }
    return this.octoValues.map(element => element.toObject(options));
  }

  public async validate() {
    if (this.value === undefined) {
      if (this.schemaOptions.required) {
        throw new ValidationError('Required value is undefined.', 'required', this);
      }
      return;
    }

    if (this.schemaOptions.minLength !== undefined && this.value.length < this.schemaOptions.minLength) {
      throw new ValidationError(
        `Array must have at least ${this.schemaOptions.minLength} elements.`,
        'array-min-length', this,
      );
    }

    if (this.schemaOptions.maxLength !== undefined && this.value.length > this.schemaOptions.maxLength) {
      throw new ValidationError(
        `Array must have at most ${this.schemaOptions.maxLength} elements.`,
        'array-max-length', this,
      );
    }

    // validate all elements
    if (this.octoValues) {
      await Promise.all(this.octoValues.map(element => element.validate()));
    }

    await super.validate();
  }

  protected getProxy() {
    const array = this.octoValues.map(el => el.value);
    return new Proxy(array, {
      get: (target, key, receiver) => {
        switch (key) {
          case 'copyWithin':
            throw new Error('not yet implemented');
          case 'fill':
            throw new Error('not yet implemented');
          case 'pop':
            return () => {
              const clone = target.slice();
              clone.pop();
              this.beforeChange([], clone, this);

              const removedOctoValue = this.octoValues.pop();
              delete removedOctoValue.parent;
              const result = target.pop();

              this.afterChange([], clone, this);

              return result;
            };
          case 'push':
            return (...args: any[]) => {
              const clone = target.slice();
              clone.push(...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema.create(
                  arg,
                  {parent: {octoValue: this, path: target.length + index}},
                );
              });
              this.octoValues.push(...newOctoValues);
              const result = target.push(...newOctoValues.map(el => el.value));

              this.afterChange([], clone, this);

              return result;
            };
          case 'reverse':
            return () => {
              const clone = target.slice();
              clone.reverse();
              this.beforeChange([], clone, this);

              this.octoValues.reverse();
              this.octoValues.forEach((octoValue, index) => octoValue.parent.path = index);
              target.reverse();

              this.afterChange([], clone, this);

              return receiver;
            };
          case 'sort':
            return (compare: (a, b) => number) => {
              const mapped = this.octoValues.map((octoValue, index) => ({octoValue, index}));
              mapped.sort((a, b) => {
                if (compare) {
                  return compare(a.octoValue.value, b.octoValue.value);
                } else {
                  if (a.octoValue.value < b.octoValue.value) {
                    return -1;
                  }

                  if (a.octoValue.value > b.octoValue.value) {
                    return 1;
                  }

                  return 0;
                }
              });
              const clone = mapped.map(el => el.octoValue.value);

              this.beforeChange([], clone, this);

              this.octoValues.splice(0, this.octoValues.length, ...mapped.map((el, index) => {
                el.octoValue.parent.path = index;
                return el.octoValue;
              }));
              target.splice(0, target.length, ...mapped.map(el => el.octoValue.value));

              this.afterChange([], clone, this);

              return receiver;
            };
          case 'splice':
            return (start, deleteCount, ...args: any[]) => {
              if (deleteCount === undefined || deleteCount > target.length - start) {
                deleteCount = target.length - start;
              }
              const clone = this.octoValues.map(el => el.value);
              clone.splice(start, deleteCount, ...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema.create(
                  arg,
                  {parent: {octoValue: this, path: start + index}},
                );
              });
              const removedOctoValues = this.octoValues.splice(start, deleteCount, ...newOctoValues);
              removedOctoValues.forEach(octoValue => delete octoValue.parent);
              this.octoValues.slice(start + newOctoValues.length).forEach((octoValue, index) => {
                octoValue.parent.path = start + newOctoValues.length + index;
              });
              const result = target.splice(start, deleteCount, ...newOctoValues.map(el => el.value));

              this.afterChange([], clone, this);

              return result;
            };
          case 'toString':
            return () => target.map(el => el.value).toString();
          case 'unshift':
            return (...args: any[]) => {
              const clone = this.octoValues.map(el => el.value);
              clone.unshift(...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema.create(
                  arg,
                  {parent: {octoValue: this, path: index}},
                );
              });

              this.octoValues.unshift(...newOctoValues);
              this.octoValues.slice(newOctoValues.length).forEach((octoValue, index) => {
                octoValue.parent.path = newOctoValues.length + index;
              });
              const result = target.unshift(...newOctoValues.map(el => el.value));

              this.afterChange([], clone, this);

              return result;
            };
        }

        if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
          const numKey = typeof key === 'number' ? key : parseInt(key, 10);
          const octoValue = this.octoValues[numKey];
          return octoValue ? octoValue.value : undefined;
        }

        return target[key];
      },
      set: (target, key, value, receiver) => {
        if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
          const numKey = typeof key === 'number' ? key : parseInt(key, 10);
          const oldOctoValue = target[numKey];

          this.beforeChange([numKey], value, oldOctoValue);

          const newOctoValue = this.schemaOptions.elementSchema.create(
            value,
            {parent: {octoValue: this, path: numKey}},
          );

          if (oldOctoValue) {
            delete oldOctoValue.parent;
          }

          target[numKey] = newOctoValue;

          this.afterChange([numKey], value, newOctoValue);
        } else {
          target[key] = value;
        }
        return true;
      },
      deleteProperty: (target, key) => {
        if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
          const numKey = typeof key === 'number' ? key : parseInt(key, 10);
          const oldOctoValue = this.octoValues[numKey];

          this.beforeChange([numKey], undefined, oldOctoValue);

          if (oldOctoValue) {
            delete oldOctoValue.parent;
          }

          delete target[numKey];

          this.afterChange([numKey], undefined, undefined);
        } else {
          delete target[key];
        }
        return true;
      },
    }) as any[];
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    this.value = undefined;
    this.octoValues = undefined;

    let newValue = value;
    if (newValue === undefined) {
      if (!this.schemaOptions.required) {
        return undefined;
      }
      newValue = [];
    }

    if (!(newValue instanceof Array)) {
      throw new SanitizationError('Value is not an array.', 'no-array', sanitizeOptions.parent);
    }

    // create sanitized array
    this.octoValues = newValue.map((element, index) => {
      return this.schemaOptions.elementSchema.create(
        element,
        {...sanitizeOptions, parent: {octoValue: this, path: index}},
      );
    });

    return this.getProxy();
  }
}

export class ArraySchema implements ISchema {
  constructor(public options: IArrayOptions) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    return new OctoArray(value, this.options, sanitizeOptions);
  }
}

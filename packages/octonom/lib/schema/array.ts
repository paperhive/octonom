import { SanitizationError, ValidationError } from '../errors';
import { IHooks } from '../hooks';
import { Model } from '../model';
import { ModelSchema } from './model';
import { ISanitizeOptions, ISchemaOptions, IToObjectOptions,
         OctoFactory, OctoValue, OctoValueFactory, Path, PopulateReference,
       } from './value';

export interface IArrayOptions<T = any> extends ISchemaOptions<OctoArray<T>> {
  elementSchema: OctoValueFactory;
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

  protected getOctoValuesProxy() {
    return new Proxy(this.octoValues, {
      get: (target, key, receiver) => {
        switch (key) {
          case 'copyWithin':
            throw new Error('not yet implemented');
          case 'fill':
            throw new Error('not yet implemented');
          case 'pop':
            return () => {
              const clone = target.map(el => el.value);
              clone.pop();
              this.beforeChange([], clone, this);

              const removedOctoValue = target.pop();
              delete removedOctoValue.parent;

              this.afterChange([], clone, this);

              return removedOctoValue.value;
            };
          case 'push':
            return (...args: any[]) => {
              const clone = target.map(el => el.value);
              clone.push(...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: target.length + index}},
                );
              });
              const result = target.push(...newOctoValues);

              this.afterChange([], clone, this);

              return result;
            };
          case 'reverse':
            return () => {
              const clone = target.map(el => el.value);
              clone.reverse();
              this.beforeChange([], clone, this);

              target.reverse();
              target.forEach((octoValue, index) => octoValue.parent.path = index);

              this.afterChange([], clone, this);

              return receiver;
            };
          case 'sort':
            return (compare: (a, b) => number) => {
              const mapped = target.map((octoValue, index) => ({octoValue, index}));
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

              target.splice(0, target.length, ...mapped.map((el, index) => {
                el.octoValue.parent.path = index;
                return el.octoValue;
              }));

              this.afterChange([], clone, this);

              return receiver;
            };
          case 'splice':
            return (start, deleteCount, ...args: any[]) => {
              if (deleteCount === undefined || deleteCount > target.length - start) {
                deleteCount = target.length - start;
              }
              const clone = target.map(el => el.value);
              clone.splice(start, deleteCount, ...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: start + index}},
                );
              });
              const removedOctoValues = target.splice(start, deleteCount, ...newOctoValues);
              removedOctoValues.forEach(octoValue => delete octoValue.parent);
              target.slice(start + newOctoValues.length).forEach((octoValue, index) => {
                octoValue.parent.path = start + newOctoValues.length + index;
              });

              this.afterChange([], clone, this);

              return removedOctoValues.map(el => el.value);
            };
          case 'toString':
            return () => target.map(el => el.value).toString();
          case 'unshift':
            return (...args: any[]) => {
              const clone = target.map(el => el.value);
              clone.unshift(...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: index}},
                );
              });

              const result = target.unshift(...newOctoValues);
              target.slice(newOctoValues.length).forEach((octoValue, index) => {
                octoValue.parent.path = newOctoValues.length + index;
              });

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

          const newOctoValue = this.schemaOptions.elementSchema(
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
      return this.schemaOptions.elementSchema(
        element,
        {...sanitizeOptions, parent: {octoValue: this, path: index}},
      );
    });

    return this.getOctoValuesProxy();
  }
}

/* tslint:disable-next-line:variable-name */
export const OctoArrayFactory = new OctoFactory<OctoArray, IArrayOptions>(OctoArray);

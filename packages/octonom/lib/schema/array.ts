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
  protected octoValues: Array<OctoValue<any>>;

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

    const array = this.octoValues.map(element => element.value);

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
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: this.octoValues.length + index}},
                );
              });
              this.octoValues.push(...newOctoValues);
              const result = target.push(...newOctoValues.map(octoValue => octoValue.value));

              this.afterChange([], clone, this);

              return result;
            };
          case 'reverse':
            return () => {
              const clone = target.slice();
              clone.reverse();
              this.beforeChange([], clone, this);

              this.octoValues.reverse();
              this.octoValues.forEach((octoValue, index) => {
                octoValue.parent.path = index;
              });
              const result = target.reverse();

              this.beforeChange([], clone, this);

              return this.value;
            };
          case 'sort':
            return (compare: (a, b) => number) => {
              const mapped = target.map((element, index) => ({element, index}));
              mapped.sort((a, b) => {
                if (compare) {
                  return compare(a.element, b.element);
                } else {
                  if (a.element < b.element) {
                    return -1;
                  }

                  if (a.element > b.element) {
                    return 1;
                  }

                  return 0;
                }
              });
              const clone = mapped.map(el => el.element);

              this.beforeChange([], clone, this);

              this.octoValues.splice(0, this.octoValues.length, ...mapped.map((el, index) => {
                const octoValue = this.octoValues[el.index];
                octoValue.parent.path = index;
                return octoValue;
              }));
              target.splice(0, target.length, ...this.octoValues.map(octoValue => octoValue.value));

              this.afterChange([], clone, this);
            };
          case 'splice':
            return (start, deleteCount, ...args: any[]) => {
              const clone = target.slice();
              clone.splice(start, deleteCount, ...args);
              this.beforeChange([], clone, this);

              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: start + index}},
                );
              });
              const removedOctoValues = this.octoValues.splice(start, deleteCount, ...newOctoValues);
              removedOctoValues.forEach(octoValue => delete octoValue.parent);
              this.octoValues.slice(start + deleteCount).forEach((octoValue, index) => {
                octoValue.parent.path = start + deleteCount + index;
              });
              const result = target.splice(start, deleteCount, ...newOctoValues.map(octoValue => octoValue.value));

              this.afterChange([], clone, this);
              return result;
            };
          case 'unshift':
            return (...args: any[]) => {
              const clone = target.slice();
              clone.unshift(...args);
              this.beforeChange([], clone, this);
              const newOctoValues = args.map((arg, index) => {
                return this.schemaOptions.elementSchema(
                  arg,
                  {parent: {octoValue: this, path: index}},
                );
              });
              this.octoValues.unshift(...newOctoValues);
              this.octoValues.slice(newOctoValues.length).forEach((octoValue, index) => {
                octoValue.parent.path = newOctoValues.length + index;
              });
              const result = target.unshift(...newOctoValues.map(octoValue => octoValue.value));
              this.afterChange([], clone, this);
              return result;
            };
        }

        return target[key];
      },
      set: (target, key, rawValue, receiver) => {
        if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
          const numKey = typeof key === 'number' ? key : parseInt(key, 10);
          const oldOctoValue = this.octoValues[numKey];

          this.beforeChange([numKey], rawValue, oldOctoValue);

          const newOctoValue = this.schemaOptions.elementSchema(
            rawValue,
            {parent: {octoValue: this, path: numKey}},
          );

          if (oldOctoValue) {
            delete oldOctoValue.parent;
          }

          this.octoValues[numKey] = newOctoValue;
          target[numKey] = newOctoValue.value;

          this.afterChange([numKey], rawValue, newOctoValue);
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

          delete this.octoValues[numKey];
          delete target[numKey];

          this.afterChange([numKey], undefined, undefined);
        } else {
          delete target[key];
        }
        return true;
      },
    });
  }
}

/* tslint:disable-next-line:variable-name */
export const OctoArrayFactory = new OctoFactory<OctoArray, IArrayOptions>(OctoArray);

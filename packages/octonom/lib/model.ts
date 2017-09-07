import { cloneDeep } from 'lodash';

import { IPopulateMap, populateObject } from './populate';
import { ISanitizeOptions, sanitize, setObjectSanitized } from './sanitize';
import { SchemaMap, SchemaValue } from './schema';
import { IToObjectOptions, toObject } from './to-object';
import { validateObject } from './validate';

export interface IModelConstructor<TModel extends Model<object>> {
  schema: SchemaMap;
  new (data: Partial<TModel>): TModel;
}

interface IModel {
  constructor: typeof Model;
}

export abstract class Model<T extends object> {
  public static schema: SchemaMap;

  /**
   * Attach schema information to the property
   * @param schema Schema definition
   */
  public static Property(schema: SchemaValue): PropertyDecorator {
    return (target: IModel, key: string) => {
      const constructor = target.constructor;
      constructor.schema = cloneDeep(constructor.schema || {});
      constructor.schema[key] = schema;
    };
  }

  constructor(data?: Partial<T>) {
    const constructor = this.constructor as typeof Model;
    const schema = constructor.schema;

    // set initial data
    this.set(data || {}, {defaults: true, replace: true});

    // create proxy that intercepts set operations
    // for running sanitization if the key is in the schema
    return new Proxy(this, {
      set(target, key, value, receiver) {
        target[key] = schema[key] ? sanitize(schema[key], value) : value;
        return true;
      },
    });
  }

  public inspect() {
    return this.toObject();
  }

  public async populate(populateMap: IPopulateMap) {
    const constructor = this.constructor as typeof Model;
    return populateObject(this, constructor.schema, populateMap);
  }

  // TODO: sanitize is called twice when this is called via the proxy
  public set(data: object, options: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    setObjectSanitized(constructor.schema, this, data, options);
  }

  public toObject(options?: IToObjectOptions): Partial<T> {
    const constructor = this.constructor as typeof Model;
    return toObject(constructor.schema, this, options) as Partial<T>;
  }

  public toJSON() {
    return this.toObject();
  }

  public async validate() {
    const constructor = this.constructor as typeof Model;
    await validateObject(constructor.schema, this, [], this);
  }
}

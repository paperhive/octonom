import { clone, cloneDeep, defaults, difference, forEach, isArray, isString } from 'lodash';

import { ISchemaSanitizeOptions, ISchemaToObjectOptions, sanitize,
         SchemaMap, SchemaValue, setObjectSanitized, toObject } from './schema';

interface IModel {
  constructor: typeof Model;
  _sanitized: {[k: string]: object};
  setKey(key: string, value: any, options?: ISchemaSanitizeOptions);
}

function defineModelProperty(target, key: string, enumerable: boolean) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable,
    // tslint:disable-next-line:object-literal-shorthand
    get: function() {
      return this._sanitized[key];
    },
    // tslint:disable-next-line:object-literal-shorthand
    set: function(value) {
      const instance = this as IModel;
      instance.setKey(key, value);
    },
  });
}

export abstract class Model<T> {
  public static _schema: SchemaMap = {};

  // TODO: static
  public static async getPopulated(obj: object, schemaMap: SchemaMap, path: string[]) {
    if (path.length === 0) {
      throw new Error('path is empty');
    }

    const field = path[0];

    const schemaValue = schemaMap[field];
    if (!schemaValue) {
      throw new Error(`field ${field} unknown in schema`);
    }

    const value = obj[field];

    // final path element?
    if (path.length === 1) {
      // throw if not a reference
      if (schemaValue.type !== 'reference') {
        throw new Error(`field ${field} is not of type reference`);
      }

      const collection = schemaValue.collection();

      // do nothing if value is undefined
      if (value === undefined) {
        return;
      }

      // already populated?
      if (value instanceof collection.model) {
        return;
      }

      // not an id?
      if (!isString(value)) {
        throw new Error(`field ${field} is not an instance and not an id`);
      }

      // find by id and set on object
      const instance = await schemaValue.collection().findById(value);
      if (!instance) {
        throw new Error(`id ${value} not found`);
      }
      obj[field] = instance;
    }

    // path length > 1
    const newPath = path.slice(1, path.length);
    switch (schemaValue.type) {
      case 'array':
        if (value === undefined) {
          return;
        }
        // TODO
        return;

      case 'model':
        if (value === undefined) {
          return;
        }
        const instance = value as Model<any>; // TODO: replace any
        await instance.populate(newPath);
        return;

      case 'object':
        if (value === undefined) {
          return;
        }
        await Model.getPopulated(value, schemaValue.definition, newPath);
        return;

      case 'reference':
        const collection = schemaValue.collection();

        // populate inside the populated instance
        if (value instanceof collection.model) {
          await value.populate(newPath);
          return;
        }

        // do nothing if not populated
        return;

      default:
        throw new Error(`field ${field} of type ${schemaValue.type} cannot be populated`);
    }
  }

  /**
   * Attach schema information to the property
   * @param schema Schema definition
   */
  public static PropertySchema(schema: SchemaValue): PropertyDecorator {
    return (target: IModel, key: string) => {
      const constructor = target.constructor;
      constructor._schema = cloneDeep(constructor._schema);
      constructor._schema[key] = schema;

      // define model property
      defineModelProperty(target, key, false);
    };
  }

  // TODO: make this work
  // @enumerable(false)
  protected _sanitized = {};

  constructor(data?: Partial<T>) {
    // TODO: remove (see @enumerable decorator)
    Object.defineProperty(this, '_sanitized', {writable: true, enumerable: false});
    this.set(data || {}, {defaults: true, replace: true});
  }

  public async populate(...paths: Array<string | string[]>) {
    const constructor = this.constructor as typeof Model;

    if (paths.length === 0) {
      throw new Error('no path given');
    }

    await Promise.all(paths.map(
      path => Model.getPopulated(this, constructor._schema, isArray(path) ? path : [path]),
    ));
  }

  // TODO: find a way to merge this with setObjectSanitized, code is pretty redundant
  public set(data: object, options: ISchemaSanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;

    if (typeof data !== 'object') {
      throw new Error('data is not an object');
    }

    const dataKeys = Object.keys(data);
    const schemaKeys = Object.keys(constructor._schema);
    const disallowedKeys = difference(dataKeys, schemaKeys);
    if (disallowedKeys.length > 0) {
      throw new Error(`key ${disallowedKeys[0]} not found in schema`);
    }

    forEach(constructor._schema, (_, key) => {
      if (data[key] === undefined && !options.replace) {
        return;
      }
      this.setKey(key, data[key], options);
    });
  }

  public setKey(key: string, value: any, options: ISchemaSanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    const schemaValue = constructor._schema[key];

    if (!schemaValue) {
      throw new Error(`key ${key} not found in schema`);
    }

    const sanitizedValue = sanitize(schemaValue, value, options);
    this._sanitized[key] = sanitizedValue;

    defineModelProperty(this, key, sanitizedValue !== undefined);
  }

  public toObject(options?: ISchemaToObjectOptions): T {
    const constructor = this.constructor as typeof Model;
    return toObject(constructor._schema, this, options) as T;
  }

  public toJSON() {
    return this.toObject();
  }

  public inspect() {
    return this.toObject();
  }
}

import { clone, cloneDeep, defaults, difference, forEach, isArray, isString } from 'lodash';

import { ISchemaSanitizeOptions, ISchemaToObjectOptions, populate, sanitize,
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
      path => populate(this, constructor._schema, isArray(path) ? path : [path]),
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

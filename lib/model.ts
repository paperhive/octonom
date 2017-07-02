import { cloneDeep, forEach } from 'lodash';

import { ISchemaSanitizeOptions, ISchemaToObjectOptions, sanitize,
         SchemaMap, SchemaValue, setObjectSanitized, toObject } from './schema';

interface IModel {
  constructor: typeof Model;
  _sanitized: {[k: string]: object};
  setKey(key: string, value: any, options?: ISchemaSanitizeOptions);
}

interface IModelRoot {
  getId(): string;
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
    if (data) {
      this.set(data);
    }
  }

  public set(data: Partial<T>, options?: ISchemaSanitizeOptions) {
    if (typeof data !== 'object') {
      throw new Error('data is not an object');
    }
    forEach(data, (v, k) => this.setKey(k, v, options));
  }

  public setKey(key: string, value: any, options?: ISchemaSanitizeOptions) {
    const constructor = this.constructor as typeof Model;
    const schemaValue = constructor._schema[key];

    if (!schemaValue) {
      throw new Error(`key ${key} not found in schema`);
    }

    if (value === undefined) {
      delete this._sanitized[key];
    } else {
      this._sanitized[key] = sanitize(schemaValue, value, options);
    }

    defineModelProperty(this, key, value !== undefined);
  }

  public toObject(options?: ISchemaToObjectOptions): T {
    const constructor = this.constructor as typeof Model;
    return toObject(constructor._schema, this, options) as T;
  }

  public toJSON() {
    return this.toObject();
  }
}

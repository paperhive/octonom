import { cloneDeep, forEach } from 'lodash';

import { getObject, ISchemaGetOptions, ISchemaSetOptions, SchemaMap, SchemaValue, setObject } from './schema';

interface IModel {
  constructor: typeof Model;
  _setted: {[k: string]: object};
}

interface IModelRoot {
  getId(): string;
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

      // add setter for nested models
      switch (schema.type) {
        case 'model': {
          Object.defineProperty(target, key, {
            // tslint:disable-next-line:object-literal-shorthand
            set: function(value) {
              if (value === undefined) {
                delete this._setted[key];
              } else if (value instanceof schema.model) {
                this._setted[key] = value;
              } else {
                this._setted[key] = new schema.model(value);
              }
            },
            // tslint:disable-next-line:object-literal-shorthand
            get: function() {
              return this._setted[key];
            },
            enumerable: true,
          });
        }
      }
    };
  }

  // TODO: make this work
  // @enumerable(false)
  protected _setted = {};

  constructor(data?: Partial<T>) {
    // TODO: remove (see @enumerable decorator)
    Object.defineProperty(this, '_setted', {writable: true, enumerable: false});
    if (data) {
      this.set(data);
    }
  }

  public set(data: Partial<T>, options?: ISchemaSetOptions) {
    const constructor = this.constructor as typeof Model;
    setObject(constructor._schema, this, data, options);
  }

  public toObject(options?: ISchemaGetOptions): T {
    const constructor = this.constructor as typeof Model;
    return getObject(constructor._schema, this, options) as T;
  }

  public toJSON() {
    return this.toObject();
  }
}

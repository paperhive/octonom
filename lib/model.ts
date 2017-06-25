import { cloneDeep, forEach } from 'lodash';

import { getObject, ISchemaGetOptions, ISchemaSetOptions, SchemaMap, SchemaValue, setObject } from './schema';

interface IModelSetOptions {
  overwrite?: boolean;
}

interface IModelToObjectOptions {
  unpopulate?: boolean;
}

export class Model<T> {
  public static _schema: SchemaMap = {};

  /**
   * Attach schema information to the property
   * @param schema Schema definition
   */
  public static PropertySchema(schema: SchemaValue): PropertyDecorator {
    return (target: object, key: string) => {
      const constructor = target.constructor as typeof Model;
      constructor._schema = cloneDeep(constructor._schema);
      constructor._schema[key] = schema;
    };
  }

  constructor(data?: Partial<T>) {
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

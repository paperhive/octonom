import { forEach } from 'lodash';

import { ISchemaValueBase, SchemaMap, SchemaValue } from './schema';

export interface IToObjectOptions {
  unpopulate?: boolean;
}

export function toObjectValue(schemaValue: SchemaValue, value, options: IToObjectOptions = {}) {
  if (value === undefined) {
    return undefined;
  }

  switch (schemaValue.type) {
    case 'array':
      return value.map(v => toObjectValue(schemaValue.definition, v, options));

    case 'model':
      return toObject(schemaValue.model.schema, value, options);

    case 'object':
      return toObject(schemaValue.definition, value, options);

    case 'reference':
      const collection = schemaValue.collection();

      // is value an instance (-> populated)?
      if (value instanceof collection.model) {
        // do we only want the id?
        if (options.unpopulate) {
          return value[collection.modelIdField];
        }

        return value.toObject();
      }

      // value is an id
      return value;

    case 'any':
    case 'boolean':
    case 'date':
    case 'number':
    case 'string':
      return value;

    default:
      throw new Error(`type ${(schemaValue as ISchemaValueBase).type} is unknown`);
  }
}

export function toObject(schemaMap: SchemaMap, source: object, options?: IToObjectOptions) {
  const result = {};
  forEach(schemaMap, (schemaValue, key) => {
    const value = toObjectValue(schemaValue, source[key], options);
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

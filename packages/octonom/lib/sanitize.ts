import { difference, forEach, isArray, isBoolean, isDate, isNumber, isString } from 'lodash';

import { ModelArray } from './model-array';
import { ISchemaValueBase, SchemaMap, SchemaValue } from './schema';

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Defaults to false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Defaults to false. */
  replace?: boolean;
}

export function sanitize(schemaValue: SchemaValue, data: any, _options?: ISanitizeOptions) {
  const options = _options || {};

  switch (schemaValue.type) {
    case 'array':
      // return empty array if no data given but a value is required
      if (data === undefined) {
        return schemaValue.required ? [] : undefined;
      }

      // data incompatible?
      if (!isArray(data)) {
        throw new Error('data is not an array');
      }

      if (schemaValue.definition.type === 'model') {
        // is the provided data already a ModelArray?
        if (data instanceof ModelArray) {
          // does the ModelArray's model match the definition?
          if (data.model !== schemaValue.definition.model) {
            throw new Error('ModelArray model mismatch');
          }
          return data;
        }

        // create new ModelArray instance
        return new ModelArray(schemaValue.definition.model, data);
      } else {
        // return sanitized elements
        return data.map(v => sanitize(schemaValue.definition, v, options));
      }

    case 'model':
      if (data instanceof schemaValue.model) {
        // already a model
        return data;
      } else {
        if (data === undefined && !schemaValue.required) {
          return undefined;
        }
        // create new instance
        return new schemaValue.model(data || {});
      }

    case 'object':
      // return empty object if no data given but a value is required
      if (data === undefined) {
        return schemaValue.required ? {} : undefined;
      }

      // data incompatible?
      if (typeof data !== 'object') {
        throw new Error('data is not an object');
      }

      // sanitize object
      return setObjectSanitized(schemaValue.definition, {}, data, options);

    case 'reference':
      if (data === undefined) {
        return undefined;
      }

      // valid data?
      if (!(data instanceof schemaValue.collection().model) && !isString(data)) {
        throw new Error('not an instance or an id');
      }

      return data;

    case 'any':
    case 'boolean':
    case 'date':
    case 'number':
    case 'string': {
      let value = data;

      // get default value if no data given
      if (options.defaults && value === undefined) {
        value = (typeof schemaValue.default === 'function')
          ? schemaValue.default()
          : schemaValue.default;
      }

      // return undefined if value is still undefined
      if (value === undefined) {
        return undefined;
      }

      if (schemaValue.type === 'boolean' && !isBoolean(value)) {
        throw new Error('not a boolean');
      }
      if (schemaValue.type === 'date' && !isDate(value)) {
        throw new Error('not a date');
      }
      if (schemaValue.type === 'number' && !isNumber(value)) {
        throw new Error('not a number');
      }
      if (schemaValue.type === 'string' && !isString(value)) {
        throw new Error('not a string');
      }

      return value;
    }

    default:
      throw new Error(`type ${(schemaValue as ISchemaValueBase).type} is unknown`);
  }
}

export function setObjectSanitized(schemaMap: SchemaMap, target: object, data: object,
                                   options: ISanitizeOptions = {}) {
  if (typeof data !== 'object') {
    throw new Error('data is not an object');
  }

  const dataKeys = Object.keys(data);
  const schemaKeys = Object.keys(schemaMap);
  const disallowedKeys = difference(dataKeys, schemaKeys);
  if (disallowedKeys.length > 0) {
    throw new Error(`key ${disallowedKeys[0]} not found in schema`);
  }

  forEach(schemaMap, (schemaValue, key) => {
    if (options.replace || key in data) {
      delete target[key];
    }

    if (data[key] === undefined && !options.replace) {
      return;
    }

    const sanitizedValue = sanitize(schemaValue, data[key], options);
    if (sanitizedValue !== undefined) {
      target[key] = sanitizedValue;
    }
  });

  return target;
}

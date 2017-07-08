import { difference, forEach, isArray, isBoolean, isDate, isFunction, isNumber, isString } from 'lodash';

import { Collection } from './collection';
import { Model } from './model';
import { ModelArray } from './model-array';

export interface ISchemaValueBase {
  type: string;
  required?: boolean;
  dbKey?: string;
}

export interface ISchemaValueArray extends ISchemaValueBase {
  type: 'array';
  definition: SchemaValue;
  minLength?: number;
  maxLength?: number;
}

export interface ISchemaValueBoolean extends ISchemaValueBase {
  type: 'boolean';
  default?: boolean | (() => boolean);
}

export interface ISchemaValueDate extends ISchemaValueBase {
  type: 'date';
  default?: Date | (() => Date);
  min?: Date;
  max?: Date;
}

export interface IModelConstructor {
  _schema: ISchemaMap;
  new (data: any): any; // TODO
}

export interface ISchemaValueModel extends ISchemaValueBase {
  type: 'model';
  model: IModelConstructor;
}

export interface ISchemaValueNumber extends ISchemaValueBase {
  type: 'number';
  default?: number | (() => number);
  min?: number;
  max?: number;
  integer?: boolean;
}

export interface ISchemaValueObject extends ISchemaValueBase {
  type: 'object';
  definition: ISchemaMap;
}

export interface ISchemaValueReference extends ISchemaValueBase {
  type: 'reference';
  collection: () => any; // TODO
}

export interface ISchemaValueString extends ISchemaValueBase {
  type: 'string';
  default?: string | (() => string);
  allowEmpty?: boolean;
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
}

export type SchemaValue = ISchemaValueArray | ISchemaValueBoolean | ISchemaValueDate |
  ISchemaValueModel | ISchemaValueNumber | ISchemaValueObject | ISchemaValueReference |
  ISchemaValueString;

export interface ISchemaMap {
  [field: string]: SchemaValue;
}

export type SchemaMap = ISchemaMap;

export interface ISchemaSanitizeOptions {
  /** Set undefined values to defaults (if configured). Defaults to false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Defaults to false. */
  replace?: boolean;
}

export function sanitize(schemaValue: SchemaValue, data: any, _options?: ISchemaSanitizeOptions) {
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

    case 'boolean':
    case 'date':
    case 'number':
    case 'string': {
      let value = data;

      // get default value if no data given
      if (options.defaults && value === undefined) {
        value = isFunction(schemaValue.default) ? schemaValue.default() : schemaValue.default;
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

export function setObjectSanitized(schemaMap: ISchemaMap, target: object, data: object,
                                   options: ISchemaSanitizeOptions = {}) {
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
    if (options.replace) {
      delete target[key];
    }

    if (dataKeys.indexOf(key) === -1) {
      return;
    }

    target[key] = sanitize(schemaValue, data[key], options);
  });

  return target;
}

export interface ISchemaToObjectOptions {
  unpopulate?: boolean;
}

export function toObjectValue(schemaValue: SchemaValue, value, options: ISchemaToObjectOptions = {}) {
  if (value === undefined) {
    return undefined;
  }

  switch (schemaValue.type) {
    case 'array':
      return value.map(v => toObjectValue(schemaValue.definition, v, options));

    case 'model':
      return toObject(schemaValue.model._schema, value, options);

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

    case 'boolean':
    case 'date':
    case 'number':
    case 'string':
      return value;

    default:
      throw new Error(`type ${(schemaValue as ISchemaValueBase).type} is unknown`);
  }
}

export function toObject(schemaMap: SchemaMap, source: object, options?: ISchemaToObjectOptions) {
  const result = {};
  forEach(schemaMap, (schemaValue, key) => {
    const value = toObjectValue(schemaValue, source[key], options);
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

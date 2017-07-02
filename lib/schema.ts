import { difference, forEach, isArray, isBoolean, isDate, isFunction, isNumber, isString } from 'lodash';

import { Model } from './model';

interface ISchemaValueBase {
  type: string;
  required?: boolean;
  dbKey?: string;
}

interface ISchemaValueArray extends ISchemaValueBase {
  type: 'array';
  definition: SchemaValue;
  minLength?: number;
  maxLength?: number;
}

interface ISchemaValueBoolean extends ISchemaValueBase {
  type: 'boolean';
  default?: boolean | (() => boolean);
}

interface ISchemaValueDate extends ISchemaValueBase {
  type: 'date';
  default?: Date | (() => Date);
  min?: Date;
  max?: Date;
}

interface IModelConstructor {
  _schema: ISchemaMap;
  new (data: any): any; // TODO
}

interface ISchemaValueModel extends ISchemaValueBase {
  type: 'model';
  model: IModelConstructor;
}

interface ISchemaValueNumber extends ISchemaValueBase {
  type: 'number';
  default?: number | (() => number);
  min?: number;
  max?: number;
  integer?: boolean;
}

interface ISchemaValueObject extends ISchemaValueBase {
  type: 'object';
  definition: ISchemaMap;
}

interface ISchemaValueReference extends ISchemaValueBase {
  type: 'reference';
  collection: any; // TODO
}

interface ISchemaValueString extends ISchemaValueBase {
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

interface ISchemaMap {
  [field: string]: SchemaValue;
}

export type SchemaMap = ISchemaMap;

export interface ISchemaSanitizeOptions {
  /** Unset all properties that are not provided in the data. Defaults to false. */
  replace?: boolean;
}

export function sanitize(schemaValue: SchemaValue, data: any, options?: ISchemaSanitizeOptions) {
  switch (schemaValue.type) {
    case 'array': {
      // return empty array if no data given but a value is required
      if (data === undefined) {
        return schemaValue.required ? [] : undefined;
      }

      // data incompatible?
      if (!isArray(data)) {
        throw new Error('data is not an array');
      }

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

    // case 'reference':
    //   return

    case 'boolean':
    case 'date':
    case 'number':
    case 'string': {
      let value = data;

      // get default value if no data given
      if (value === undefined) {
        value = isFunction(schemaValue.default) ? schemaValue.default() : schemaValue.default;

        // return undefined if value is still undefined
        if (value === undefined) {
          return undefined;
        }
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
      throw new Error(`type ${schemaValue.type} is unknown`);
  }
}

export function setObjectSanitized(schemaMap: ISchemaMap, target: object, data: object,
                                   options?: ISchemaSanitizeOptions) {
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
    if (options && options.replace) {
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

export function toObjectValue(schemaValue: SchemaValue, value, options?: ISchemaToObjectOptions) {
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

    // case 'reference':
    //   return

    case 'boolean':
    case 'date':
    case 'number':
    case 'string':
      return value;

    default:
      throw new Error(`type ${schemaValue.type} is unknown`);
  }
}

export function toObject(schemaMap: SchemaMap, source: object, options?: ISchemaToObjectOptions) {
  const result = {};
  forEach(schemaMap, (schemaValue, key) => {
    if (source[key]) {
      const value = toObjectValue(schemaValue, source[key], options);
      if (value !== undefined) {
        result[key] = value;
      }
    }
  });
  return result;
}

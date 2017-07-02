import { difference, forEach, isFunction } from 'lodash';

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
  strict?: boolean;
  replace?: boolean;
}

export function sanitize(schemaValue: SchemaValue, data: any, options?: ISchemaSanitizeOptions) {
  switch (schemaValue.type) {
    case 'array': {
      // return empty array if no data given but a value is required
      if (data === undefined) {
        return schemaValue.required ? [] : undefined;
      }
      return data.map(v => sanitize(schemaValue.definition, v, options));
    }

    case 'model':
      if (data instanceof schemaValue.model) {
        // already a model
        return data;
      } else {
        // create new instance
        return new schemaValue.model(data);
      }

    case 'object':
      // return empty object if no data given but a value is required
      if (data === undefined) {
        return schemaValue.required ? {} : undefined;
      }
      return setObjectSanitized(schemaValue.definition, {}, data, options);

    // case 'reference':
    //   return

    case 'boolean':
    case 'date':
    case 'number':
    case 'string': {
      // return default value if no data given
      if (data === undefined) {
        return isFunction(schemaValue.default) ? schemaValue.default() : schemaValue.default;
      }
      return data;
    }
  }
}

export function setObjectSanitized(schemaMap: ISchemaMap, target: object, data: object,
                                   options?: ISchemaSanitizeOptions) {
  const dataKeys = Object.keys(data);

  const strict = options ? options.strict !== false : true;
  if (strict) {
    const schemaKeys = Object.keys(schemaMap);
    const disallowedKeys = difference(dataKeys, schemaKeys);
    if (disallowedKeys.length > 0) {
      throw new Error(`The following keys are not allowed: ${disallowedKeys.join(', ')}`);
    }
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
}

export interface ISchemaToObjectOptions {
  unpopulate?: boolean;
}

export function toObjectValue(schemaValue: SchemaValue, value, options?: ISchemaToObjectOptions) {
  if (!value) {
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

    default:
      return value;
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

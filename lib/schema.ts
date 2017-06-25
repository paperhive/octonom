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

export interface ISchemaSetOptions {
  strict?: boolean;
  replace?: boolean;
}

function set(schemaValue: SchemaValue, data: any, options?: ISchemaSetOptions) {
  switch (schemaValue.type) {
    case 'array': {
      if (data === undefined) {
        return schemaValue.required ? [] : undefined;
      }
      return data.map(v => set(schemaValue.definition, v, options));
    }

    case 'model': {
      if (data === undefined) {
        return schemaValue.required ? new schemaValue.model({}) : undefined;
      }
      return new schemaValue.model(data);
    }

    case 'object':
      return setObject(schemaValue.definition, {}, data, options);

    // case 'reference':
    //   return

    case 'boolean':
    case 'date':
    case 'number':
    case 'string': {
      if (data === undefined) {
        return isFunction(schemaValue.default) ? schemaValue.default() : schemaValue.default;
      }
      return data;
    }
  }
}

export function setObject(schemaMap: ISchemaMap, target: object, data: object, options?: ISchemaSetOptions) {
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
      // console.log(key);
      return;
    }

    target[key] = set(schemaValue, data[key], options);
  });
}

export interface ISchemaGetOptions {
  unpopulate?: boolean;
}

function get(schemaValue: SchemaValue, value, options?: ISchemaGetOptions) {
  if (!value) {
    return undefined;
  }

  switch (schemaValue.type) {
    case 'array':
      return value.map(v => get(schemaValue.definition, v, options));

    case 'model':
      return getObject(schemaValue.model._schema, value, options);

    case 'object':
      return getObject(schemaValue.definition, value, options);

    // case 'reference':
    //   return

    default:
      return value;
  }
}

export function getObject(schemaMap: SchemaMap, source: object, options?: ISchemaGetOptions) {
  const result = {};
  forEach(schemaMap, (schemaValue, key) => {
    if (source[key]) {
      result[key] = get(schemaValue, source[key], options);
    }
  });
  return result;
}

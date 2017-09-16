import { difference } from 'lodash';

import { SanitizationError, ValidationError } from '../errors';
import { IModelConstructor, Model } from '../model';
import { ISanitizeOptions, ISchema, ISchemaMap, ISchemaOptions,
         IToObjectOptions, Path, PopulateReference, runValidator,
       } from './schema';

export interface IObjectOptions<TModel extends Model = Model> extends ISchemaOptions<object> {
  schema: ISchemaMap;
}

export async function populateObject(schemaMap: ISchemaMap, obj: object, populateReference: PopulateReference) {
  if (typeof populateReference !== 'object') {
    throw new Error('populateReference must be an object.');
  }

  const newObj = Object.assign({}, obj);
  await Promise.all(Object.keys(populateReference).map(async key => {
    const schema = schemaMap[key];
    if (!schema.populate) {
      throw new Error(`Key ${key} cannot be populated.`);
    }

    if (obj[key] === undefined) {
      return;
    }

    newObj[key] = await schema.populate(obj[key], populateReference[key]);
  }));

  return newObj;
}

export function setObjectSanitized(
  schemaMap: ISchemaMap, target: object, data: object,
  path: Path, instance: Model, options: ISanitizeOptions = {},
) {
  if (typeof data !== 'object') {
    throw new SanitizationError('Data is not an object.', 'no-object', data, path, instance);
  }

  const dataKeys = Object.keys(data);
  const schemaKeys = Object.keys(schemaMap);
  const disallowedKeys = difference(dataKeys, schemaKeys);
  if (disallowedKeys.length > 0) {
    throw new SanitizationError(
      `Key ${disallowedKeys[0]} not found in schema.`, 'key-not-in-schema',
      data, path, instance,
    );
  }

  schemaKeys.forEach(key => {
    if (options.replace || key in data) {
      delete target[key];
    }

    if (data[key] === undefined && !options.defaults) {
      return;
    }

    const newPath = path.slice();
    newPath.push(key);
    const sanitizedValue = schemaMap[key].sanitize(data[key], newPath, instance, options);
    if (sanitizedValue !== undefined) {
      target[key] = sanitizedValue;
    }
  });

  return target;
}

export function toObject(schemaMap: ISchemaMap, obj: object, options?: IToObjectOptions) {
  const newObj = {};
  Object.keys(schemaMap).forEach(key => {
    const value = obj[key];
    if (value === undefined) {
      return;
    }

    const schema = schemaMap[key];
    if (schema.toObject) {
      const newValue = schemaMap[key].toObject(value, options);
      if (newValue !== undefined) {
        newObj[key] = newValue;
      }
    } else {
      newObj[key] = value;
    }
  });

  return newObj;
}

export async function validateObject(
  schemaMap: ISchemaMap,
  obj: object,
  path: Array<string | number>,
  instance: Model,
) {
  if (typeof obj !== 'object') {
    throw new ValidationError('Data is not an object.', 'no-object', obj, path, instance);
  }

  const keys = Object.keys(obj);
  const schemaKeys = Object.keys(schemaMap);

  const invalidKeys = keys.filter(key => schemaKeys.indexOf(key) === -1);
  if (invalidKeys.length > 0) {
    const newPath = path.slice();
    newPath.push(invalidKeys[0]);
    throw new ValidationError(
      `Key ${invalidKeys[0]} not found in schema.`,
      'key-unknown', obj[invalidKeys[0]], newPath, instance,
    );
  }

  await Promise.all(schemaKeys.map(async key => {
    const newPath = path.slice();
    newPath.push(key);
    await schemaMap[key].validate(obj[key], newPath, instance);
  }));
}

export class ObjectSchema<TModel extends Model = Model> implements ISchema<object, TModel> {
  constructor(public options?: IObjectOptions) {}

  public async populate(value: object, populateReference: PopulateReference) {
    return populateObject(this.options.schema, value, populateReference);
  }

  public sanitize(value: object, path: Path, instance: TModel, options: ISanitizeOptions = {}) {
    // return empty object if no data given but a value is required
    if (value === undefined) {
      return this.options.required ? {} : undefined;
    }

    // sanitize object
    return setObjectSanitized(this.options.schema, {}, value, path, instance, options);
  }

  public toObject(value: object, options?: IToObjectOptions) {
    return toObject(this.options.schema, value, options);
  }

  public async validate(value: object, path: Path, instance: TModel) {
    if (value === undefined) {
      if (this.options.required) {
        throw new ValidationError('Required value is undefined.', 'required', value, path, instance);
      }
      return;
    }

    if (!(value instanceof Object)) {
      throw new ValidationError('Value is not an object.', 'no-object', value, path, instance);
    }

    await validateObject(this.options.schema, value, path, instance);

    if (this.options.validate) {
      await runValidator(this.options.validate, value, path, instance);
    }
  }
}

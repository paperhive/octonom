import { difference } from 'lodash';

import { SanitizationError, ValidationError } from '../errors';
import { ISanitizeOptions, ISchema, ISchemaInstance, ISchemaOptions, ISchemaParentInstance,
         IToObjectOptions, Path, PopulateMap, PopulateReference, SchemaInstanceMap, SchemaMap,
         validate,
       } from './schema';

export interface IObjectInstance<T extends object> extends ISchemaParentInstance<T> {
  instanceMap: SchemaInstanceMap<T>;
}
export type ObjectInstance<T extends object> = IObjectInstance<T>;

export interface IObjectOptions<T extends object = object> extends ISchemaOptions<ObjectInstance<T>> {
  schemaMap: SchemaMap<T>;
  callParentHooks?: boolean;
}

// populate an object and instanceMap simultaneously
export async function populateObject<T extends object>(
  obj: T,
  instanceMap: SchemaInstanceMap<T>,
  schemaMap: SchemaMap<T>,
  populateReference: PopulateMap<T>,
) {
  const newObj: {[key in keyof T]?: any} = {};

  await Promise.all(Object.keys(populateReference).map(async (key: keyof T) => {
    const schema = schemaMap[key];
    if (!schema) {
      throw new Error(`Key ${key} not found in schema.`);
    }

    if (!schema.populate) {
      throw new Error(`Key ${key} is not populatable.`);
    }

    const instance = instanceMap[key];
    if (instance === undefined) {
      return;
    }

    newObj[key] = await schema.populate(instance, populateReference[key]);
  }));

  Object.assign(obj, newObj);

  return obj as T;
}

// proxify an object to sync changes to an instanceMap
export function proxifyObject<T extends object>(
  obj: T,
  instanceMap: SchemaInstanceMap<T>,
  parentInstance: ISchemaParentInstance,
  schemaMap: SchemaMap<T>,
) {
  return new Proxy(obj, {
    set(target, key: keyof T, value, receiver) {
      if (typeof key !== 'symbol' && schemaMap[key]) {
        parentInstance.beforeChange([], {[key]: value}, parentInstance);

        const oldInstance = instanceMap[key];
        if (oldInstance) {
          delete oldInstance.parent;
        }

        instanceMap[key] = schemaMap[key].create(
          value,
          {parent: {instance: parentInstance, path: key}},
        );
        target[key] = instanceMap[key].value;

        parentInstance.afterChange([], {[key]: value}, parentInstance);
      } else {
        target[key] = value;
      }
      return true;
    },
    deleteProperty(target, key: keyof T) {
      if (typeof key !== 'symbol' && schemaMap[key]) {
        parentInstance.beforeChange([], {[key]: undefined}, parentInstance);

        const oldInstance = instanceMap[key];
        if (oldInstance) {
          delete oldInstance.parent;
        }

        delete instanceMap[key];
        delete target[key];

        parentInstance.afterChange([], {[key]: undefined}, parentInstance);
      } else {
        delete target[key];
      }
      return true;
    },
  }) as T;
}

// set an object and instanceMap simultaneously
export function setObject<T extends object>(
  data: object,
  obj: T,
  instanceMap: SchemaInstanceMap<T>,
  parentInstance: ISchemaParentInstance,
  schemaMap: SchemaMap<T>,
  sanitizeOptions: ISanitizeOptions,
) {
  const dataKeys = Object.keys(data);
  const schemaKeys = Object.keys(schemaMap);
  const disallowedKeys = difference(dataKeys, schemaKeys);
  if (disallowedKeys.length > 0) {
    throw new SanitizationError(
      `Key ${disallowedKeys[0]} not found in schema.`, 'key-not-in-schema', sanitizeOptions.parent,
    );
  }

  const newInstanceMap = {} as SchemaInstanceMap<T>;

  // sanitize all values before setting
  schemaKeys.forEach((key: keyof T) => {
    if (data[key as any] === undefined && !sanitizeOptions.defaults) {
      return;
    }

    newInstanceMap[key] = schemaMap[key].create(
      data[key as any],
      {...sanitizeOptions, parent: {instance: parentInstance, path: key}},
    );
  });

  schemaKeys.forEach((key: keyof T) => {
    if (sanitizeOptions.replace || key in data) {
      if (instanceMap[key]) {
        delete instanceMap[key].parent;
      }
      delete instanceMap[key];
      delete obj[key];
    }

    if (newInstanceMap[key]) {
      instanceMap[key] = newInstanceMap[key];
      obj[key] = newInstanceMap[key].value;
    }
  });
}

export function toObject<T extends object>(
  instanceMap: SchemaInstanceMap<T>,
  options?: IToObjectOptions,
) {
  const newObj = {} as T;
  Object.keys(instanceMap).forEach((key: keyof T) => {
    const instance = instanceMap[key];
    newObj[key] = instance.schema.toObject(instance, options);
  });

  return newObj;
}

export async function validateObject<T extends object>(
  instanceMap: SchemaInstanceMap<T>,
  parentInstance: ISchemaParentInstance,
  schemaMap: SchemaMap<T>,
) {
  await Promise.all(Object.keys(schemaMap).map(async (key: keyof T) => {
    const schema = schemaMap[key];
    const instance = instanceMap[key];

    if (schema.options.required && instance === undefined) {
      throw new ValidationError(`Key ${key} is required.`, 'required', {instance: parentInstance, path: key});
    }

    if (instance) {
      await schema.validate(instance);
    }
  }));
}

export class ObjectSchema<T extends object = object> implements ISchema<T, ObjectInstance<T>> {
  constructor(public readonly options: IObjectOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}): ObjectInstance<T> {
    const sanitizedValue = this.sanitize(value, sanitizeOptions);

    if (sanitizedValue === undefined) {
      return undefined;
    }

    const instance: ObjectInstance<T> = {
      instanceMap: {},
      parent: sanitizeOptions.parent,
      schema: this,
      value: undefined,
      beforeChange: (path: Path, newValue: any, oldInstance: ISchemaInstance) => {
        if (this.options.callParentHooks !== false && instance.parent) {
          instance.parent.instance.beforeChange([instance.parent.path].concat(path), newValue, oldInstance);
        }
      },
      afterChange: (path: Path, newValue: any, newInstance: ISchemaInstance) => {
        if (this.options.callParentHooks !== false && instance.parent) {
          instance.parent.instance.afterChange([instance.parent.path].concat(path), newValue, newInstance);
        }
      },
    };

    const obj = {};
    setObject(sanitizedValue, obj, instance.instanceMap, instance, this.options.schemaMap, sanitizeOptions);

    instance.value = proxifyObject<T>(obj as T, instance.instanceMap, instance, this.options.schemaMap);

    return instance;
  }

  public async populate(instance: ObjectInstance<T>, populateReference: PopulateReference<T>) {
    if (populateReference === true) {
      throw new Error('populateReference must be an object.');
    }

    return populateObject(instance.value, instance.instanceMap, this.options.schemaMap, populateReference);
  }

  public toObject(instance: ObjectInstance<T>, options: IToObjectOptions = {}) {
    return toObject<T>(instance.instanceMap, options);
  }

  public async validate(instance: ObjectInstance<T>) {
    await validateObject(instance.instanceMap, instance, this.options.schemaMap);
    await validate(this.options, instance);
  }

  protected sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
    if (value === undefined) {
      if (this.options.required && sanitizeOptions.defaults) {
        return {};
      }
      return undefined;
    }

    if (typeof value !== 'object') {
      throw new SanitizationError('Value is not an object.', 'no-object', sanitizeOptions.parent);
    }

    return value;
  }
}

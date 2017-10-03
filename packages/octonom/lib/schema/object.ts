import { difference } from 'lodash';

import { SanitizationError, ValidationError } from '../errors';
import { IOctoInstance, IOctoParentInstance, IOctoValueMap, ISanitizeOptions, ISchema,
         ISchemaMap, ISchemaOptions, IToObjectOptions,
         OctoValue, Path, PopulateReference,
       } from './value';

// export interface IArrayOptions<T = any> extends ISchemaOptions<OctoArray<T>> {}
export interface IObjectOptions<T extends object = object> extends ISchemaOptions<OctoObject<T>> {
  schemaMap: ISchemaMap;
}

// populate an object and octoValueMap simultaneously
export async function populateObject(
  obj: object,
  octoValueMap: IOctoValueMap,
  schemaMap: ISchemaMap,
  populateReference: PopulateReference,
) {
  const newObj = {};

  await Promise.all(Object.keys(populateReference).map(async key => {
    const schema = schemaMap[key];
    if (!schema) {
      throw new Error(`Key ${key} not found in schema.`);
    }

    if (octoValueMap[key] === undefined) {
      return;
    }

    newObj[key] = await octoValueMap[key].populate(populateReference[key]);
  }));

  Object.keys(newObj).forEach(key => {
    obj[key] = newObj[key];
    octoValueMap[key].value = newObj[key];
  });

  return newObj;
}

// proxify an object to sync changes to an octoValueMap
export function proxifyObject(
  obj: object,
  octoValueMap: IOctoValueMap,
  parentInstance: IOctoParentInstance,
  schemaMap: ISchemaMap,
) {
  return new Proxy(obj, {
    set(target, key, value, receiver) {
      if (typeof key !== 'symbol' && schemaMap[key]) {
        parentInstance.beforeChange([key], value, parentInstance);

        const oldOctoValue = octoValueMap[key];
        if (oldOctoValue) {
          oldOctoValue.detach();
        }

        octoValueMap[key] = schemaMap[key].create(
          value,
          {parent: {instance: parentInstance, path: key}},
        );
        target[key] = octoValueMap[key].value;

        parentInstance.afterChange([key], value, parentInstance);
      } else {
        target[key] = value;
      }
      return true;
    },
    deleteProperty(target, key) {
      if (typeof key !== 'symbol' && schemaMap[key]) {
        parentInstance.beforeChange([key], undefined, parentInstance);

        const oldOctoValue = octoValueMap[key];
        if (oldOctoValue) {
          oldOctoValue.detach();
        }

        delete octoValueMap[key];
        delete target[key];

        parentInstance.afterChange([key], undefined, parentInstance);
      } else {
        delete target[key];
      }
      return true;
    },
  });
}

// set an object and octoValueMap simultaneously
export function setObject(
  data: object,
  obj: object,
  octoValueMap: IOctoValueMap,
  parentInstance: IOctoParentInstance,
  schemaMap: ISchemaMap,
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

  const newOctoValueMap = {};

  // sanitize all values before setting
  schemaKeys.forEach(key => {
    if (data[key] === undefined && !sanitizeOptions.defaults) {
      return;
    }

    newOctoValueMap[key] = schemaMap[key].create(
      data[key],
      {...sanitizeOptions, parent: {instance: parentInstance, path: key}},
    );
  });

  schemaKeys.forEach(key => {
    if (sanitizeOptions.replace || key in data) {
      if (octoValueMap[key]) {
        octoValueMap[key].detach();
      }
      delete octoValueMap[key];
      delete obj[key];
    }

    if (newOctoValueMap[key]) {
      octoValueMap[key] = newOctoValueMap[key];
      obj[key] = newOctoValueMap[key].value;
    }
  });
}

export function toObject(octoValueMap: IOctoValueMap, options?: IToObjectOptions) {
  const newObj = {};
  Object.keys(octoValueMap).forEach(key => {
    const value = octoValueMap[key].toObject();
    if (value === undefined) {
      return;
    }

    newObj[key] = value;
  });

  return newObj;
}

export async function validateObject(
  octoValueMap: IOctoValueMap,
  parentInstance: IOctoParentInstance,
  schemaMap: ISchemaMap,
) {
  await Promise.all(Object.keys(schemaMap).map(async key => {
    const schema = schemaMap[key];
    const octoValue = octoValueMap[key];
    if (schema.options.required && (octoValue === undefined || octoValue.value === undefined)) {
      throw new ValidationError(`Key ${key} is required.`, 'required', {instance: parentInstance, path: key});
    }
    await octoValueMap[key].validate();
  }));
}

export class OctoObject<T extends object = object> extends OctoValue<T> {
  public value: T;
  public octoValueMap: IOctoValueMap;

  constructor(value: any, public schemaOptions: IObjectOptions<T>, sanitizeOptions: ISanitizeOptions) {
    super(schemaOptions, sanitizeOptions.parent);

    // return undefined if no data and value is not required
    const newValue = value === undefined && sanitizeOptions.defaults ? {} : value;

    if (typeof newValue !== 'object') {
      throw new SanitizationError('Data is not an object.', 'no-object', sanitizeOptions.parent);
    }

    const octoValueMap = {};
    const obj = {};

    setObject(newValue, obj, octoValueMap, this, schemaOptions.schemaMap, sanitizeOptions);

    this.octoValueMap = octoValueMap;
    this.value = proxifyObject(obj, this.octoValueMap, this, this.schemaOptions.schemaMap) as T;
  }

  public beforeChange(path: Path, value: any, oldInstance: IOctoInstance) {
    if (this.parent && this.parent.instance.beforeChange) {
      this.parent.instance.beforeChange([this.parent.path].concat(path), value, oldInstance);
    }
  }

  public afterChange(path: Path, value: any, newInstance: IOctoInstance) {
    if (this.parent && this.parent.instance.afterChange) {
      this.parent.instance.afterChange([this.parent.path].concat(path), value, newInstance);
    }
  }

  public async populate(populateReference: PopulateReference) {
    return populateObject(this.value, this.octoValueMap, this.schemaOptions.schemaMap, populateReference) as Promise<T>;
  }

  public toObject(options?: IToObjectOptions) {
    return toObject(this.octoValueMap, options) as T;
  }

  public async validate() {
    await validateObject(this.octoValueMap, this, this.schemaOptions.schemaMap);
    await super.validate();
  }
}

export class ObjectSchema<T extends object = object> implements ISchema {
  constructor(public options: IObjectOptions<T>) {}

  public create(value: any, sanitizeOptions: ISanitizeOptions = {}) {
    return new OctoObject<T>(value, this.options, sanitizeOptions);
  }
}

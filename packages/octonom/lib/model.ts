import { cloneDeep } from 'lodash';

import { HookHandlersMap, Hooks } from './hooks';
import { IPopulateMap, populateObject } from './populate';
import { ISanitizeOptions, sanitize, setObjectSanitized } from './sanitize';
import { SchemaMap, SchemaValue } from './schema';
import { IToObjectOptions, toObject } from './to-object';
import { validateObject } from './validate';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface IModelConstructor<T extends Model> {
  schema: SchemaMap;
  hooks: Hooks<T>;
  new (data: Partial<T>): T;
}

export interface IModel {
  constructor: typeof Model;
}

export function Property(schema: SchemaValue): PropertyDecorator {
  return (target: IModel, key: string) => {
    const constructor = target.constructor;
    constructor.schema = cloneDeep(constructor.schema);
    constructor.schema[key] = schema;
  };
}

export function Hook<TModel extends Model,  K extends keyof HookHandlersMap<TModel>>(
  name: K, handler: HookHandlersMap<TModel>[K][0],
) {
  return (constructor: IModelConstructor<TModel>) => {
    constructor.hooks = new Hooks<TModel>(constructor.hooks);
    constructor.hooks.register(name, handler);
  };
}

// TODO: Model can be made an abstract class but the type Constructor<Model>
//       doesn't work anymore (e.g., used in mixins)
export class Model {
  public static schema: SchemaMap = {};

  public static hooks = new Hooks<Model>();

  /**
   * Attach schema information to the property
   * @param schema Schema definition
   */
  public static Property = Property;

  // TODO: ideally we'd also use Partial<this> as the type for data
  constructor(data?) {
    const constructor = this.constructor as typeof Model;
    const schema = constructor.schema;

    // set initial data
    this.set(data || {}, {defaults: true, replace: true});

    // create proxy that intercepts set operations
    // for running sanitization if the key is in the schema
    // note: we use proxy for the hooks so they don't need to
    //       worry about sanitizing values (they do need to worry
    //       about recursive set calls though!)
    const proxy = new Proxy(this, {
      set(target, key, value, receiver) {
        if (schema[key]) {
          constructor.hooks.run('beforeSet', {instance: receiver, data: {[key]: value}});
          target[key] = sanitize(schema[key], value);
          constructor.hooks.run('afterSet', {instance: receiver, data: {[key]: value}});
        } else {
          target[key] = value;
        }
        return true;
      },
      deleteProperty(target, key) {
        if (schema[key]) {
          constructor.hooks.run('beforeSet', {instance: proxy, data: {[key]: undefined}});
          delete target[key];
          constructor.hooks.run('afterSet', {instance: proxy, data: {[key]: undefined}});
        } else {
          delete target[key];
        }
        return true;
      },
    });

    return proxy;
  }

  public inspect() {
    return this.toObject();
  }

  public async populate(populateMap: IPopulateMap) {
    const constructor = this.constructor as typeof Model;
    return populateObject(this, constructor.schema, populateMap);
  }

  // TODO: sanitize is called twice when this is called via the proxy
  public set(data: Partial<this>, options: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    constructor.hooks.run('beforeSet', {instance: this, data});
    setObjectSanitized(constructor.schema, this, data, options);
    constructor.hooks.run('afterSet', {instance: this, data});
  }

  public toObject(options?: IToObjectOptions): Partial<this> {
    const constructor = this.constructor as typeof Model;
    return toObject(constructor.schema, this, options) as Partial<this>;
  }

  public toJSON() {
    return this.toObject();
  }

  public async validate() {
    const constructor = this.constructor as typeof Model;
    await validateObject(constructor.schema, this, [], this);
  }
}

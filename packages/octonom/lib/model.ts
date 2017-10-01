import { HookHandlersMap, Hooks } from './hooks';
import { populateObject, proxifyObject, setObject, toObject, validateObject } from './schema/object';
import { IOctoInstance, IOctoParentInstance, IOctoValueMap, IPopulateMap, ISanitizeOptions, ISchema, ISchemaMap,
         IToObjectOptions, OctoValue, Path,
       } from './schema/value';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface IModelConstructor<T extends Model> {
  schemaMap: ISchemaMap;
  hooks: Hooks<T>;
  new (data: Partial<T>, sanitizeOptions?: ISanitizeOptions): T;
}

export interface IModel {
  constructor: typeof Model;
}

export function Hook<TModel extends Model, K extends keyof HookHandlersMap<TModel>>(
  name: K, handler: HookHandlersMap<TModel>[K][0],
) {
  return (constructor: IModelConstructor<TModel>) => {
    constructor.hooks = new Hooks<TModel>(constructor.hooks);
    constructor.hooks.register(name, handler);
  };
}

export interface IShadow extends IOctoParentInstance {
  value: Model;
  octoValueMap: IOctoValueMap;
}

const shadowProperty = Symbol();
const shadowGet = Symbol();
const shadowSet = Symbol();

// TODO: Model can be made an abstract class but the type Constructor<Model>
//       doesn't work anymore (e.g., used in mixins)
export class Model {
  public static schemaMap: ISchemaMap = {};

  public static hooks = new Hooks<Model>();

  public static setSchema(key: string, schema: ISchema) {
    if (this.schemaMap[key]) {
      throw new Error(`Key ${key} is already set.`);
    }
    this.schemaMap = Object.assign({}, this.schemaMap);
    this.schemaMap[key] = schema;
  }

  // TODO: ideally we'd also use Partial<this> as the type for data
  constructor(data?, sanitizeOptions: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;

    // The shadow property holds data that is required to allow methods to operate on both
    // the instance and the OctoValue hierarchy that is hidden from the user.
    const shadow: IShadow = {
      value: this,
      octoValueMap: {},
      parent: sanitizeOptions.parent,
      beforeChange: (path: Path, value: any, instance: IOctoInstance) => {
        constructor.hooks.run('beforeChange', {path, value, instance});
        if (shadow.parent) {
          shadow.parent.instance.beforeChange([shadow.parent.path].concat(path), value, instance);
        }
      },
      afterChange: (path: Path, value: any, instance: IOctoInstance) => {
        constructor.hooks.run('afterChange', {path, value, instance});
        if (shadow.parent) {
          shadow.parent.instance.afterChange([shadow.parent.path].concat(path), value, instance);
        }
      },
    };
    this[shadowSet](shadow);

    setObject(data || {}, this, shadow.octoValueMap, shadow, constructor.schemaMap, sanitizeOptions);

    return proxifyObject(this, shadow.octoValueMap, shadow, constructor.schemaMap) as Model;
  }

  public inspect() {
    return this.toObject();
  }

  public async populate(populateMap: IPopulateMap) {
    const constructor = this.constructor as typeof Model;
    const shadow = this[shadowGet]() as IShadow;
    await populateObject(shadow.value, shadow.octoValueMap, constructor.schemaMap, populateMap);
    return this;
  }

  // note: set runs with `this` bound to the unproxied instance, therefore
  //       the hooks will be called with the unproxied instance as well.
  //       This prevents recursion when handlers set properties.
  //       The set hooks are called by the proxy.
  public set(data: Partial<this>, options: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    const shadow = this[shadowGet]() as IShadow;
    setObject(data, shadow.value, shadow.octoValueMap, shadow, constructor.schemaMap, options);
  }

  public toObject(options?: IToObjectOptions): Partial<this> {
    const constructor = this.constructor as typeof Model;
    const shadow = this[shadowGet]() as IShadow;
    return toObject(shadow.octoValueMap, options);
  }

  public toJSON() {
    return this.toObject();
  }

  public async validate() {
    const constructor = this.constructor as typeof Model;
    const shadow = this[shadowGet]() as IShadow;
    await validateObject(shadow.octoValueMap);
  }

  protected [shadowSet](shadow: IShadow) {
    this[shadowProperty] = shadow;
  }

  protected [shadowGet](shadow: IShadow) {
    return this[shadowProperty] as IShadow;
  }
}

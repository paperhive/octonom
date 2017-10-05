import { HookHandlersMap, Hooks } from './hooks';
import {
         ObjectInstance, ObjectSchema, /* populateObject,*/
         proxifyObject, setObject, validateObject,
       } from './schema/object';
import {
         IPopulateMap, ISanitizeOptions, ISchema,
         ISchemaInstance, ISchemaParentInstance,
         IToObjectOptions, Path, SchemaInstanceMap, SchemaMap,
       } from './schema/schema';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface IModelConstructor<T extends Model> {
  schemaMap: SchemaMap;
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

const shadowInstanceProperty = Symbol();
const getShadowInstance = Symbol();
const setShadowInstance = Symbol();

// TODO: Model can be made an abstract class but the type Constructor<Model>
//       doesn't work anymore (e.g., used in mixins)
export class Model {
  public static schemaMap: SchemaMap = {};

  public static hooks = new Hooks<Model>();

  public static setSchema(key: string, schema: ISchema<any, ISchemaInstance>) {
    if (this.schemaMap[key]) {
      throw new Error(`Key ${key} is already set.`);
    }
    this.schemaMap = Object.assign({}, this.schemaMap);
    this.schemaMap[key] = schema;
  }

  // TODO: ideally we'd also use Partial<this> as the type for data
  constructor(data?, sanitizeOptions: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    const schemaMap = constructor.schemaMap as SchemaMap<this>;

    const objectSchema = new ObjectSchema<this>({schemaMap});

    // The shadow property holds data that is required to allow methods to operate on both
    // the instance and the OctoValue hierarchy that is hidden from the user.
    const shadowInstance: ObjectInstance<this> = {
      instanceMap: {},
      parent: sanitizeOptions.parent,
      schema: objectSchema,
      value: this,
      beforeChange: (path: Path, value: any, oldInstance: ISchemaInstance) => {
        constructor.hooks.run('beforeChange', {path, value, modelInstance: this, schemaInstance: oldInstance});
        if (shadowInstance.parent) {
          shadowInstance.parent.instance.beforeChange([shadowInstance.parent.path].concat(path), value, oldInstance);
        }
      },
      afterChange: (path: Path, value: any, newInstance: ISchemaInstance) => {
        constructor.hooks.run('afterChange', {path, value, modelInstance: this, schemaInstance: newInstance});
        if (shadowInstance.parent) {
          shadowInstance.parent.instance.afterChange([shadowInstance.parent.path].concat(path), value, newInstance);
        }
      },
    };
    this[setShadowInstance](shadowInstance);

    setObject(data || {}, this, shadowInstance.instanceMap, shadowInstance, schemaMap, sanitizeOptions);

    return proxifyObject(this, shadowInstance.instanceMap, shadowInstance, schemaMap);
  }

  public inspect() {
    return this.toObject();
  }

  public async populate(populateMap: IPopulateMap) {
    /*
    const constructor = this.constructor as typeof Model;
    const shadow = this[getShadowInstance]() as ObjectInstance<this>;
    await populateObject(shadow.value, shadow.instanceMap, constructor.schemaMap, populateMap);
    */
    return this;
  }

  // note: set runs with `this` bound to the unproxied instance, therefore
  //       the hooks will be called with the unproxied instance as well.
  //       This prevents recursion when handlers set properties.
  //       The set hooks are called by the proxy.
  public set(data: Partial<this>, options: ISanitizeOptions = {}) {
    const constructor = this.constructor as typeof Model;
    const schemaMap = constructor.schemaMap as SchemaMap<this>;
    const shadowInstance = this[getShadowInstance]() as ObjectInstance<this>;
    shadowInstance.beforeChange([], data, shadowInstance);
    setObject(data, shadowInstance.value, shadowInstance.instanceMap, shadowInstance, schemaMap, options);
    shadowInstance.afterChange([], data, shadowInstance);
  }

  public toObject(options?: IToObjectOptions): Partial<this> {
    const constructor = this.constructor as typeof Model;
    const shadowInstance = this[getShadowInstance]() as ObjectInstance<this>;
    return shadowInstance.schema.toObject(shadowInstance, options);
  }

  public toJSON() {
    return this.toObject();
  }

  public async validate() {
    const constructor = this.constructor as typeof Model;
    const shadowInstance = this[getShadowInstance]() as ObjectInstance<this>;
    await shadowInstance.schema.validate(shadowInstance);
  }

  protected [setShadowInstance](instance: ObjectInstance<this>) {
    this[shadowInstanceProperty] = instance;
  }

  protected [getShadowInstance]() {
    return this[shadowInstanceProperty];
  }
}

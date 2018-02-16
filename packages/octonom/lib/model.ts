import { SanitizationError } from './errors';
import { HookHandlersMap, Hooks } from './hooks';
import { ModelInstance, ModelSchema } from './schema/model';
import { populateObject, proxifyObject, setObject, toObject,
         validateObject,
       } from './schema/object';
import { ISanitizeOptions, ISchema, ISchemaInstance,
         IToObjectOptions, Path, PopulateMap, SchemaMap,
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

const shadowInstanceProperty = Symbol('shadowInstanceProperty');
export const getShadowInstance = Symbol('getShadowInstance');
export const setShadowInstance = Symbol('setShadowInstance');

// TODO: think about model instances
function sanitize(value: any, sanitizeOptions: ISanitizeOptions) {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== 'object') {
    throw new SanitizationError('Value is not an object.', 'no-object', sanitizeOptions.parent);
  }

  return value;
}

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
  constructor(value?, sanitizeOptions: ISanitizeOptions = {defaults: value === undefined}) {
    const constructor = this.constructor as typeof Model;
    const schemaMap = constructor.schemaMap as SchemaMap<this>;

    // The shadow property holds data that is required to allow methods to operate on both
    // the model instance and the instanceMap that is hidden from the user.
    const shadowInstance: ModelInstance<this> = {
      instanceMap: {},
      parent: sanitizeOptions.parent,
      schema: new ModelSchema<this>({model: constructor as any}),
      value: undefined,
      rawObject: this,
      beforeChange: (path: Path, newValue: any, oldInstance: ISchemaInstance) => {
        constructor.hooks.run(
          'beforeChange',
          {path, value: newValue, modelInstance: this, schemaInstance: oldInstance},
        );

        if (shadowInstance.schema.options.callParentHooks !== false && shadowInstance.parent) {
          shadowInstance.parent.instance.beforeChange([shadowInstance.parent.path].concat(path), newValue, oldInstance);
        }
      },
      afterChange: (path: Path, newValue: any, newInstance: ISchemaInstance) => {
        constructor.hooks.run(
          'afterChange',
          {path, value: newValue, modelInstance: this, schemaInstance: newInstance},
        );

        if (shadowInstance.schema.options.callParentHooks !== false && shadowInstance.parent) {
          shadowInstance.parent.instance.afterChange([shadowInstance.parent.path].concat(path), newValue, newInstance);
        }
      },
    };
    shadowInstance.value = proxifyObject(this, shadowInstance.instanceMap, shadowInstance, schemaMap);
    this[setShadowInstance](shadowInstance);

    const sanitizedValue = sanitize(value, sanitizeOptions);

    shadowInstance.beforeChange([], sanitizedValue, shadowInstance);
    setObject(sanitizedValue, this, shadowInstance.instanceMap, shadowInstance, schemaMap, sanitizeOptions);
    shadowInstance.afterChange([], sanitizedValue, shadowInstance);

    return shadowInstance.value;
  }

  public inspect() {
    return this.toObject();
  }

  public async populate(populateMap: PopulateMap<this>) {
    const constructor = this.constructor as typeof Model;
    const schemaMap = constructor.schemaMap as SchemaMap<this>;
    const shadowInstance = this[getShadowInstance]() as ModelInstance<this>;
    await populateObject(shadowInstance.rawObject, shadowInstance.instanceMap, schemaMap, populateMap);
    return this;
  }

  // note: set runs with `this` bound to the unproxied instance, therefore
  //       the hooks will be called with the unproxied instance as well.
  //       This prevents recursion when handlers set properties.
  //       The set hooks are called by the proxy.
  public set(data: Partial<this>, options: ISanitizeOptions = {}, runHooks = true) {
    const constructor = this.constructor as typeof Model;
    const schemaMap = constructor.schemaMap as SchemaMap<this>;
    const shadowInstance = this[getShadowInstance]() as ModelInstance<this>;

    if (runHooks) {
      shadowInstance.beforeChange([], data, shadowInstance);
    }

    setObject(data, shadowInstance.rawObject, shadowInstance.instanceMap, shadowInstance, schemaMap, options);

    if (runHooks) {
      shadowInstance.afterChange([], data, shadowInstance);
    }
  }

  public toObject(options?: IToObjectOptions): Partial<this> {
    const shadowInstance = this[getShadowInstance]() as ModelInstance<this>;
    return toObject(shadowInstance.instanceMap, options);
  }

  public toJSON() {
    return this.toObject();
  }

  public async validate() {
    const shadowInstance = this[getShadowInstance]() as ModelInstance<this>;
    await validateObject(
      shadowInstance.instanceMap,
      shadowInstance,
      shadowInstance.schema.options.model.schemaMap as SchemaMap<this>,
    );
  }

  protected [setShadowInstance](instance: ModelInstance<this>) {
    this[shadowInstanceProperty] = instance;
  }

  protected [getShadowInstance]() {
    return this[shadowInstanceProperty];
  }
}

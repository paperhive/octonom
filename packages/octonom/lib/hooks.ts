import { Collection } from './collection';
import { Model } from './model';
import { IOctoInstance, Path } from './schema/value';

/* Hook handlers are always called with instance set to the
 * instance where the hook is registered
 **/
export interface IChangeHookOptions<TModel extends Model> {
  path: Path;
  value: any;
  instance: Model;
  octoInstance: IOctoInstance;
}

export interface IChangeHooks<TModel extends Model = Model> {
  beforeChange?(options: IChangeHookOptions<TModel>);
  afterChange?(options: IChangeHookOptions<TModel>);
}

// union of all hook interfaces
export type IHooks<TModel extends Model = Model> = IChangeHooks<TModel>;

export interface IHookOptionsMap<TModel extends Model> {
  beforeChange: IChangeHookOptions<TModel>;
  afterChange: IChangeHookOptions<TModel>;
}

export type hookHandlers<TOptions> = Array<(options: TOptions) => void>;

export type HookHandlersMap<TModel extends Model> = {
  [k in keyof IHookOptionsMap<TModel>]: hookHandlers<IHookOptionsMap<TModel>[k]>;
};

export class Hooks<TModel extends Model> {
  private handlers: HookHandlersMap<TModel> = {
    beforeChange: [],
    afterChange: [],
  };

  constructor(hooks?: Hooks<TModel>) {
    // copy hooks from passed Hooks instance
    if (hooks) {
      Object.keys(this.handlers).forEach(key => {
        this.handlers[key] = hooks.handlers[key].slice();
      });
    }
  }

  public register<K extends keyof HookHandlersMap<TModel>>(name: K, handler: HookHandlersMap<TModel>[K][0]) {
    const handlers = this.handlers[name] as Array<HookHandlersMap<TModel>[K][0]>;
    handlers.push(handler);
  }

  public run<K extends keyof IHookOptionsMap<TModel>>(name: K, options: IHookOptionsMap<TModel>[K]) {
    const handlers = this.handlers[name] as Array<HookHandlersMap<TModel>[K][0]>;
    handlers.forEach(handler => handler(options));
  }
}

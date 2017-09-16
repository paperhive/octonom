import { Collection } from './collection';
import { Model } from './model';
import { ISanitizeOptions } from './schema/schema';

export interface ISetHookOptions<TModel extends Model> {
  instance: TModel;
  data: Partial<TModel>;
  options?: ISanitizeOptions;
}

export interface ISaveHookOptions<TModel extends Model> {
  instance: TModel;
  collection: Collection<TModel>;
}

export interface IHookOptionsMap<TModel extends Model> {
  beforeSet: ISetHookOptions<TModel>;
  afterSet: ISetHookOptions<TModel>;
  beforeSave: ISaveHookOptions<TModel>;
  afterSave: ISaveHookOptions<TModel>;
}

export type hookHandlers<TOptions> = Array<(options: TOptions) => void>;

export type HookHandlersMap<TModel extends Model> = {
  [k in keyof IHookOptionsMap<TModel>]: hookHandlers<IHookOptionsMap<TModel>[k]>;
};

export class Hooks<TModel extends Model> {
  private handlers: HookHandlersMap<TModel> = {
    beforeSet: [],
    afterSet: [],
    beforeSave: [],
    afterSave: [],
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

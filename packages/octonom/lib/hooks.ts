import { Collection } from './collection';
import { Model } from './model';
import { ISanitizeOptions } from './sanitize';

export class HookHandlers<THookOptions, TModel extends Model> {
  private handlers: Array<(options: THookOptions) => void> = [];

  public register(handler: (options: THookOptions) => void) {
    this.handlers.push(handler);
  }

  public run(options: THookOptions) {
    this.handlers.forEach(handler => handler(options));
  }
}

export interface ISetHookOptions<TModel extends Model> {
  instance: TModel;
  data: Partial<TModel>;
  options?: ISanitizeOptions;
}

export interface ISaveHookOptions<TModel extends Model> {
  instance: TModel;
  collection: Collection<TModel>;
}

export type hookHandler<THookOptions> = (options: THookOptions) => void;

export interface IHookOptionMap<TModel extends Model> {
  beforeSet: ISetHookOptions<TModel>;
  afterSet: ISetHookOptions<TModel>;
  beforeSave: ISaveHookOptions<TModel>;
  afterSave: ISaveHookOptions<TModel>;
}

export type handlerNames<TModel extends Model> = keyof IHookOptionMap<TModel>;

export type HookHandlerMap<TModel extends Model> = {
  [k in handlerNames<TModel>]: (options: IHookOptionMap<TModel>[k]) => void;
};

export type HookHandlersMap<TModel extends Model> = {
  [k in handlerNames<TModel>]: Array<HookHandlerMap<TModel>[k]>;
};

export class Hooks<TModel extends Model> {
  private handlers: HookHandlersMap<TModel> = {
    beforeSet: [],
    afterSet: [],
    beforeSave: [],
    afterSave: [],
  };

  public add<K extends keyof HookHandlersMap<TModel>>(name: K, handler: HookHandlersMap<TModel>[K][0]) {
    this.handlers[name] = this.handlers[name].slice();
    const handlers = this.handlers[name] as Array<HookHandlersMap<TModel>[K][0]>;
    handlers.push(handler);
  }

  public run<K extends keyof IHookOptionMap<TModel>>(name: K, options: IHookOptionMap<TModel>[K]) {
    const handlers = this.handlers[name] as Array<HookHandlersMap<TModel>[K][0]>;
    handlers.forEach(handler => handler(options));
  }
}

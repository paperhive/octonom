import { ISchemaValueArray } from './schema';

export class ModelArray<T, TModel> extends Array<TModel> {
  constructor(
    public readonly model: new (data: any) => TModel,
    data: Array<TModel | Partial<T>> = [],
  ) {
    super();
    data.forEach(element => this.push(element));
    // note: we return a proxy for this object to intercept setting an array index
    //       for on-the-fly instanciation
    return new Proxy(this, {
      set: (target, key, value, receiver) => {
        if (typeof key === 'number' || typeof key === 'string' && /^\d$/.test(key)) {
          target[key] = this.toModel(value);
        } else {
          target[key] = value;
        }
        return true;
      },
    });
  }

  public toModel(element: TModel | Partial<T>) {
    if (element === undefined) {
      return undefined;
    }

    return element instanceof this.model
      ? element as TModel
      : new this.model(element);
  }

  public push(element: TModel | Partial<T>) {
    return super.push(this.toModel(element));
  }
}

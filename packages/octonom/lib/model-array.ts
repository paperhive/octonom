import { IModelConstructor } from './model';

export class ModelArray<T, TModel> extends Array<TModel> {
  constructor(
    public readonly model: IModelConstructor<TModel>,
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

  public fill(value: TModel | Partial<T>, start?: number, end?: number) {
    return super.fill(this.toModel(value), start, end);
  }

  public push(value: TModel | Partial<T>) {
    return super.push(this.toModel(value));
  }

  public splice(start: number, deleteCount?: number, ...values: Array<TModel | Partial<T>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.splice(start, deleteCount, ...models);
  }

  public toModel(value: TModel | Partial<T>) {
    if (value === undefined) {
      return undefined;
    }

    return value instanceof this.model
      ? value as TModel
      : new this.model(value as Partial<T>);
  }

  public unshift(...values: Array<TModel | Partial<T>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.unshift(...models);
  }
}

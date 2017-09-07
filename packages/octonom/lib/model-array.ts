import { IModelConstructor, Model } from './model';

export class ModelArray<T extends Model> extends Array<T> {
  constructor(
    public readonly model: IModelConstructor<T>,
    data: Array<Partial<T>> = [],
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

  public fill(value: Partial<T>, start?: number, end?: number) {
    return super.fill(this.toModel(value), start, end);
  }

  public push(value: Partial<T>) {
    return super.push(this.toModel(value));
  }

  public splice(start: number, deleteCount?: number, ...values: Array<Partial<T>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.splice(start, deleteCount, ...models);
  }

  public toModel(value: Partial<T>) {
    if (value === undefined) {
      return undefined;
    }

    return value instanceof this.model
      ? value as T
      : new this.model(value);
  }

  public unshift(...values: Array<Partial<T>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.unshift(...models);
  }
}

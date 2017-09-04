import { IModelConstructor, Model } from './model';

export class ModelArray<TModel extends Model<object>> extends Array<TModel> {
  constructor(
    public readonly model: IModelConstructor<TModel>,
    data: Array<Partial<TModel>> = [],
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

  public fill(value: Partial<TModel>, start?: number, end?: number) {
    return super.fill(this.toModel(value), start, end);
  }

  public push(value: Partial<TModel>) {
    return super.push(this.toModel(value));
  }

  public splice(start: number, deleteCount?: number, ...values: Array<Partial<TModel>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.splice(start, deleteCount, ...models);
  }

  public toModel(value: Partial<TModel>) {
    if (value === undefined) {
      return undefined;
    }

    return value instanceof this.model
      ? value as TModel
      : new this.model(value);
  }

  public unshift(...values: Array<Partial<TModel>>) {
    const models = values ? values.map(value => this.toModel(value)) : [];
    return super.unshift(...models);
  }
}

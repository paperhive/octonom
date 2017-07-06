import { ISchemaValueArray } from './schema';

export class ModelArray<TModel> extends Array<TModel> {
  constructor(
    protected model: new (data: any) => TModel,
    data: Array<TModel | object> = [],
  ) {
    super();
    data.forEach(element => this.push(element));
  }

  public push(element: TModel | object): number {
    const instance = element instanceof this.model
      ? element as TModel
      : new this.model(element);
    return super.push(instance);
  }

  // TODO: override setter for index
}

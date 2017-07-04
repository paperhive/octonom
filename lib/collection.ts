import { Model } from './model';
import { rename } from './utils';

export interface ICollectionOptions {
  modelIdField?: string;
}

export abstract class Collection<T extends object, TModel extends Model<T>> {
  protected modelIdField: string;

  constructor(
    protected model: new (data: any) => TModel,
    protected options: ICollectionOptions = {},
  ) {
    this.modelIdField = options.modelIdField || 'id';
  }

  public abstract async findById(id: string): Promise<TModel>;

  public toDb(model: TModel): object {
    return model.toObject({unpopulate: true});
  }

  public fromDb(doc: object): TModel {
    return new this.model(doc);
  }
}

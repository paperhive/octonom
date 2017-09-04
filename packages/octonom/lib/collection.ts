import { Model } from './model';
import { ModelArray } from './model-array';

export interface ICollectionOptions {
  modelIdField?: string;
}

export abstract class Collection<TModel extends Model<object>> {
  public readonly modelIdField: string;

  constructor(
    public readonly model: new (data: Partial<TModel>) => TModel,
    protected options: ICollectionOptions = {},
  ) {
    this.modelIdField = options.modelIdField || 'id';
  }

  public abstract async findById(id: string): Promise<TModel>;

  // trivial implementation, should be implemented efficiently for specific database
  public async findByIds(ids: string[]): Promise<ModelArray<TModel>> {
    return new ModelArray<TModel>(
      this.model,
      await Promise.all(ids.map(id => this.findById(id))),
    );
  }

  public toDb(model: TModel): object {
    return model.toObject({unpopulate: true});
  }

  public fromDb(doc: object): TModel {
    return new this.model(doc);
  }
}

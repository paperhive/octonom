import { IModelConstructor, Model } from './model';
import { ModelArray } from './model-array';

export abstract class Collection<T extends object, TModel extends Model<T>> {
  constructor(public readonly model: IModelConstructor<TModel>) {}

  public abstract async findById(id: string): Promise<TModel>;

  // trivial implementation, should be implemented efficiently for specific database
  public async findByIds(ids: string[]): Promise<ModelArray<T, TModel>> {
    return new ModelArray<T, TModel>(
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

export interface ICollectionMap {
  [k: string]: Collection<object, Model<object>>;
}

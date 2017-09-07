import { IModelConstructor, Model } from './model';
import { ModelArray } from './model-array';

export interface ICollectionOptions {
  modelIdField?: string;
}

export abstract class Collection<T extends Model> {
  public readonly modelIdField: string;

  constructor(
    public readonly model: IModelConstructor<T>,
    protected options: ICollectionOptions = {},
  ) {
    this.modelIdField = options.modelIdField || 'id';
  }

  public abstract async findById(id: string): Promise<T>;

  // trivial implementation, should be implemented efficiently for specific database
  public async findByIds(ids: string[]): Promise<ModelArray<T>> {
    return new ModelArray<T>(
      this.model,
      await Promise.all(ids.map(id => this.findById(id))),
    );
  }

  public toDb(model: T): object {
    return model.toObject({unpopulate: true});
  }

  public fromDb(doc: object): T {
    return new this.model(doc);
  }
}

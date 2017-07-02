import { CollectionModel } from './collection-model';

export abstract class Collection<T extends object, TModel extends CollectionModel<T>> {
  constructor(protected model: new (data: any) => TModel) {}

  public abstract async findById(id: string): Promise<TModel>;

  public toDb(obj: T): object {
    return obj;
  }

  public fromDb(doc: any): T {
    return doc;
  }
}

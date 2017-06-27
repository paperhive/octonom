import { Model } from './model';

export abstract class Collection<T extends object, TModel extends Model<T>> {
  constructor(protected name: string, protected model: new (data: any) => TModel) {}

  public abstract async findById(id: string): Promise<TModel>;

  public toDb(obj: T): object {
    return obj;
  }

  public fromDb(doc: any): T {
    return doc;
  }
}

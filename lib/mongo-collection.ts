import { Collection as DbCollection, Db } from 'mongodb';

import { Collection } from './collection';
import { Model } from './model';

export class MongoCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
  protected collection: DbCollection;

  public async insertOne(model: TModel) {
    const doc = model.toObject({unpopulate: true});

  }

  public async delete(model: TModel) {
    return;
  }

  public async findById(id: string) {
    return new this.model({});
  }

  public async init(db: Db) {
    this.collection = await db.createCollection(this.name);
  }

  public async update(model: TModel) {
    return new this.model({});
  }
}

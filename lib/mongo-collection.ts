import { Collection as DbCollection, Db, FindOneOptions } from 'mongodb';

import { Collection } from './collection';
import { Model } from './model';

export class MongoCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
  protected collection: DbCollection;

  public async insertOne(model: TModel) {
    const doc = model.toObject({unpopulate: true});
    await this.collection.insertOne(doc);
  }

  public async delete(model: TModel) {
    const result = await this.collection.deleteOne({_id: model.getId()});
    if (result.deletedCount === 0) {
      throw new Error('document not found in collection');
    }
  }

  public async findById(id: string) {
    return await this.findOne({_id: id});
  }

  public async findOne(query: object, options?: FindOneOptions) {
    const doc = await this.collection.findOne(query, options);
    if (!doc) {
      return undefined;
    }
    return new this.model(doc);
  }

  public async init(db: Db) {
    this.collection = await db.createCollection(this.name);
  }

  public async update(model: TModel) {
    return new this.model({});
  }
}

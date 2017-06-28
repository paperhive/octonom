import { Collection as DbCollection, CollectionInsertManyOptions, Cursor,
  Db, FindOneOptions } from 'mongodb';

import { Collection } from './collection';
import { CollectionModel } from './collection-model';

export class MongoCollection<T extends object, TModel extends CollectionModel<T>> extends Collection<T, TModel> {
  protected collection: DbCollection;

  public async insertMany(models: TModel[], options?: CollectionInsertManyOptions) {
    const docs = models.map(model => this.toDb(model.toObject({unpopulate: true})));
    await this.collection.insertMany(docs, options);
  }

  public async insertOne(model: TModel) {
    const doc = this.toDb(model.toObject({unpopulate: true}));
    await this.collection.insertOne(doc);
  }

  public async delete(model: TModel) {
    const result = await this.collection.deleteOne({_id: model.getId()});
    if (result.deletedCount === 0) {
      throw new Error('document not found in collection');
    }
  }

  public find(query: object) {
    return this.collection.find(query)
      .map(obj => new this.model(this.fromDb(obj))) as Cursor<TModel>;
  }

  public async findById(id: string) {
    return await this.findOne({_id: id});
  }

  public async findOne(query: object, options?: FindOneOptions) {
    const doc = await this.collection.findOne(query, options);
    if (!doc) {
      return undefined;
    }
    return new this.model(this.fromDb(doc));
  }

  public async init(db: Db) {
    this.collection = await db.createCollection(this.name);
  }

  public async update(model: TModel) {
    const doc = this.toDb(model.toObject({unpopulate: true}));
    const result = await this.collection.replaceOne({_id: model.getId()}, doc);
    if (result.matchedCount === 0) {
      throw new Error('document not found in collection');
    }
  }
}

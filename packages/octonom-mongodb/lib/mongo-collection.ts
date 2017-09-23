import { Collection as DbCollection, CollectionInsertManyOptions,
         Cursor, Db, FindOneOptions, ReplaceOneOptions,
       } from 'mongodb';

import { Collection, ICollectionInsertOptions, ICollectionOptions,
         IModelConstructor, Model, ModelArray, utils,
       } from 'octonom';

export interface IMongoCollectionInsertOptions extends ICollectionInsertOptions {
  mongoOptions?: CollectionInsertManyOptions;
}

export interface IMongoCollectionUpdateOptions extends ICollectionInsertOptions {
  mongoOptions?: ReplaceOneOptions;
}

export class MongoCollection<T extends Model> extends Collection<T> {
  protected collection: DbCollection;

  constructor(
    protected name: string,
    model: IModelConstructor<T>,
    options: ICollectionOptions<T> = {},
  ) {
    super(model, options);
  }

  public async insertMany(models: T[], options: IMongoCollectionInsertOptions = {}) {
    if (options.validate !== false) {
      await Promise.all(models.map(model => model.validate()));
    }
    const docs = models.map(model => this.toDb(model));
    await this.collection.insertMany(docs, options.mongoOptions);
  }

  public async insertOne(model: T, options: IMongoCollectionInsertOptions = {}) {
    if (options.validate !== false) {
      await model.validate();
    }
    const doc = this.toDb(model);
    await this.collection.insertOne(doc, options.mongoOptions);
  }

  public async delete(model: T) {
    const result = await this.collection.deleteOne({_id: model[this.modelIdField]});
    if (result.deletedCount === 0) {
      throw new Error('document not found in collection');
    }
  }

  public find(query: object) {
    return this.collection.find(query)
      .map(obj => this.fromDb(obj)) as Cursor<T>;
  }

  public async findById(id: string) {
    return await this.findOne({_id: id});
  }

  public async findByIds(ids: string[]) {
    const docs = await this.collection.find({_id: {$in: ids}}).toArray();
    const idInstanceMap: {[k: string]: T} = {};
    // note: ids that could not be found won't be present in the docs result array
    docs.forEach(doc => idInstanceMap[doc._id] = this.fromDb(doc));
    return new ModelArray<T>(this.model, ids.map(id => idInstanceMap[id]));
  }

  public async findOne(query: object, options?: FindOneOptions) {
    const doc = await this.collection.findOne(query, options);
    if (!doc) {
      return undefined;
    }
    return this.fromDb(doc);
  }

  public async init(db: Db) {
    this.collection = await db.createCollection(this.name);
  }

  public toDb(model: T) {
    return utils.rename(super.toDb(model), {[this.modelIdField]: '_id'});
  }

  public fromDb(doc: object) {
    return super.fromDb(utils.rename(doc, {_id: this.modelIdField}));
  }

  public async update(model: T, options: IMongoCollectionUpdateOptions = {}) {
    if (options.validate !== false) {
      await model.validate();
    }
    const doc = this.toDb(model);
    const result = await this.collection.replaceOne(
      {_id: model[this.modelIdField]},
      doc,
      options.mongoOptions,
    );

    if (result.matchedCount === 0) {
      throw new Error('document not found in collection');
    }
  }
}

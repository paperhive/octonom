import { Collection as DbCollection, CollectionInsertManyOptions, Cursor,
  Db, FindOneOptions } from 'mongodb';

import { Collection, IModelConstructor, Model, ModelArray, utils } from 'octonom';

export class MongoCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
  protected collection: DbCollection;

  constructor(
    protected name: string,
    model: IModelConstructor<TModel>,
  ) {
    super(model);
  }

  public async insertMany(models: TModel[], options?: CollectionInsertManyOptions) {
    const docs = models.map(model => this.toDb(model));
    await this.collection.insertMany(docs, options);
  }

  public async insertOne(model: TModel) {
    const doc = this.toDb(model);
    await this.collection.insertOne(doc);
  }

  public async delete(model: TModel) {
    const idProperty = this.model._options.primaryIdProperty;
    const result = await this.collection.deleteOne({_id: model[idProperty]});
    if (result.deletedCount === 0) {
      throw new Error('document not found in collection');
    }
  }

  public find(query: object) {
    return this.collection.find(query)
      .map(obj => this.fromDb(obj)) as Cursor<TModel>;
  }

  public async findById(id: string) {
    return await this.findOne({_id: id});
  }

  public async findByIds(ids: string[]) {
    const docs = await this.collection.find({_id: {$in: ids}}).toArray();
    const idInstanceMap: {[k: string]: TModel} = {};
    // note: ids that could not be found won't be present in the docs result array
    docs.forEach(doc => idInstanceMap[doc._id] = this.fromDb(doc));
    return new ModelArray<T, TModel>(this.model, ids.map(id => idInstanceMap[id]));
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

  public toDb(model: TModel) {
    const idProperty = this.model._options.primaryIdProperty;
    return utils.rename(super.toDb(model), {[idProperty]: '_id'});
  }

  public fromDb(doc: object) {
    const idProperty = this.model._options.primaryIdProperty;
    return super.fromDb(utils.rename(doc, {_id: idProperty}));
  }

  public async update(model: TModel) {
    const doc = this.toDb(model);
    const idProperty = this.model._options.primaryIdProperty;
    const result = await this.collection.replaceOne({_id: model[idProperty]}, doc);
    if (result.matchedCount === 0) {
      throw new Error('document not found in collection');
    }
  }
}

import { Db, MongoClient } from 'mongodb';

import { Model } from './model';
import { MongoCollection } from './mongo-collection';
import { generateId } from './utils';

describe('MongoCollection', () => {
  interface ICat {
    _id: string;
    name: string;
  }

  class CatModel extends Model<ICat> {
    @Model.PropertySchema({type: 'string', default: generateId})
    public _id: string;

    @Model.PropertySchema({type: 'string'})
    public name: string;
  }

  class CatCollection extends MongoCollection<ICat, CatModel> {}

  let db: Db;
  let catCollection: CatCollection;

  beforeEach(async () => {
    db = await MongoClient.connect('mongodb://localhost:27017/paperhive-dev');
    catCollection = new CatCollection('cats', CatModel);
    await catCollection.init(db);
  });

  afterEach(async () => {
    // nuke database
    await db.dropDatabase();
    await db.close();
  });

  describe('init', () => {
    it('should create the collection', async () => {
      expect(catCollection).to.have.property('collection');
      const collections = await db.collections();
      expect(collections).to.be.an('array').and.have.lengthOf(1);
      expect(collections[0]).to.have.property('collectionName', 'cats');
    });
  });
});

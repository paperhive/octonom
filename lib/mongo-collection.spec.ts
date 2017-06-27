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

    public getId() {
      return this._id;
    }
  }

  class CatCollection extends MongoCollection<ICat, CatModel> {}
  const catObj = {_id: '42', name: 'Yllim'};

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

  describe('init()', () => {
    it('should create the collection', async () => {
      expect(catCollection).to.have.property('collection');
      const collections = await db.collections();
      expect(collections).to.be.an('array').and.have.lengthOf(1);
      expect(collections[0]).to.have.property('collectionName', 'cats');
    });
  });

  describe('insertOne()', () => {
    it('should insert a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      const doc = await db.collection('cats').findOne({_id: '42'});
      expect(doc).to.eql(catObj);
    });
  });

  describe('delete()', () => {
    it('should throw if the model does not exist in the collection', async () => {
      const cat = new CatModel(catObj);
      await expect(catCollection.delete(cat)).to.be.rejectedWith('document not found');
    });

    it('should delete a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      await catCollection.delete(cat);
      const doc = await db.collection('cats').findOne({_id: '42'});
      expect(doc).to.equal(null);
    });
  });

  describe('findById()', () => {
    it('should return undefined if no document was found', async () => {
      const cat = await catCollection.findById('foo');
      expect(cat).to.equal(undefined);
    });

    it('should find a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      const foundCat = await catCollection.findById('42');
      expect(foundCat).to.be.instanceOf(CatModel);
      expect(foundCat.toObject()).to.eql(catObj);
    });
  });

  describe('findOne()', () => {
    it('should return undefined if no document was found', async () => {
      const cat = await catCollection.findOne({_id: 'foo'});
      expect(cat).to.equal(undefined);
    });

    it('should find a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      const foundCat = await catCollection.findOne({_id: '42'});
      expect(foundCat).to.be.instanceOf(CatModel);
      expect(foundCat.toObject()).to.eql(catObj);
    });
  });
});

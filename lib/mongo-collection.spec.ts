import { Db, MongoClient } from 'mongodb';

import { CatModel, ICat } from './model.data';
import { MongoCollection } from './mongo-collection';
import { generateId } from './utils';

describe('MongoCollection', () => {
  class CatCollection extends MongoCollection<ICat, CatModel> {}
  const catObj = {_id: '42', name: 'Yllim'};

  let db: Db;
  let catCollection: CatCollection;

  beforeEach(async () => {
    db = await MongoClient.connect('mongodb://localhost:27017/paperhive-dev');
    catCollection = new CatCollection('cats', CatModel, {modelIdField: '_id'});
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

  describe('insertMany()', () => {
    it('should insert cats', async () => {
      const cats = [new CatModel(catObj), new CatModel({_id: '23', name: 'Kilf'})];
      await catCollection.insertMany(cats);
      const docs = await db.collection('cats').find({}).toArray();
      expect(docs).to.deep.include(catObj);
      expect(docs).to.deep.include({_id: '23', name: 'Kilf'});
    });

    it('should throw if id is duplicate', async () => {
      const cats = [new CatModel(catObj), new CatModel(catObj)];
      await expect(catCollection.insertMany(cats))
        .to.be.rejectedWith('duplicate key');
    });
  });

  describe('insertOne()', () => {
    it('should insert a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      const doc = await db.collection('cats').findOne({_id: '42'});
      expect(doc).to.eql(catObj);
    });

    it('should throw if id is duplicate', async () => {
      db.collection('cats').insert(catObj);
      await expect(catCollection.insertOne(new CatModel(catObj)))
        .to.be.rejectedWith('duplicate key');
    });
  });

  describe('delete()', () => {
    it('should throw if the cat does not exist in the collection', async () => {
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

  describe('find()', () => {
    it('should return empty array if no cat was found', async () => {
      const cats = await catCollection.find({}).toArray();
      expect(cats).to.be.an('array').and.have.lengthOf(0);
    });

    it('should find a cat', async () => {
      await db.collection('cats').insertMany([catObj, {_id: '23', name: 'Kilf'}]);
      const cats = await catCollection.find({_id: '23'}).toArray();
      expect(cats).to.be.an('array').and.have.lengthOf(1);
      expect(cats[0]).to.be.instanceOf(CatModel);
      expect(cats[0].toObject()).to.eql({_id: '23', name: 'Kilf'});
    });
  });

  describe('findById()', () => {
    it('should return undefined if no cat was found', async () => {
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
    it('should return undefined if no cat was found', async () => {
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

  describe('update()', () => {
    it('should throw if the cat does not exist in the collection', async () => {
      const cat = new CatModel(catObj);
      await expect(catCollection.update(cat)).to.be.rejectedWith('document not found');
    });

    it('should update a cat', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      cat.name = 'Kilf';
      const updatedCat = await catCollection.update(cat);
      const doc = await db.collection('cats').findOne({_id: '42'});
      expect(doc).to.eql({_id: '42', name: 'Kilf'});
    });
  });
});

import { cloneDeep } from 'lodash';
import { Db, MongoClient } from 'mongodb';

import { CatModel } from 'octonom/build/test/data/models/cat';

import { MongoCollection } from './mongo-collection';

describe('MongoCollection', () => {
  class CatCollection extends MongoCollection<CatModel> {}
  const catObj = {id: '42', name: 'Yllim'};

  let client: MongoClient;
  let db: Db;
  let catCollection: CatCollection;

  beforeEach(async () => {
    client = await MongoClient.connect('mongodb://localhost:27017/');
    db = client.db('test');
    catCollection = new CatCollection('cats', CatModel, {modelIdField: 'id'});
    await catCollection.init(db);
  });

  afterEach(async () => {
    // nuke database
    await db.dropDatabase();
    await client.close();
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
      const cats = [new CatModel(catObj), new CatModel({id: '23', name: 'Kilf'})];
      await catCollection.insertMany(cats);
      const docs = await db.collection('cats').find({}).toArray();
      expect(docs).to.deep.include({_id: '42', name: 'Yllim'});
      expect(docs).to.deep.include({_id: '23', name: 'Kilf'});
    });

    it('should throw if cat is invalid', async () => {
      const cats = [new CatModel(catObj), new CatModel({id: '23', age: -1})];
      await expect(catCollection.insertMany(cats))
        .to.be.rejectedWith('Number must not be less than 0.');
    });

    it('should insert invalid cat validate is false', async () => {
      const cats = [new CatModel(catObj), new CatModel({age: -1})];
      await catCollection.insertMany(cats, {validate: false});
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
      expect(doc).to.eql({_id: '42', name: 'Yllim'});
    });

    it('should throw if cat is invalid', async () => {
      const cat = new CatModel({id: '23', age: -1});
      await expect(catCollection.insertOne(cat))
        .to.be.rejectedWith('Number must not be less than 0.');
    });

    it('should insert invalid cat validate is false', async () => {
      const cat = new CatModel({age: -1});
      await catCollection.insertOne(cat, {validate: false});
    });

    it('should throw if id is duplicate', async () => {
      await catCollection.insertOne(new CatModel(catObj));
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
      const doc = await db.collection('cats').findOne({id: '42'});
      expect(doc).to.equal(null);
    });
  });

  describe('find()', () => {
    it('should return empty array if no cat was found', async () => {
      const cats = await catCollection.find({}).toArray();
      expect(cats).to.be.an('array').and.have.lengthOf(0);
    });

    it('should find a cat', async () => {
      await db.collection('cats').insertMany([cloneDeep(catObj), {id: '23', name: 'Kilf'}]);
      const cats = await catCollection.find({id: '23'}).toArray();
      expect(cats).to.be.an('array').and.have.lengthOf(1);
      expect(cats[0]).to.be.instanceOf(CatModel);
      expect(cats[0].toObject()).to.eql({id: '23', name: 'Kilf'});
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

  describe('findByIds()', () => {
    it('should return an array with instances (or undefined)', async () => {
      await catCollection.insertMany([
        new CatModel({id: '42', name: 'Yllim'}),
        new CatModel({id: '1337', name: 'Kilf'}),
      ]);
      const cats = await catCollection.findByIds(['1337', '23', '42']);
      expect(cats).to.be.an('array').and.have.lengthOf(3);
      expect(cats[0].toObject()).to.eql({id: '1337', name: 'Kilf'});
      expect(cats[1]).to.equal(undefined);
      expect(cats[2].toObject()).to.eql({id: '42', name: 'Yllim'});
    });
  });

  describe('findOne()', () => {
    it('should return undefined if no cat was found', async () => {
      const cat = await catCollection.findOne({id: 'foo'});
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
      await catCollection.update(cat);
      const doc = await db.collection('cats').findOne({_id: '42'});
      expect(doc).to.eql({_id: '42', name: 'Kilf'});
    });

    it('should throw if cat is invalid', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      cat.age = -1;
      await expect(catCollection.update(cat))
        .to.be.rejectedWith('Number must not be less than 0.');
    });

    it('should update invalid cat validate is false', async () => {
      const cat = new CatModel(catObj);
      await catCollection.insertOne(cat);
      cat.age = -1;
      await catCollection.update(cat, {validate: false});
    });
  });
});

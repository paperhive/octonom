import { CatModel } from '../test/data/models/cat';

import { ArrayCollection } from './array-collection';
import { ValidationError } from './errors';
import { ModelArray } from './model-array';

describe('Collection (ArrayCollection)', () => {
  class CatCollection extends ArrayCollection<CatModel> {
    constructor() {
      super(CatModel, {modelIdField: 'id'});
    }
  }

  let catCollection: CatCollection;

  beforeEach(() => catCollection = new CatCollection());

  describe('constructor', () => {
    it('should fail if modelIdField is not in schema', () => {
      expect(() => new ArrayCollection<CatModel>(CatModel, {modelIdField: 'non-existent' as any}))
        .to.throw('Id field non-existent not found in model schema.');
    });
  });

  describe('insert()', () => {
    it('should insert a valid cat', async () => {
      const cat = new CatModel({name: 'Yllim'});
      await catCollection.insert(cat);
      expect(catCollection.array).to.eql([cat.toObject()]);
    });

    it('should throw if cat is invalid', async () => {
      const cat = new CatModel({age: -1});
      await expect(catCollection.insert(cat))
        .to.be.rejectedWith(ValidationError, 'Number must not be less than 0.');
    });

    it('should insert an invalid cat if validate is false', async () => {
      const cat = new CatModel({age: -1});
      await catCollection.insert(cat, {validate: false});
    });

    it('should throw on duplicate keys', async () => {
      const cat = new CatModel({name: 'Yllim'});
      await catCollection.insert(cat);
      await expect(catCollection.insert(cat)).to.be.rejectedWith('duplicate');
    });
  });

  describe('findById()', () => {
    it('should return undefined if id is not found', async () => {
      const cat = await catCollection.findById('42');
      expect(cat).to.equal(undefined);
    });

    it('should find a cat', async () => {
      const cat = new CatModel({name: 'Yllim'});
      await catCollection.insert(cat);
      const foundCat = await catCollection.findById(cat.id);
      expect(foundCat).to.be.an.instanceOf(CatModel);
      expect(foundCat.toObject()).to.eql(cat.toObject());
    });
  });

  describe('findByIds()', async () => {
    it('should return a ModelArray with instances (or undefined)', async () => {
      await catCollection.insert(new CatModel({id: '42', name: 'Yllim'}));
      await catCollection.insert(new CatModel({id: '1337', name: 'Kilf'}));
      const cats = await catCollection.findByIds(['1337', '23', '42']);
      expect(cats).to.be.an.instanceOf(ModelArray).and.have.lengthOf(3);
      expect(cats[0].toObject()).to.eql({id: '1337', name: 'Kilf'});
      expect(cats[1]).to.equal(undefined);
      expect(cats[2].toObject()).to.eql({id: '42', name: 'Yllim'});
    });
  });
});

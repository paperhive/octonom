import { CatModel } from '../test/data/models/cat';

import { ArrayCollection } from './array-collection';
import { ModelArray } from './model-array';

describe('Collection (ArrayCollection)', () => {
  class CatCollection extends ArrayCollection<CatModel> {
    constructor() {
      super(CatModel, {modelIdField: 'id'});
    }
  }

  let catCollection: CatCollection;

  beforeEach(() => catCollection = new CatCollection());

  describe('insert()', () => {
    it('should insert a cat', () => {
      const cat = new CatModel({name: 'Yllim'});
      catCollection.insert(cat);
      expect(catCollection.array).to.eql([cat.toObject()]);
    });

    it('should throw on duplicate keys', () => {
      const cat = new CatModel({name: 'Yllim'});
      catCollection.insert(cat);
      expect(() => catCollection.insert(cat)).to.throw('duplicate');
    });
  });

  describe('findById()', () => {
    it('should return undefined if id is not found', async () => {
      const cat = await catCollection.findById('42');
      expect(cat).to.equal(undefined);
    });

    it('should find a cat', async () => {
      const cat = new CatModel({name: 'Yllim'});
      catCollection.insert(cat);
      const foundCat = await catCollection.findById(cat.id);
      expect(foundCat).to.be.an.instanceOf(CatModel);
      expect(foundCat.toObject()).to.eql(cat.toObject());
    });
  });

  describe('findByIds()', () => {
    it('should return a ModelArray with instances (or undefined)', async () => {
      catCollection.insert(new CatModel({id: '42', name: 'Yllim'}));
      catCollection.insert(new CatModel({id: '1337', name: 'Kilf'}));
      const cats = await catCollection.findByIds(['1337', '23', '42']);
      expect(cats).to.be.an.instanceOf(ModelArray).and.have.lengthOf(3);
      expect(cats[0].toObject()).to.eql({id: '1337', name: 'Kilf'});
      expect(cats[1]).to.equal(undefined);
      expect(cats[2].toObject()).to.eql({id: '42', name: 'Yllim'});
    });
  });
});

import { find } from 'lodash';

import { Collection } from './collection';
import { Model } from './model';
import { CatModel, ICat } from './model.data';

describe('Collection (ArrayCollection)', () => {
  // simple collection with an in-memory array
  // note: we can't test Collection directly since it's abstract
  class ArrayCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
    // note: only p
    public array: object[] = [];

    public insert(model: TModel) {
      const doc = find(this.array, {[this.modelIdField]: model[this.modelIdField]});
      if (doc) {
        throw new Error('duplicate key error');
      }
      this.array.push(this.toDb(model));
    }

    public async findById(id: string) {
      const doc = find(this.array, {[this.modelIdField]: id});

      if (!doc) {
        return undefined;
      }

      return this.fromDb(doc);
    }
  }

  class CatCollection extends ArrayCollection<ICat, CatModel> {
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
});

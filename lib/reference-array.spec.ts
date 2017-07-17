import { ArrayCollection } from './collection.data';
import { CatModel, ICat } from './model.data';
import { ReferenceArray } from './reference-array';

describe('ReferenceArray', () => {
  let array: ReferenceArray<ICat, CatModel>;
  const catObj = {id: '42', name: 'Yllim'};
  const cat = new CatModel(catObj);

  class CatCollection extends ArrayCollection<ICat, CatModel> {
    constructor() {
      super(CatModel, {modelIdField: 'id'});
    }
  }

  let catCollection: CatCollection;

  beforeEach(() => {
    catCollection = new CatCollection();
    catCollection.insert(cat);
    array = new ReferenceArray<ICat, CatModel>(catCollection);
  });

  describe('constructor', () => {
    it('should create an empty array', () => {
      expect(array).to.be.an('array').and.have.length(0);
    });

    it('should create an initialized array with models and strings ids', () => {
      const initializedArray = new ReferenceArray<ICat, CatModel>(catCollection, [cat, '42']);
      expect(initializedArray).to.have.length(2);
      expect(initializedArray[0]).to.be.an.instanceOf(CatModel);
      expect((initializedArray[0] as CatModel).toObject()).to.eql(catObj);
      expect(initializedArray[1]).to.eql('42');
    });
  });

  describe('fill()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.fill(cat, 0, 3);
      expect(array).to.have.length(3);
      array.forEach(el => expect(el).to.equal(cat));
    });

    it('should set a string', () => {
      array.length = 3;
      array.fill('42', 0, 3);
      expect(array).to.have.length(3);
      array.forEach(el => expect(el).to.eql('42'));
    });
  });

  describe('index setter', () => {
    it('should set a model instance', () => {
      array[0] = cat;
      expect(array).to.have.length(1);
      expect(array[0]).to.equal(cat);
    });

    it('should set a string', () => {
      array[0] = '42';
      expect(array).to.have.length(1);
      expect(array[0]).to.equal('42');
    });
  });

  describe('populate()', () => {
    it.skip('should populate the array', () => {
      // TODO
    });
  });

  describe('push()', () => {
    it('should push a model instances', () => {
      array.push(cat);
      expect(array).to.have.length(1);
      expect(array[0]).to.equal(cat);
    });

    it('should push a string', () => {
      array.push('42');
      expect(array).to.have.length(1);
      expect(array[0]).to.equal('42');
    });
  });

  describe('splice()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.splice(1, 2, cat);
      expect(array).to.have.length(2);
      expect(array[1]).to.equal(cat);
    });

    it('should set a string', () => {
      array.length = 3;
      array.splice(1, 2, '42');
      expect(array).to.have.length(2);
      expect(array[1]).to.equal('42');
    });
  });

  describe('unshift()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.unshift(cat);
      expect(array).to.have.length(4);
      expect(array[0]).to.equal(cat);
    });

    it('should set a string', () => {
      array.length = 3;
      array.unshift('42');
      expect(array).to.have.length(4);
      expect(array[0]).to.equal('42');
    });
  });
});

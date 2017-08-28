import { CatModel, ICat } from '../test/data/models/cat';

import { ModelArray } from './model-array';

describe('ModelArray', () => {
  let array: ModelArray<ICat, CatModel>;
  const catObj = {id: '42', name: 'Yllim'};
  const cat = new CatModel(catObj);

  beforeEach(() => array = new ModelArray<ICat, CatModel>(CatModel));

  describe('constructor', () => {
    it('should create an empty array', () => {
      expect(array).to.be.an('array').and.have.length(0);
    });

    it('should create an initialized array with raw objects', () => {
      const initializedArray = new ModelArray<ICat, CatModel>(CatModel, [catObj]);
      expect(initializedArray).to.have.length(1);
      expect(initializedArray[0]).to.be.an.instanceOf(CatModel);
      expect(initializedArray[0].toObject()).to.eql(catObj);
    });
  });

  describe('fill()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.fill(cat, 0, 3);
      expect(array).to.have.length(3);
      array.forEach(el => expect(el).to.equal(cat));
    });

    it('should create an instance if a raw object is provided', () => {
      array.length = 3;
      array.fill(catObj, 0, 3);
      expect(array).to.have.length(3);
      array.forEach(el => {
        expect(el).to.be.instanceOf(CatModel);
        expect(el.toObject()).to.eql(catObj);
      });
    });
  });

  describe('index setter', () => {
    it('should set a model instance', () => {
      array[0] = cat;
      expect(array).to.have.length(1);
      expect(array[0]).to.equal(cat);
    });

    it('should create an instance if a raw object is provided', () => {
      // note: this creates an instance as expected but we use 'any'
      //       so the typescript compiler doesn't complain
      array[0] = catObj as any;
      expect(array).to.have.length(1);
      expect(array[0]).to.be.instanceOf(CatModel);
      expect(array[0].toObject()).to.eql(catObj);
    });
  });

  describe('push()', () => {
    it('should push model instances', () => {
      array.push(cat);
      expect(array).to.have.length(1);
      expect(array[0]).to.equal(cat);
    });

    it('should create an instance if a raw object is provided', () => {
      array.push(catObj);
      expect(array).to.have.length(1);
      expect(array[0]).to.be.an.instanceOf(CatModel);
      expect(array[0].toObject()).to.eql(catObj);
    });

    it('should push undefined', () => {
      array.push(undefined);
      expect(array).to.have.length(1);
      expect(array[0]).to.equal(undefined);
    });
  });

  describe('splice()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.splice(1, 2, cat);
      expect(array).to.have.length(2);
      expect(array[1]).to.equal(cat);
    });

    it('should create an instance if a raw object is provided', () => {
      array.length = 3;
      array.splice(1, 2, catObj);
      expect(array).to.have.length(2);
      expect(array[1]).to.be.instanceOf(CatModel);
      expect(array[1].toObject()).to.eql(catObj);
    });
  });

  describe('unshift()', () => {
    it('should set a model instance', () => {
      array.length = 3;
      array.unshift(cat);
      expect(array).to.have.length(4);
      expect(array[0]).to.equal(cat);
    });

    it('should create an instance if a raw object is provided', () => {
      array.length = 3;
      array.unshift(catObj);
      expect(array).to.have.length(4);
      expect(array[0]).to.be.instanceOf(CatModel);
      expect(array[0].toObject()).to.eql(catObj);
    });
  });
});

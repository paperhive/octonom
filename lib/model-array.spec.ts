import { ModelArray } from './model-array';
import { CatModel } from './model.data';

describe('ModelArray', () => {
  let array: ModelArray<CatModel>;
  const catObj = {id: '42', name: 'Yllim'};
  const cat = new CatModel(catObj);

  beforeEach(() => array = new ModelArray<CatModel>(CatModel));

  describe('constructor', () => {
    it('should create an empty array', () => {
      expect(array).to.be.an('array').and.have.length(0);
    });

    it('should create an initialized array with raw objects', () => {
      const initializedArray = new ModelArray<CatModel>(CatModel, [catObj]);
      expect(initializedArray).to.have.length(1);
      expect(initializedArray[0]).to.be.an.instanceOf(CatModel);
      expect(initializedArray[0].toObject()).to.eql(catObj);
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
});

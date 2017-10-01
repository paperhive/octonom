import { stub } from 'sinon';

import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
// import { Model } from '../model';
import { ArraySchema, OctoArray } from './array';
// import { ModelSchema } from './model';
// import { ReferenceSchema } from './reference';
import { StringSchema } from './string';
import { OctoValue } from './value';

describe('ArraySchema', () => {
  /*
  class TestModel extends Model {
    public foo: string;
  }
  TestModel.setSchema('foo', new StringSchema());
  */

  describe('constructor()', () => {
    it('should throw a SanitizationError if value is not an array', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(() => schema.create(42)).to.throw(SanitizationError, 'Value is not an array.');
    });

    it('should throw a SanitizationError if elements cannot be sanitized', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(() => schema.create([42])).to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should return undefined', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(schema.create(undefined)).to.have.property('value').that.equal(undefined);
    });

    it('should return an array of strings', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(schema.create(['bar'])).to.have.property('value').that.eql(['bar']);
    });

    /* TODO
    it('should return an array of models with object input', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = schema.sanitize([{foo: 'bar'}], ['key'], {} as Model) as Array<Partial<TestModel>>;
      expect(array).to.be.an('array').and.to.eql([{foo: 'bar'}]);
      expect(array[0]).to.be.an.instanceOf(TestModel).and.to.eql({foo: 'bar'});
    });

    it('should return an array of models with model input', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = [new TestModel({foo: 'bar'})];
      expect(schema.sanitize(array, ['key'], {} as Model)).to.eql(array);
    });
    */

    it('should return empty array if required and undefined', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), required: true});
      expect(schema.create(undefined)).to.have.property('value').that.eql([]);
    });
  });

  describe('value array proxy', () => {
    const schema = new ArraySchema({elementSchema: new StringSchema()});
    let octoArray: OctoArray<any>;
    let beforeChangeStub;
    let beforeChangeArray;
    let afterChangeStub;
    let afterChangeArray;

    beforeEach(() => {
      octoArray = schema.create(['foo', 'bar', 'bla']);
      beforeChangeStub = stub(octoArray, 'beforeChange')
        .callsFake((path, value, oldOctoValue) => beforeChangeArray = oldOctoValue.toObject());
      afterChangeStub = stub(octoArray, 'afterChange')
        .callsFake((path, value, newOctoValue) => afterChangeArray = newOctoValue.toObject());
    });

    function testArrayProxy(arrayBefore, arrayAfter) {
      expect(beforeChangeStub).to.be.calledOnce.and.calledWith([], arrayAfter, octoArray);
      expect(beforeChangeArray).to.eql(arrayBefore);
      expect(octoArray.value).to.eql(arrayAfter);
      expect(octoArray.octoValues.map(el => el.value)).to.eql(arrayAfter);
      octoArray.octoValues.forEach((el, index) => {
        expect(el.parent).to.eql({instance: octoArray, path: index});
      });
      expect(afterChangeStub).to.be.calledOnce.and.calledWith([], arrayAfter, octoArray);
      expect(afterChangeArray).to.eql(arrayAfter);
    }

    it('should be an array', () => {
      expect(octoArray.value).to.be.an('array').and.an.instanceOf(Array);
    });

    it('should intercept pop()', () => {
      const octoValue = octoArray.octoValues[octoArray.octoValues.length - 1];
      expect(octoArray.value.pop()).to.equal('bla');
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'bar']);
      expect(octoValue).to.not.have.property('parent');
    });

    it('should intercept push()', () => {
      expect(octoArray.value.push('baz', 'boo')).to.equal(5);
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'bar', 'bla', 'baz', 'boo']);
    });

    it('should intercept reverse()', () => {
      const array = octoArray.value;
      expect(octoArray.value.reverse()).to.equal(array);
      testArrayProxy(['foo', 'bar', 'bla'], ['bla', 'bar', 'foo']);
    });

    it('should intercept sort()', () => {
      const array = octoArray.value;
      expect(octoArray.value.sort()).to.equal(array);
      testArrayProxy(['foo', 'bar', 'bla'], ['bar', 'bla', 'foo']);
    });

    it('should intercept sort() with custom compare function', () => {
      const array = octoArray.value;
      expect(octoArray.value.sort((a, b) => a < b ? 1 : -1)).to.equal(array);
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'bla', 'bar']);
    });

    it('should intercept splice(start)', () => {
      const array = octoArray.value;
      expect(octoArray.value.splice(2)).to.eql(['bla']);
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'bar']);
    });

    it('should intercept splice(start, deleteCount)', () => {
      const array = octoArray.value;
      expect(octoArray.value.splice(1, 1)).to.eql(['bar']);
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'bla']);
    });

    it('should intercept splice(start, deleteCount, ...elements)', () => {
      const array = octoArray.value;
      expect(octoArray.value.splice(1, 1, 'boo', 'baz')).to.eql(['bar']);
      testArrayProxy(['foo', 'bar', 'bla'], ['foo', 'boo', 'baz', 'bla']);
    });

    it('should intercept unshift()', () => {
      const array = octoArray.value;
      expect(octoArray.value.unshift('boo', 'baz')).to.equal(5);
      testArrayProxy(['foo', 'bar', 'bla'], ['boo', 'baz', 'foo', 'bar', 'bla']);
    });
  });

  /* TODO
  describe('populate()', () => {
    class ReferenceModel extends Model {
      public id: string;
    }
    ReferenceModel.setSchema('id', new StringSchema());

    const collection = new ArrayCollection<ReferenceModel>(ReferenceModel, {modelIdField: 'id'});
    collection.insert(new ReferenceModel({id: '0xACAB'}));
    collection.insert(new ReferenceModel({id: '4711'}));

    it('should throw if elements are not populatable', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await expect(schema.populate(['0xACAB'], true))
        .to.be.rejectedWith(Error, 'Array elements are not populatable.');
    });

    it('should populate an array of strings', async () => {
      const schema = new ArraySchema({
        elementSchema: new ReferenceSchema({collection: () => collection}),
      });
      const instances = await schema.populate(['0xACAB', '4711'], true);
      expect(instances).to.eql([{id: '0xACAB'}, {id: '4711'}]);
    });

    it('should populate an array of models', async () => {
      class ElementModel extends Model {
        public reference: string | ReferenceModel;
      }
      ElementModel.setSchema('reference', new ReferenceSchema({collection: () => collection}));

      const schema = new ArraySchema({
        elementSchema: new ModelSchema({model: ElementModel}),
      });
      const array = [
        new ElementModel({reference: '0xACAB'}),
        new ElementModel({reference: '4711'}),
      ];
      const instances = await schema.populate(array, {reference: true});
      expect(instances).to.be.an('array').and.to.not.equal(array);
      expect(instances).to.eql([
        {reference: {id: '0xACAB'}},
        {reference: {id: '4711'}},
      ]);
    });
  });
  */

  describe('toObject()', () => {
    it('should return a new array', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      const array = ['foo'];
      const result = schema.create(array).toObject();
      expect(result).to.not.equal(array);
      expect(result).to.eql(array);
    });
  });

  describe('validate()', () => {
    // TODO: remove this test? undefined is not possible if required: true
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), required: true});
      const array = schema.create(undefined);
      delete array.value;
      delete array.octoValues;
      await expect(array.validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value has less than min elements', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), minLength: 2});
      await expect(schema.create(['foo']).validate())
        .to.be.rejectedWith(ValidationError, 'Array must have at least 2 elements.');
    });

    it('should throw if value has more than max elements', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), maxLength: 2});
      await expect(schema.create(['foo', 'bar', 'baz']).validate())
        .to.be.rejectedWith(ValidationError, 'Array must have at most 2 elements.');
    });

    it('should run custom validator', async () => {
      const schema = new ArraySchema({
        elementSchema: new StringSchema(),
        validate: async (octoArray: OctoArray) => {
          if (octoArray.value.indexOf('baz') !== -1) {
            throw new ValidationError('baz is not allowed.');
          }
        },
      });
      await schema.create(['foo']).validate();
      await expect(schema.create(['foo', 'bar', 'baz']).validate())
        .to.be.rejectedWith(ValidationError, 'baz is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await schema.create(undefined).validate();
    });

    it('should validate an array of strings', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await schema.create(['foo']).validate();
    });

    /* TODO
    it('should validate an array of models', async () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = [new TestModel({foo: 'bar'})];
      await schema.validate(array, ['key'], {} as Model);
    });
    */
  });
});

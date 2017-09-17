import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ModelArray } from '../model-array';
import { ArraySchema } from './array';
import { ModelSchema } from './model';
import { ReferenceSchema } from './reference';
import { StringSchema } from './string';

describe('ArraySchema', () => {
  class TestModel extends Model {
    public foo: string;
  }
  TestModel.setSchema('foo', new StringSchema());

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

    it('should populate a ModelArray', async () => {
      class ElementModel extends Model {
        public reference: string | ReferenceModel;
      }
      ElementModel.setSchema('reference', new ReferenceSchema({collection: () => collection}));

      const schema = new ArraySchema({
        elementSchema: new ModelSchema({model: ElementModel}),
      });
      const modelArray = new ModelArray<ElementModel>(ElementModel, [
        {reference: '0xACAB'},
        {reference: '4711'},
      ]);
      const instances = await schema.populate(modelArray, {reference: true});
      expect(instances).to.be.an.instanceOf(ModelArray);
      expect(instances).to.not.equal(modelArray);
      expect(instances).to.eql([
        {reference: {id: '0xACAB'}},
        {reference: {id: '4711'}},
      ]);
    });
  });

  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not an array', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(() => schema.sanitize(42, ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not an array.');
    });

    it('should throw a SanitizationError if elements cannot be sanitized', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(() => schema.sanitize([42], ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should return undefined', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return an array', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      expect(schema.sanitize(['bar'], ['key'], {} as Model)).to.eql(['bar']);
    });

    it('should return a ModelArray for Model element schema and objects elements', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = schema.sanitize([{foo: 'bar'}], ['key'], {} as Model) as ModelArray<TestModel>;
      expect(array).to.be.an.instanceOf(ModelArray).and.to.eql([{foo: 'bar'}]);
      expect((array as ModelArray<TestModel>).model).to.equal(TestModel);
      expect(array[0]).to.be.an.instanceOf(TestModel).and.to.eql({foo: 'bar'});
    });

    it('should return a ModelArray for Model element schema and ModelArray value', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const modelArray = new ModelArray<TestModel>(TestModel, [{foo: 'bar'}]);
      expect(schema.sanitize(modelArray, ['key'], {} as Model) as ModelArray<TestModel>)
        .to.equal(modelArray);
    });

    it('should return empty array if required and undefined', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), required: true});
      expect(schema.sanitize(undefined, ['key'], {} as Model))
        .to.eql([]);
    });

    it('should return empty ModelArray if required and undefined', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel}), required: true});
      expect(schema.sanitize(undefined, ['key'], {} as Model))
        .to.be.an.instanceOf(ModelArray).and.to.eql([]);
    });
  });

  describe('toObject()', () => {
    it('should return a new array', () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      const array = ['foo'];
      const result = schema.toObject(array);
      expect(result).to.not.equal(array);
      expect(result).to.eql(array);
    });

    it('should return a new array from a ModelArray', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = new ModelArray<TestModel>(TestModel, [{foo: 'bar'}]);
      const result = schema.toObject(array);
      expect(result).to.not.equal(array);
      expect(result).to.eql([{foo: 'bar'}]);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not an array', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await expect(schema.validate(42 as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not an array.');
    });

    it('should throw if value is not a ModelArray (for Model element schema)', async () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      await expect(schema.validate(42 as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a ModelArray.');
      await expect(schema.validate([], ['key'], {} as Model))
      .to.be.rejectedWith(ValidationError, 'Value is not a ModelArray.');
    });

    it('should throw if value has less than min elements', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), minLength: 2});
      await expect(schema.validate(['foo'], ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Array must have at least 2 elements.');
    });

    it('should throw if value has more than max elements', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema(), maxLength: 2});
      await expect(schema.validate(['foo', 'bar', 'baz'], ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Array must have at most 2 elements.');
    });

    it('should run custom validator', async () => {
      const schema = new ArraySchema({
        elementSchema: new StringSchema(),
        validate: async (value: string[]) => {
          if (value.indexOf('baz') !== -1) {
            throw new ValidationError('baz is not allowed.');
          }
        },
      });
      await schema.validate(['foo'], ['key'], {} as Model);
      await expect(schema.validate(['foo', 'bar', 'baz'], ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'baz is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate an array', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await schema.validate(['foo'], ['key'], {} as Model);
    });

    it('should validate a ModelArray', async () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const modelArray = new ModelArray<TestModel>(TestModel, [{foo: 'bar'}]);
      await schema.validate(modelArray, ['key'], {} as Model);
    });
  });
});

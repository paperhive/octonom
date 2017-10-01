import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
// import { Model } from '../model';
import { OctoArray, OctoArrayFactory } from './array';
// import { ModelSchema } from './model';
// import { ReferenceSchema } from './reference';
import { OctoStringFactory } from './string';

describe('ArraySchema', () => {
  /*
  class TestModel extends Model {
    public foo: string;
  }
  TestModel.setSchema('foo', OctoStringFactory.create());
  */

  describe('constructor()', () => {
    it('should throw a SanitizationError if value is not an array', () => {
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create()});
      expect(() => schema(42)).to.throw(SanitizationError, 'Value is not an array.');
    });

    it('should throw a SanitizationError if elements cannot be sanitized', () => {
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create()});
      expect(() => schema([42])).to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should return undefined', () => {
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create()});
      expect(schema(undefined)).to.have.property('value').that.equal(undefined);
    });

    it('should return an array of strings', () => {
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create()});
      expect(schema(['bar'])).to.have.property('value').that.eql(['bar']);
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
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create(), required: true});
      expect(schema(undefined)).to.have.property('value').that.eql([]);
    });
  });

  /* TODO
  describe('populate()', () => {
    class ReferenceModel extends Model {
      public id: string;
    }
    ReferenceModel.setSchema('id', OctoStringFactory.create());

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
/*
  describe('toObject()', () => {
    it('should return a new array', () => {
      const schema = OctoArrayFactory.create({elementSchema: OctoStringFactory.create()});
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      const array = ['foo'];
      const result = schema.toObject(array);
      expect(result).to.not.equal(array);
      expect(result).to.eql(array);
    });

    it('should return a new array from a model array', () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = [new TestModel({foo: 'bar'})];
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

    it('should validate an array of strings', async () => {
      const schema = new ArraySchema({elementSchema: new StringSchema()});
      await schema.validate(['foo'], ['key'], {} as Model);
    });

    it('should validate an array of models', async () => {
      const schema = new ArraySchema({elementSchema: new ModelSchema({model: TestModel})});
      const array = [new TestModel({foo: 'bar'})];
      await schema.validate(array, ['key'], {} as Model);
    });
  });
  */
});

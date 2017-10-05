import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ModelSchema } from './model';
import { StringSchema } from './string';

describe('ModelSchema', () => {
  class TestModel extends Model {
    public foo: string;
  }
  TestModel.setSchema('foo', new StringSchema());

  describe('constructor()', () => {
    it('should be instantiatable with options', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(schema).to.have.property('options').that.eql({model: TestModel});
    });
  });

  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not an object and not a model instance', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(() => schema.create('foo'))
        .to.throw(SanitizationError, 'Value is not an object.');
    });

    it('should throw a SanitizationError if model sanitization fails', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(() => schema.create({foo: 42}))
        .to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should return undefined', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(schema.create(undefined)).to.eql(undefined);
    });

    it('should return an empty model instance if undefined and required and defaults are enabled', () => {
      const schema = new ModelSchema({required: true, model: TestModel});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.is.an.instanceOf(TestModel).and.to.eql({});
    });

    it('should return a model instance', () => {
      const schema = new ModelSchema({model: TestModel});
      const instance = new TestModel();
      expect(schema.create(instance))
        .to.have.property('value').that.eql(instance).and.not.equals(instance);
    });

    it('should return a model instance when an object was provided', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(schema.create({foo: 'bar'}))
        .to.have.property('value').that.is.instanceOf(TestModel).and.to.eql({foo: 'bar'});
    });
  });

  /*
  describe('populate()', () => {
    it('should throw if populateReference is not an object', async () => {
      const  schema = new ModelSchema({model: TestModel});
      await expect(schema.populate(new TestModel(), true))
        .to.be.rejectedWith(Error, 'populateReference must be an object.');
    });
  });
  */

  describe('toObject()', () => {
    it('should return an object', () => {
      const schema = new ModelSchema({model: TestModel});
      const instance = schema.create(new TestModel({foo: 'bar'}));
      const obj = schema.toObject(instance);
      expect(obj).to.not.equal(instance);
      expect(obj).to.eql({foo: 'bar'});
    });
  });

  describe('validate()', () => {
    it('should throw if nested validator fails', async () => {
      class FailModel extends Model {
        public foo: string;
      }
      FailModel.setSchema('foo', new StringSchema({
        validate: async instance => {
          if (instance.value === 'baz') {
            throw new ValidationError('baz is not allowed.');
          }
          if (instance.value === 'err') {
            throw new Error('Critical error.');
          }
        },
      }));
      const schema = new ModelSchema({model: FailModel});
      await schema.validate(schema.create(new FailModel({foo: 'bar'})));
      await expect(schema.validate(schema.create(new FailModel({foo: 'baz'}))))
        .to.be.rejectedWith(ValidationError, 'baz is not allowed.');
      await expect(schema.validate(schema.create(new FailModel({foo: 'err'}))))
        .to.be.rejectedWith(Error, 'Critical error.');
    });

    it('should run custom validator', async () => {
      const schema = new ModelSchema<TestModel>({
        model: TestModel,
        validate: async instance => {
          if (instance.value.foo === 'baz') {
            throw new ValidationError('baz is not allowed.');
          }
          if (instance.value.foo === 'err') {
            throw new Error('Critical error.');
          }
        },
      });
      await schema.validate(schema.create(new TestModel({foo: 'bar'})));
      await expect(schema.validate(schema.create(new TestModel({foo: 'baz'}))))
        .to.be.rejectedWith(ValidationError, 'baz is not allowed.');
      await expect(schema.validate(schema.create(new TestModel({foo: 'err'}))))
      .to.be.rejectedWith(Error, 'Critical error.');
    });

    it('should validate a model instance', async () => {
      const schema = new ModelSchema({model: TestModel});
      await schema.validate(schema.create(new TestModel({foo: 'bar'})));
    });
  });
});

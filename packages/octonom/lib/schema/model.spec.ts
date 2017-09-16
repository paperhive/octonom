import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { IModelOptions, ModelSchema } from './model';
import { StringSchema } from './string';

describe('ModelSchema', () => {
  class TestModel extends Model {
    public foo: string;
  }
  TestModel.setSchema('foo', new StringSchema());

  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not an object and not a model instance', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(() => schema.sanitize('foo', ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not an object or a model instance.');
    });

    it('should throw a SanitizationError if model sanitization fails', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(() => schema.sanitize({foo: 42}, ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should return undefined', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return an empty model instance if required and undefined', () => {
      const schema = new ModelSchema({required: true, model: TestModel});
      expect(schema.sanitize(undefined, ['key'], {} as Model))
        .to.be.an.instanceOf(TestModel).and.to.eql({});
    });

    it('should return a model instance', () => {
      const schema = new ModelSchema({model: TestModel});
      const instance = new TestModel();
      expect(schema.sanitize(instance, ['key'], {} as Model)).to.eql(instance);
    });

    it('should return a model instance when an object was provided', () => {
      const schema = new ModelSchema({model: TestModel});
      expect(schema.sanitize({foo: 'bar'}, ['key'], {} as Model))
        .to.be.an.instanceOf(TestModel).and.to.eql({foo: 'bar'});
    });
  });

  describe('toObject()', () => {
    it('should return an object', () => {
      const schema = new ModelSchema({model: TestModel});
      const instance = new TestModel({foo: 'bar'});
      const obj = schema.toObject(instance);
      expect(obj).to.not.equal(instance);
      expect(obj).to.eql({foo: 'bar'});
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ModelSchema({required: true, model: TestModel});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not a model instance', async () => {
      const schema = new ModelSchema({model: TestModel});
      await expect(schema.validate({foo: 'bar'} as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not an instance of TestModel.');
    });

    it('should run custom validator', async () => {
      const schema = new ModelSchema({
        model: TestModel,
        validate: async (value: TestModel) => {
          if (value.foo === 'baz') {
            throw new ValidationError('baz is not allowed.');
          }
        },
      });
      await schema.validate(new TestModel({foo: 'bar'}), ['key'], {} as Model);
      await expect(schema.validate(new TestModel({foo: 'baz'}), ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'baz is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new ModelSchema({model: TestModel});
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a model instance', async () => {
      const schema = new ModelSchema({model: TestModel});
      await schema.validate(new TestModel({foo: 'bar'}), ['key'], {} as Model);
    });
  });
});

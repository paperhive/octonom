import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { IReferenceOptions, ReferenceSchema } from './reference';
import { StringSchema } from './string';

describe('ReferenceSchema', () => {
  class TestModel extends Model {
    public id: string;
  }
  TestModel.setSchema('id', new StringSchema());

  const collection = () => new ArrayCollection<TestModel>(TestModel, {modelIdField: 'id'});

  describe('sanitize()', () => {
    const schema = new ReferenceSchema({collection});

    it('should throw a SanitizationError if value is not a string or model', () => {
      expect(() => schema.sanitize(42, ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not an instance or an id.');
    });

    it('should return undefined', () => {
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a string', () => {
      expect(schema.sanitize('id', ['key'], {} as Model)).to.eql('id');
    });

    it('should return a model instance ', () => {
      const instance  = new TestModel();
      expect(schema.sanitize(instance, ['key'], {} as Model)).to.eql(instance);
    });
  });

  describe('toObject()', () => {
    const schema = new ReferenceSchema({collection});

    it('should return an id', () => {
      expect(schema.toObject('id')).to.equal('id');
    });

    it('should return an object for a populated reference', () => {
      expect(schema.toObject(new TestModel({id: '0xACAB'})))
        .to.eql({id: '0xACAB'});
    });

    it('should return an id for a populated reference with unpopulate', () => {
      expect(schema.toObject(new TestModel({id: '0xACAB'}), {unpopulate: true}))
        .to.eql('0xACAB');
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ReferenceSchema({collection, required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw a SanitizationError if value is not a string or model', async () => {
      const schema = new ReferenceSchema({collection});
      await expect(schema.validate(42 as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not an instance or an id');
    });

    it('should run custom validator', async () => {
      const model = new TestModel();
      const schema = new ReferenceSchema({
        collection,
        validate: async value => {
          if (value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.validate('bar', ['key'], {} as Model);
      await schema.validate(new TestModel(), ['key'], {} as Model);
      await expect(schema.validate('foo', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new ReferenceSchema({collection});
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a string', async () => {
      const schema = new ReferenceSchema({collection});
      await schema.validate('foo', ['key'], {} as Model);
    });
  });
});

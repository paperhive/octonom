import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { IReferenceOptions, ReferenceSchema } from './reference';

describe('ReferenceSchema', () => {
  const collection = () => new ArrayCollection<Model>(Model);

  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a string or model', () => {
      const schema = new ReferenceSchema({collection});
      expect(() => schema.sanitize(42, ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not an instance or an id.');
    });

    it('should return undefined', () => {
      const schema = new ReferenceSchema({collection});
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a string', () => {
      const schema = new ReferenceSchema({collection});
      expect(schema.sanitize('id', ['key'], {} as Model)).to.eql('id');
    });

    it('should return a Model', () => {
      const schema = new ReferenceSchema({collection});
      const model = new Model();
      expect(schema.sanitize(model, ['key'], {} as Model)).to.eql(model);
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
      const model = new Model();
      const schema = new ReferenceSchema({
        collection,
        validate: async value => {
          if (value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.validate('bar', ['key'], {} as Model);
      await schema.validate(new Model(), ['key'], {} as Model);
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

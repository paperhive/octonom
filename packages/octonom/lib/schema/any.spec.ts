import { ValidationError } from '../errors';
import { Model } from '../model';
import { AnySchema } from './any';

describe('AnySchema', () => {
  describe('sanitize()', () => {
    it('should return a default value', () => {
      const schema = new AnySchema({default: {foo: 'bar'}});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql({foo: 'bar'});
    });

    it('should return a default value from a function', () => {
      const schema = new AnySchema({default: () => 'foo'});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql('foo');
    });
  });

  describe('toObject()', () => {
    it('should return any value cloned', () => {
      const schema = new AnySchema();
      const obj = {foo: 'bar'};
      const result = schema.toObject(obj);
      expect(result).to.not.equal(obj);
      expect(result).to.eql(obj);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new AnySchema({required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should run custom validator', async () => {
      const schema = new AnySchema({
        validate: async value => {
          if (value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema.validate(false, ['key'], {} as Model);
      await expect(schema.validate(true, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'true is not allowed.');
    });

    it('should validate anything', async () => {
      const schema = new AnySchema();
      await schema.validate(undefined, ['key'], {} as Model);
      await schema.validate(true, ['key'], {} as Model);
      await schema.validate(['foo'], ['key'], {} as Model);
      await schema.validate({foo: 'bar'}, ['key'], {} as Model);
    });
  });
});

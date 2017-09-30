import { ValidationError } from '../errors';
import { OctoAny, OctoAnyFactory } from './any';

describe('AnySchema', () => {
  describe('sanitize()', () => {
    it('should return a default value', () => {
      expect(OctoAny.sanitize(undefined, {default: {foo: 'bar'}}, {defaults: true}))
        .to.eql({foo: 'bar'});
    });

    it('should return a default value from a function', () => {
      expect(OctoAny.sanitize(undefined, {default: () => 'foo'}, {defaults: true}))
        .to.eql('foo');
    });

    it('should return any value', () => {
      const obj = {foo: 'bar'};
      expect(OctoAny.sanitize(obj)).to.equal(obj);
    });
  });

  describe('toObject()', () => {
    it('should return any value cloned', () => {
      const schema = OctoAnyFactory.create();
      const obj = {foo: 'bar'};
      const octoValue = schema(obj);
      const result = octoValue.toObject();
      expect(result).to.not.equal(obj);
      expect(result).to.eql(obj);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = OctoAnyFactory.create({required: true});
      await expect(schema(undefined).validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should run custom validator', async () => {
      const schema = OctoAnyFactory.create({
        validate: async octoValue => {
          if (octoValue.value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema(false).validate();
      await expect(schema(true).validate())
        .to.be.rejectedWith(ValidationError, 'true is not allowed.');
    });

    it('should validate anything', async () => {
      const schema = OctoAnyFactory.create();
      await schema(undefined).validate();
      await schema(true).validate();
      await schema(['foo']).validate();
      await schema({foo: 'bar'}).validate();
    });
  });
});

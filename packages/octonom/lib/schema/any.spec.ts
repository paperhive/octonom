import { ValidationError } from '../errors';
import { OctoAny, OctoAnyFactory } from './any';

describe('AnySchema', () => {
  describe('constructor()', () => {
    it('should return a default value', () => {
      expect(new OctoAny(undefined, {default: {foo: 'bar'}}, {defaults: true}))
        .to.have.property('value').that.eql({foo: 'bar'});
    });

    it('should return a default value from a function', () => {
      expect(new OctoAny(undefined, {default: () => 'foo'}, {defaults: true}))
        .to.contain({value: 'foo'});
    });

    it('should return any value', () => {
      const obj = {foo: 'bar'};
      expect(new OctoAny(obj)).to.have.property('value').that.equal(obj);
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

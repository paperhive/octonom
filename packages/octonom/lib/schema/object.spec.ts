import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ObjectSchema, setObjectSanitized, validateObject } from './object';
import { StringSchema } from './string';

describe('setObjectSanitized', () => {
  const schemaMap = {
    foo: new StringSchema({required: true, default: 'default'}),
    bar: new StringSchema(),
  };

  it('should throw if data is not an object', () => {
    expect(() => setObjectSanitized(schemaMap, {}, 42 as any, [], {} as Model))
      .to.throw(SanitizationError, 'Data is not an object.');
  });

  it('should throw if key not in schema', () => {
    expect(() => setObjectSanitized(schemaMap, {}, {baz: 'foo'}, [], {} as Model))
      .to.throw(SanitizationError, 'Key baz not found in schema.');
  });

  it('should throw if a nested schema sanitization throws', () => {
    expect(() => setObjectSanitized(schemaMap, {}, {bar: 42}, [], {} as Model))
      .to.throw(SanitizationError, 'Value is not a string.');
  });

  it('should do nothing with an empty data object', () => {
    const target = {};
    const result = setObjectSanitized(schemaMap, target, {}, [], {} as Model);
    expect(result).to.equal(target).and.to.eql({});
  });

  it('should set a valid property', () => {
    const target = {};
    const result = setObjectSanitized(schemaMap, target, {foo: 'bar'}, [], {} as Model);
    expect(result).to.equal(target).and.to.eql({foo: 'bar'});
  });

  it('should set a default value', () => {
    const target = {};
    const result = setObjectSanitized(schemaMap, target, {bar: 'bar'}, [], {} as Model, {defaults: true});
    expect(result).to.equal(target).and.to.eql({foo: 'default', bar: 'bar'});
  });

  it('should replace an object', () => {
    const target = {foo: 'bar'};
    const result = setObjectSanitized(schemaMap, target, {bar: 'bar'}, [], {} as Model, {replace: true});
    expect(result).to.equal(target).and.to.eql({bar: 'bar'});
  });
});

describe('validateObject()', () => {
  const schemaMap = {foo: new StringSchema({required: true, default: 'default'})};

  it('should throw if data is not an object', async () => {
    await expect(validateObject(schemaMap, 42 as any, [], {} as Model))
      .to.be.rejectedWith(ValidationError, 'Data is not an object.');
  });

  it('should throw if key is not in schema', async () => {
    await expect(validateObject(schemaMap, {bar: 'foo'}, [], {} as Model))
      .to.be.rejectedWith(ValidationError, 'Key bar not found in schema.');
  });

  it('should throw if nested validation fails', async () => {
    await expect(validateObject(schemaMap, {foo: 42}, [], {} as Model))
      .to.be.rejectedWith(ValidationError, 'Value is not a string.');
  });

  it('should pass for a valid object', async () => {
    await validateObject(schemaMap, {foo: 'bar'}, [], {} as Model);
  });
});

describe('ObjectSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not an object', () => {
      const schema = new ObjectSchema({schema: {}});
      expect(() => schema.sanitize(42 as any, [], {} as Model))
        .to.throw(SanitizationError, 'Data is not an object.');
    });

    it('should return undefined', () => {
      const schema = new ObjectSchema({schema: {}});
      expect(schema.sanitize(undefined, [], {} as Model)).to.eql(undefined);
    });

    it('should return an empty object if required', () => {
      const schema = new ObjectSchema({required: true, schema: {}});
      expect(schema.sanitize(undefined, [], {} as Model)).to.eql({});
    });

    it('should return an object', () => {
      const schema = new ObjectSchema({required: true, schema: {foo: new StringSchema()}});
      expect(schema.sanitize({foo: 'bar'}, [], {} as Model)).to.eql({foo: 'bar'});
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ObjectSchema({required: true, schema: {}});
      await expect(schema.validate(undefined, [], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw a ValidationError if nested validation fails', async () => {
      const schema = new ObjectSchema({schema: {foo: new StringSchema()}});
      await expect(schema.validate({foo: 42}, [], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a string.');
    });

    it('should run custom validator', async () => {
      const schema = new ObjectSchema({
        schema: {foo: new StringSchema()},
        validate: async value => {
          if ((value as any).foo === 'bar') {
            throw new ValidationError('foobar is not allowed.');
          }
        },
      });
      await schema.validate({foo: 'foo'}, ['key'], {} as Model);
      await expect(schema.validate({foo: 'bar'}, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'foobar is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new ObjectSchema({schema: {}});
      await schema.validate(undefined, [], {} as Model);
    });

    it('should validate an object', async () => {
      const schema = new ObjectSchema({schema: {foo: new StringSchema()}});
      await schema.validate({foo: 'bar'}, ['key'], {} as Model);
    });
  });
});
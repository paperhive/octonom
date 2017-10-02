import { spy } from 'sinon';

import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ObjectSchema, populateObject, setObject, toObject, validateObject } from './object';
import { ReferenceSchema } from './reference';
import { OctoString, StringSchema } from './string';
import { IOctoParentInstance, IOctoValueMap } from './value';

/*
class TestModel extends Model {
  public id: string;
}
TestModel.setSchema('id', new StringSchema());

const collection = new ArrayCollection<TestModel>(TestModel, {modelIdField: 'id'});
const instance = new  TestModel({id: '0xACAB'});
collection.insert(instance);

describe('populateObject()', () => {
  const schemaMap = {
    foo: new ReferenceSchema({collection: () => collection}),
    bar: new StringSchema(),
  };

  it('should throw if populateReference is not an object', async () => {
    await expect(populateObject(schemaMap, {foo: '0xACAB', bar: 'baz'}, true))
      .to.be.rejectedWith(Error, 'populateReference must be an object.');
  });

  it('should throw if a key is not populatable', async () => {
    await expect(populateObject(schemaMap, {foo: '0xACAB', bar: 'baz'}, {bar: true}))
      .to.be.rejectedWith(Error, 'Key bar is not populatable.');
  });

  it('should ignore a key if it\'s undefined', async () => {
    const obj = {bar: 'test'};
    const result = await populateObject(schemaMap, obj, {foo: true});
    expect(result).to.not.equal(obj);
    expect(result).to.eql({bar: 'test'});
  });

  it('should populate a key', async () => {
    const obj = {foo: '0xACAB', bar: 'test'};
    const result = await populateObject(schemaMap, obj, {foo: true});
    expect(result).to.not.equal(obj);
    expect(result).to.eql({foo: {id: '0xACAB'}, bar: 'test'});
  });
});
*/

describe('proxifyObject()', () => {
  it('should call beforeSet and afterSet when assigning a key');
  it('should call beforeSet and afterSet when deleting a key');
  it('should call beforeSet and afterSet when assigning a nested key');
  it('should call beforeSet and afterSet when deleting a nested key');
});

describe('setObject', () => {
  const schemaMap = {
    foo: new StringSchema({required: true, default: 'default'}),
    bar: new StringSchema(),
  };

  let parentInstance: IOctoParentInstance;

  beforeEach(() => {
    parentInstance = {
      value: {},
      beforeChange: spy(),
      afterChange: spy(),
    };
  });

  it('should throw if key not in schema', () => {
    expect(() => setObject({baz: 'foo'}, {}, {}, parentInstance, schemaMap, {}))
      .to.throw(SanitizationError, 'Key baz not found in schema.');
  });

  it('should throw if a nested schema sanitization throws', () => {
    expect(() => setObject({bar: 42}, {}, {}, parentInstance, schemaMap, {}))
      .to.throw(SanitizationError, 'Value is not a string.');
  });

  it('should do nothing with an empty data object', () => {
    const obj = {};
    const octoValueMap: IOctoValueMap = {};
    setObject({}, obj, octoValueMap, parentInstance, schemaMap, {});
    expect(obj).to.eql({});
    expect(octoValueMap).to.eql({});
  });

  it('should set a valid property', () => {
    const obj = {};
    const octoValueMap: IOctoValueMap = {};
    setObject({foo: 'bar'}, obj, octoValueMap, parentInstance, schemaMap, {});
    expect(obj).to.eql({foo: 'bar'});
    expect(octoValueMap.foo).to.be.an.instanceOf(OctoString).and
      .to.have.property('value', 'bar');
  });

  it('should not modify an existing property', () => {
    const obj = {bar: 'baz'};
    const octoString = new OctoString('baz');
    const octoValueMap: IOctoValueMap = {bar: octoString};
    setObject({foo: 'bar'}, obj, octoValueMap, parentInstance, schemaMap, {});
    expect(obj).to.eql({foo: 'bar', bar: 'baz'});
    expect(octoValueMap.bar).to.equal(octoString);
    expect(octoValueMap.foo).to.be.an.instanceOf(OctoString).and
      .to.have.property('value', 'bar');
  });

  it('should set a default value', () => {
    const obj = {};
    const octoValueMap: IOctoValueMap = {};
    setObject({bar: 'bar'}, obj, octoValueMap, parentInstance, schemaMap, {defaults: true});
    expect(obj).to.eql({foo: 'default', bar: 'bar'});
    expect(octoValueMap.foo).to.be.an.instanceOf(OctoString).and
      .to.have.property('value', 'default');
    expect(octoValueMap.bar).to.be.an.instanceOf(OctoString).and
      .to.have.property('value', 'bar');
  });

  it('should replace an object', () => {
    const obj = {bar: 'baz'};
    const octoValueMap: IOctoValueMap = {bar: new OctoString('baz')};
    setObject({bar: 'bar'}, obj, octoValueMap, parentInstance, schemaMap, {replace: true});
    expect(obj).to.eql({bar: 'bar'});
    expect(octoValueMap.bar).to.be.an.instanceOf(OctoString).and
      .to.have.property('value', 'bar');
    expect(octoValueMap).to.not.have.property('foo');
  });
});

describe('toObject()', () => {
  it('should return an object', () => {
    const octoValueMap: IOctoValueMap = {foo: new OctoString('bar')};
    expect(toObject(octoValueMap)).to.eql({foo: 'bar'});
  });
});

describe('validateObject()', () => {
  const schemaMap = {foo: new StringSchema({required: true, default: 'default'})};

  it('should throw if nested validation fails', async () => {
    const octoValueMap: IOctoValueMap = {foo: new OctoString(undefined, {required: true})};
    await expect(validateObject(octoValueMap))
      .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
  });

  it('should pass for a valid object', async () => {
    const octoValueMap: IOctoValueMap = {foo: new OctoString('bar', {required: true})};
    await validateObject(octoValueMap);
  });
});

/*
describe('ObjectSchema', () => {
  describe('populate()', () => {
    // note: details are tested in populateObject() above
    it('should populate a key', async () => {
      const  schema = new ObjectSchema({schema: {foo: new ReferenceSchema({collection: () => collection})}});
      const obj = {foo: '0xACAB', bar: 'test'};
      const result = await schema.populate(obj, {foo: true});
      expect(result).to.not.equal(obj);
      expect(result).to.eql({foo: {id: '0xACAB'}, bar: 'test'});
    });
  });

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

  describe('toObject()', () => {
    // note: details are tested in toObject() above
    it('should return an object', () => {
      const schema = new ObjectSchema({schema: {foo: new StringSchema()}});
      const result = schema.toObject({foo: 'bar', bar: 'baz'});
      expect(result).to.eql({foo: 'bar'});
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new ObjectSchema({required: true, schema: {}});
      await expect(schema.validate(undefined, [], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw a ValidationError if value is not an object', async () => {
      const schema = new ObjectSchema({schema: {}});
      await expect(schema.validate('foo' as any, [], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not an object.');
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
*/

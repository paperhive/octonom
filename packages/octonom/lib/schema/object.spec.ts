import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { setObjectSanitized } from './object';
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

describe('ObjectSchema', () => {
  describe('sanitize()', () => {
  });

  describe('validate()', () => {

  });
});

import { ArrayCollection } from './array-collection';
import { Model } from './model';
import { sanitize, setObjectSanitized } from './sanitize';
import { SchemaMap, SchemaValue } from './schema';

describe('sanitize()', () => {
  describe('type invalid', () => {
    it('should throw', () => {
      expect(() => sanitize({type: 'invalid'} as any, 'foo'))
        .to.throw('type invalid is unknown');
    });
  });

  describe('type any', () => {
    const schemaAny: SchemaValue = {type: 'any', default: () => ({foo: 42})};

    it('should return the input', () => {
      const value = {foo: 'bar'};
      expect(sanitize(schemaAny, value)).to.equal(value);
    });

    it('should return default value if undefined', () => {
      expect(sanitize(schemaAny, undefined, {defaults: true})).to.eql({foo: 42});
    });
  });

  describe('type array', () => {
    const schemaStringArray: SchemaValue = {type: 'array', definition: {type: 'string'}};

    it('should throw if data is not an array', () => {
      expect(() => sanitize(schemaStringArray, 42)).to.throw('not an array');
    });

    it('should throw if data is array but an element has wrong type', () => {
      expect(() => sanitize(schemaStringArray, ['foo', 42]))
        .to.throw('not a string');
    });

    it('should sanitize an empty array', () => {
      expect(sanitize(schemaStringArray, [])).to.eql([]);
    });

    it('should sanitize an array of strings', () => {
      expect(sanitize(schemaStringArray, ['foo'])).to.eql(['foo']);
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaStringArray, undefined)).to.equal(undefined);
    });

    it('should return an empty array if data is undefined but a value is required', () => {
      const schema: SchemaValue = {type: 'array', required: true, definition: {type: 'string'}};
      expect(sanitize(schema, undefined)).to.eql([]);
    });
  });

  describe('type model', () => {
    class Cat extends Model<Cat> {
      @Cat.PropertySchema({type: 'string'})
      public name: string;
    }
    const schemaModel: SchemaValue = {type: 'model', model: Cat};

    it('should throw if data is not an object', () => {
      expect(() => sanitize(schemaModel, 42))
        .to.throw('data is not an object');
    });

    it('should throw if the model data cannot be sanitized', () => {
      expect(() => sanitize(schemaModel, {age: 42}))
        .to.throw('key age not found in schema');
    });

    it('should create a model instance', () => {
      expect(sanitize(schemaModel, {name: 'Yllim'}))
        .to.be.instanceof(Cat).and.to.eql({name: 'Yllim'});
    });

    it('should return input if input is already an instance', () => {
      const cat = new Cat({name: 'Yllim'});
      expect(sanitize(schemaModel, cat)).to.equal(cat);
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaModel, undefined)).to.equal(undefined);
    });

    it('should return an empty object if data is undefined but a value is required', () => {
      const schema: SchemaValue = {type: 'model', required: true, model: Cat};
      expect(sanitize(schema, undefined)).to.be.an.instanceOf(Cat).and.eql({});
    });
  });

  describe('type object', () => {
    const schemaObject: SchemaValue = {type: 'object', definition: {name: {type: 'string'}}};

    it('should throw if data is not an object', () => {
      expect(() => sanitize(schemaObject, 42))
        .to.throw('data is not an object');
    });

    it('should throw if data contains an invalid key', () => {
      expect(() => sanitize(schemaObject, {age: 42}))
        .to.throw('key age not found in schema');
    });

    it('should throw if data contains an invalid value', () => {
      expect(() => sanitize(schemaObject, {name: 42}))
        .to.throw('not a string');
    });

    it('should create an object with valid data', () => {
      expect(sanitize(schemaObject, {name: 'Yllim'})).to.eql({name: 'Yllim'});
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaObject, undefined)).to.equal(undefined);
    });

    it('should return an empty object if data is undefined but a value is required', () => {
      const schema: SchemaValue = {type: 'object', required: true, definition: {name: {type: 'string'}}};
      expect(sanitize(schema, undefined)).to.eql({});
    });
  });

  describe('type reference', () => {
    class Cat extends Model<Cat> {
      @Cat.PropertySchema({type: 'string'})
      public id: string;

      @Cat.PropertySchema({type: 'string'})
      public name: string;
    }
    const catsCollection = new ArrayCollection(Cat);
    const schemaReference: SchemaValue = {type: 'reference', collection: () => catsCollection};

    it('should throw if data is not an instance or an id', () => {
      expect(() => sanitize(schemaReference, 42))
        .to.throw('not an instance or an id');
    });

    it('should return an instance', () => {
      const cat = new Cat({id: '23', name: 'Kilf'});
      expect(sanitize(schemaReference, cat)).to.equal(cat);
    });

    it('should return an id', () => {
      expect(sanitize(schemaReference, '42')).to.equal('42');
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaReference, undefined)).to.equal(undefined);
    });
  });

  describe('type boolean', () => {
    const schemaBool: SchemaValue = {type: 'boolean'};

    it('should throw if data is not a boolean', () => {
      expect(() => sanitize(schemaBool, 42)).to.throw('not a boolean');
    });

    it('should return a boolean', () => {
      expect(sanitize(schemaBool, true)).to.equal(true);
      expect(sanitize(schemaBool, false)).to.equal(false);
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaBool, undefined)).to.equal(undefined);
    });

    it('should return default value if undefined', () => {
      expect(sanitize({type: 'boolean', default: true}, undefined, {defaults: true}))
        .to.equal(true);
      expect(sanitize({type: 'boolean', default: () => true}, undefined, {defaults: true}))
        .to.equal(true);
    });
  });

  describe('type date', () => {
    const schemaDate: SchemaValue = {type: 'date'};

    it('should throw if data is not a date', () => {
      expect(() => sanitize(schemaDate, 42)).to.throw('not a date');
    });

    it('should return a date', () => {
      const date = new Date();
      expect(sanitize(schemaDate, date)).to.equal(date);
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaDate, undefined)).to.equal(undefined);
    });

    it('should return default value if undefined', () => {
      const date = new Date();
      expect(sanitize({type: 'date', default: date}, undefined, {defaults: true}))
        .to.equal(date);
      expect(sanitize({type: 'date', default: () => date}, undefined, {defaults: true}))
        .to.equal(date);
    });
  });

  describe('type number', () => {
    const schemaNumber: SchemaValue = {type: 'number'};

    it('should throw if data is not a number', () => {
      expect(() => sanitize(schemaNumber, 'foo')).to.throw('not a number');
    });

    it('should return a number', () => {
      expect(sanitize(schemaNumber, 0)).to.equal(0);
      expect(sanitize(schemaNumber, 13.37)).to.equal(13.37);
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaNumber, undefined)).to.equal(undefined);
    });

    it('should return default value if undefined', () => {
      expect(sanitize({type: 'number', default: 42}, undefined, {defaults: true}))
        .to.equal(42);
      expect(sanitize({type: 'number', default: () => 42}, undefined, {defaults: true}))
        .to.equal(42);
    });
  });

  describe('type string', () => {
    const schemaString: SchemaValue = {type: 'string'};

    it('should throw if data is not a string', () => {
      expect(() => sanitize(schemaString, 42)).to.throw('not a string');
    });

    it('should return a string', () => {
      expect(sanitize(schemaString, 'foo')).to.equal('foo');
      expect(sanitize(schemaString, '')).to.equal('');
    });

    it('should return undefined if data is undefined', () => {
      expect(sanitize(schemaString, undefined)).to.equal(undefined);
    });

    it('should return default value if undefined', () => {
      expect(sanitize({type: 'string', default: 'foo'}, undefined, {defaults: true}))
        .to.equal('foo');
      expect(sanitize({type: 'string', default: () => 'foo'}, undefined, {defaults: true}))
        .to.equal('foo');
    });
  });
});

describe('setObjectSanitized()', () => {
  const map: SchemaMap = {age: {type: 'number'}, name: {type: 'string'}};

  it('should throw if data is not an object', () => {
    expect(() => setObjectSanitized(map, {}, 42 as any)).to.throw('data is not an object');
  });

  it('should throw if a key is not present in the schema', () => {
    const obj = {};
    expect(() => setObjectSanitized(map, obj, {foo: 42})).to.throw('key foo not found in schema');
  });

  it('should not modify properties that do not exist in data', () => {
    const obj = {age: 42};
    const sanitizedObj = setObjectSanitized(map, obj, {name: 'Yllim'});
    expect(sanitizedObj).to.eql({age: 42, name: 'Yllim'});
    expect(sanitizedObj).to.equal(obj);
  });

  it('should remove properties that do not exist in data in replace mode', () => {
    const obj = {age: 42};
    const sanitizedObj = setObjectSanitized(map, obj, {name: 'Yllim'}, {replace: true});
    expect(sanitizedObj).to.eql({name: 'Yllim'});
    expect(sanitizedObj).to.equal(obj);
  });
});

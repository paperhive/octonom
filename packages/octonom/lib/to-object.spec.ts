import { ArrayCollection } from './array-collection';
import { Model } from './model';
import { SchemaMap, SchemaValue } from './schema';
import { toObject, toObjectValue } from './to-object';

describe('toObject()', () => {
  const map: SchemaMap = {name: {type: 'string'}};
  it('should return an object without keys that do not exist in schema', () => {
    expect(toObject(map, {name: 'Yllim', age: 42})).to.eql({name: 'Yllim'});
  });

  it('should remove keys with undefined values', () => {
    expect(toObject(map, {name: undefined, age: 42})).to.eql({});
  });
});

describe('toObjectValue()', () => {
  class Cat extends Model {
    @Cat.Property({type: 'string'})
    public id: string;

    @Cat.Property({type: 'string'})
    public name: string;

    // note: this property is not in the schema and will thus not be exposed with toObject
    public age = 42;
  }

  const catsCollection = new ArrayCollection(Cat);

  describe('type invalid', () => {
    it('should throw if the type is invalid', () => {
      expect(() => toObjectValue({type: 'invalid'} as any, 42)).to.throw('type invalid is unknown');
    });
  });

  describe('type any', () => {
    it('should return the value', () => {
      const schema: SchemaValue = {type: 'any'};
      const value = {foo: 'bar'};
      expect(toObjectValue(schema, value)).to.eql(value);
    });
  });

  describe('type array', () => {
    it('should clone an array', () => {
      const schema: SchemaValue = {type: 'array', definition: {type: 'string'}};
      const array = ['foo', 'bar'];
      const newArray = toObjectValue(schema, array);
      expect(newArray).to.eql(['foo', 'bar']);
      expect(newArray).to.not.equal(array);
    });

    it('should run toObjectValue() recursively on elements', () => {
      const schema: SchemaValue = {type: 'array', definition: {type: 'model', model: Cat}};
      const cats = [new Cat({name: 'Yllim'})];
      expect(toObjectValue(schema, cats)).to.eql([{name: 'Yllim'}]);
    });
  });

  describe('type model', () => {
    it('should turn a model into an object', () => {
      const schema: SchemaValue = {type: 'model', model: Cat};
      expect(toObjectValue(schema, new Cat({name: 'Yllim'}))).to.eql({name: 'Yllim'});
    });
  });

  describe('type object', () => {
    it('should turn an object into a new object', () => {
      const schema: SchemaValue = {type: 'object', definition: {name: {type: 'string'}}};
      expect(toObjectValue(schema, {name: 'Yllim', age: 42})).to.eql({name: 'Yllim'});
    });
  });

  describe('type reference', () => {
    const schemaReference: SchemaValue = {type: 'reference', collection: () => catsCollection};

    it('should turn an instance into an object', () => {
      expect(toObjectValue(schemaReference, new Cat({id: '42', name: 'Yllim'}))).to.eql({id: '42', name: 'Yllim'});
    });

    it('should turn an instance into an id with {unpopulate: true}', () => {
      expect(toObjectValue(schemaReference, new Cat({id: '42', name: 'Yllim'}), {unpopulate: true}))
        .to.eql('42');
    });

    it('should return an id', () => {
      expect(toObjectValue(schemaReference, '42')).to.eql('42');
    });
  });

  describe('types any, boolean, date, number, string', () => {
    it('should just return the primitive', () => {
      expect(toObjectValue({type: 'any'}, {foo: 'bar'})).to.eql({foo: 'bar'});
      expect(toObjectValue({type: 'boolean'}, false)).to.equal(false);
      const date = new Date();
      expect(toObjectValue({type: 'date'}, date)).to.equal(date);
      expect(toObjectValue({type: 'number'}, 42)).to.equal(42);
      expect(toObjectValue({type: 'string'}, 'foo')).to.equal('foo');
    });
  });
});

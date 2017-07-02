import { Model } from './model';
import { sanitize, SchemaValue } from './schema';

describe('schema', () => {
  describe('sanitize()', () => {
    describe('type invalid', () => {
      it('should throw', () => {
        expect(() => sanitize({type: 'invalid'} as any, 'foo'))
          .to.throw('type invalid is unknown');
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
      interface ICat {
        name: string;
      }
      class Cat extends Model<ICat> {
        @Cat.PropertySchema({type: 'string'})
        public name: string;
      }
      const schemaModel: SchemaValue = {type: 'model', model: Cat};

      it('should throw if the model data cannot be sanitized', () => {
        expect(() => sanitize(schemaModel, {age: 42}))
          .to.throw('key age not found in schema');
      });

      it('should throw if data is not an object', () => {
        expect(() => sanitize(schemaModel, 42))
          .to.throw('data is not an object');
      })

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
  });
});

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
    });
  });
});

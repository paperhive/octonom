import { generateId, rename } from './utils';

describe('utils', () => {
  /*
  describe('enumerable() decorator', () => {
    it.skip('should make a property non-enumerable', () => {
      class Foo {
        @enumerable(false)
        public bar: string = 'baz';
      }
      const foo = new Foo();
      expect(Object.keys(foo)).to.not.include('bar');
    });
  });
  */

  describe('generateId()', () => {
    it('should generate a unique id', () => {
      const id1 = generateId();
      expect(id1).to.have.lengthOf(12);
      expect(id1).to.not.equal(generateId());
    });
  });

  describe('rename()', () => {
    it('should rename properties', () => {
      const obj = {_id: '42', foo: 'bar', fuu: 'baz'};
      const map = {_id: 'id', foo: 'f00'};
      expect(rename(obj, map)).to.eql({id: '42', f00: 'bar', fuu: 'baz'});
      expect(obj).to.eql({_id: '42', foo: 'bar', fuu: 'baz'});
    });
  });
});

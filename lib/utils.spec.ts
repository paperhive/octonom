import { generateId } from './utils';

describe('utils', () => {
  describe('generateId()', () => {
    it('should generate a unique id', () => {
      const id1 = generateId();
      expect(id1).to.have.lengthOf(12);
      expect(id1).to.not.equal(generateId());
    });
  });
});

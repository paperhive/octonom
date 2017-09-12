import { expect } from 'chai';
import { Model, Property } from 'octonom';

import { Timestamp } from './timestamp';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Timestamp mixin', () => {
  class Base extends Model {
    @Property({type: 'string'})
    public name: string;
  }

  function testInstance(instance) {
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
  }

  function testClass(timestampedClass) {
    it('should set createdAt and updatedAt on a new instance', () => {
      const instance = new timestampedClass();
      testInstance(instance);
      expect(instance.createdAt.getTime()).to.equal(instance.updatedAt.getTime());
    });

    it('should use createdAt and updatedAt from initialization data', () => {
      const createdAt = new Date('2016-09-15T20:00:00.000Z');
      const updatedAt = new Date('2016-09-16T07:00:00.000Z');
      const instance = new timestampedClass({name: 'test', createdAt, updatedAt});
      expect(instance).to.eql({name: 'test', createdAt, updatedAt});
    });

    it('should update updatedAt when calling set()', async () => {
      const instance = new timestampedClass();
      await sleep(10);
      instance.set({name: 'test'});
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });

    it('should update updatedAt when setting a property', async () => {
      const instance = new timestampedClass();
      await sleep(10);
      instance.name = 'test';
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });

    it('should update updatedAt when deleting a property', async () => {
      const instance = new timestampedClass({name: 'test'});
      await sleep(10);
      delete instance.name;
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });
  }

  describe('Direct mixin extending from Model', () => {
    class Timestamped extends Timestamp(Model) {
      @Property({type: 'string'})
      public name: string;
    }

    testClass(Timestamped);
  });

  describe('Mixin extending a base class', () => {
    class Timestamped extends Timestamp(Base) {}

    testClass(Timestamped);
  });
});

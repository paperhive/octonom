import { stub } from 'sinon';

import { ValidationError } from './errors';
import { Model } from './model';
import { SchemaValue } from './schema';
import { validate } from './validate';

describe('validate()', () => {
  function getInstance(schema: SchemaValue, data: object) {
    class TestModel extends Model<TestModel> {
      @Model.PropertySchema(schema)
      public key: any;
    }
    return new TestModel(data);
  }

  it('should throw a validation error if required value is undefined', async () => {
    const schema: SchemaValue = {type: 'any', required: true};
    const instance = getInstance(schema, {});
    await expect(validate(schema, undefined, ['key'], instance))
      .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
  });

  it('should pass if value is undefined and not required', async () => {
    const schema: SchemaValue = {type: 'any'};
    const instance = getInstance(schema, {});
    await validate(schema, undefined, ['key'], instance);
  });

  describe('type any', () => {
    const schema: SchemaValue = {
      type: 'any',
      validate: async (value: any, path: Array<string | number>, instance: Model<any>) => {
        if (value.foo === 'invalid') {
          throw new ValidationError('custom error', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = {foo: 'invalid'};
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'custom error');
    });

    it('should pass if validator passes', async () => {
      const value = {foo: 'bar'};
      const instance = getInstance(schema, {key: value});
      await validate(schema, value, ['key'], instance);
    });
  });
});

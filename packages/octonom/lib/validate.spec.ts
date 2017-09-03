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
          throw new ValidationError('Custom error.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = {foo: 'invalid'};
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Custom error.');
    });

    it('should pass if validator passes', async () => {
      const value = {foo: 'bar'};
      const instance = getInstance(schema, {key: value});
      await validate(schema, value, ['key'], instance);
    });
  });

  describe('type array', () => {
    const schema: SchemaValue = {
      type: 'array',
      definition: {
        type: 'any',
        validate: async (value: any, path: Array<string | number>, instance: Model<any>) => {
          if (value === 'invalid') {
            throw new ValidationError('Custom error.', 'custom', value, path, instance);
          }
        },
      },
      minLength: 1,
      maxLength: 2,
      validate: async (value: any[], path: Array<string | number>, instance: Model<any>) => {
        if (value.indexOf('baz') !== -1) {
          throw new ValidationError('Array must not contain baz.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not an array', async () => {
      const value = 'foo';
      const instance = getInstance(schema, {key: ['foo']}); // pretend it's an array
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not an array.');
    });

    it('should throw a ValidationError with too few elements', async () => {
      const value = [];
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must have at least 1 elements.');
    });

    it('should throw a ValidationError with too many', async () => {
      const value = [1, 2, 3];
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must have at most 2 elements.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = [1, 'baz'];
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must not contain baz.');
    });

    it('should throw a ValidationError if nested validator throws', async () => {
      const value = ['foo', 'invalid'];
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Custom error.');
    });

    it('should pass if validator passes', async () => {
      const value = ['foo', 'bar'];
      const instance = getInstance(schema, {key: value});
      await validate(schema, value, ['key'], instance);
    });
  });

  describe('type boolean', () => {
    const schema: SchemaValue = {
      type: 'boolean',
      validate: async (value: boolean, path: Array<string | number>, instance: Model<any>) => {
        if (value === false) {
          throw new ValidationError('False not allowed.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if value not a boolean', async () => {
      const value = 'foo';
      const instance = getInstance(schema, {key: true}); // pretend it's a boolean
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not a boolean.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = false;
      const instance = getInstance(schema, {key: value});
      await expect(validate(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'False not allowed.');
    });

    it('should pass if validator passes', async () => {
      const value = true;
      const instance = getInstance(schema, {key: value});
      await validate(schema, value, ['key'], instance);
    });
  });
});

import { collections } from '../test/data/collections';
import { CatModel } from '../test/data/models/cat';

import { ValidationError } from './errors';
import { Model } from './model';
import { SchemaMap, SchemaValue } from './schema';
import { validateObject, validateValue } from './validate';

function getInstance(schema: SchemaValue, data: object) {
  class TestModel extends Model<TestModel> {
    @Model.PropertySchema(schema)
    public key: any;
  }
  return new TestModel(data);
}

describe('validateObject()', () => {
  const schemaMap: SchemaMap = {key: {type: 'any', required: true}};

  it('should throw a ValidationError if key is not in schema', async () => {
    const obj = {key: 'foo', invalid: true};
    const instance = getInstance(schemaMap.key, {key: obj.key});
    await expect(validateObject(schemaMap, obj, [], instance))
      .to.be.rejectedWith(ValidationError, 'Key invalid not in schema.');
  });

  it('should throw a ValidationError if nested validation fails', async () => {
    const obj = {};
    const instance = getInstance(schemaMap.key, obj);
    await expect(validateObject(schemaMap, obj, [], instance))
      .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
  });

  it('should pass with a valid object', async () => {
    const obj = {key: 'foo'};
    const instance = getInstance(schemaMap.key, obj);
    await validateObject(schemaMap, obj, [], instance);
  });
});

describe('validateValue()', () => {
  it('should throw a ValidationError if required value is undefined', async () => {
    const schema: SchemaValue = {type: 'any', required: true};
    const instance = getInstance(schema, {});
    await expect(validateValue(schema, undefined, ['key'], instance))
      .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
  });

  it('should pass if value is undefined and not required', async () => {
    const schema: SchemaValue = {type: 'any'};
    const instance = getInstance(schema, {});
    await validateValue(schema, undefined, ['key'], instance);
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
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Custom error.');
    });

    it('should pass if validator passes', async () => {
      const value = {foo: 'bar'};
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
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
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not an array.');
    });

    it('should throw a ValidationError with too few elements', async () => {
      const value = [];
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must have at least 1 elements.');
    });

    it('should throw a ValidationError with too many', async () => {
      const value = [1, 2, 3];
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must have at most 2 elements.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = [1, 'baz'];
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Array must not contain baz.');
    });

    it('should throw a ValidationError if nested validator throws', async () => {
      const value = ['foo', 'invalid'];
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Custom error.');
    });

    it('should pass if validator passes', async () => {
      const value = ['foo', 'bar'];
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
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
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not a boolean.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = false;
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'False not allowed.');
    });

    it('should pass if validator passes', async () => {
      const value = true;
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });

  describe('type date', () => {
    const schema: SchemaValue = {
      type: 'date',
      min: new Date('2000-01-01'),
      max: new Date('2018-01-01'),
      validate: async (value: Date, path: Array<string | number>, instance: Model<any>) => {
        if (value.getTime() === new Date('2017-09-03').getTime()) {
          throw new ValidationError('2017-09-03 is not allowed.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not a date', async () => {
      const value = 'foo';
      const instance = getInstance(schema, {key: new Date()}); // pretend it's a date
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not a date.');
    });

    it('should throw a ValidationError if before min date', async () => {
      const value = new Date('1999-12-31');
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, `Date must not be before ${schema.min}`);
    });

    it('should throw a ValidationError if after max date', async () => {
      const value = new Date('2019-12-31');
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, `Date must not be after ${schema.max}`);
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = new Date('2017-09-03');
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, '2017-09-03 is not allowed.');
    });

    it('should pass if validator passes', async () => {
      const value = new Date('2016-06-06');
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });

  describe('type model', () => {
    class NestedModel extends Model<NestedModel> {
      @Model.PropertySchema({
        type: 'any',
        validate: async (value: any, path: Array<string | number>, instance: Model<any>) => {
          if (value === 'baz') {
            throw new ValidationError('Value baz is not allowed.', 'custom', value, path, instance);
          }
        },
      })
      public foo: any;
    }

    const schema: SchemaValue = {
      type: 'model',
      model: NestedModel,
      validate: async (value: NestedModel, path: Array<string | number>, instance: Model<any>) => {
        if (value.foo === 'invalid') {
          throw new ValidationError('Value invalid is not allowed.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not a model instance', async () => {
      const value = {foo: 'bar'};
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not an instance of NestedModel.');
    });

    it('should throw a ValidationError if nested model\'s validator throws', async () => {
      const value = new NestedModel({foo: 'baz'});
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value baz is not allowed.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = new NestedModel({foo: 'invalid'});
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value invalid is not allowed.');
    });

    it('should pass if validator passes', async () => {
      const value = new NestedModel({foo: 'bar'});
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });

  describe('type number', () => {
    const schema: SchemaValue = {
      type: 'number',
      min: 1,
      max: 5,
      integer: true,
      validate: async (value: number, path: Array<string | number>, instance: Model<any>) => {
        if (value === 3) {
          throw new ValidationError('3 is not allowed.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not a number', async () => {
      const value = 'foo';
      const instance = getInstance(schema, {key: 1}); // pretend it's a date
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not a number.');
    });

    it('should throw a ValidationError if not an integer', async () => {
      const value = 2.5;
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Number is not an integer.');
    });

    it('should throw a ValidationError if less than min', async () => {
      const value = 0;
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, `Number must not be less than ${schema.min}`);
    });

    it('should throw a ValidationError if greater than max', async () => {
      const value = 6;
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, `Number must not be greater than ${schema.max}`);
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = 3;
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, '3 is not allowed.');
    });

    it('should pass if validator passes', async () => {
      const value = 2;
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });

  describe('type object', () => {
    const schema: SchemaValue = {
      type: 'object',
      definition: {foo: {type: 'any', required: true}},
      validate: async (value: any, path: Array<string | number>, instance: Model<any>) => {
        if (value && value.foo === 'invalid') {
          throw new ValidationError('Invalid value for key foo.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not an object', async () => {
      const value = 1;
      const instance = getInstance(schema, {key: {}});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not an object.');
    });

    it('should throw a ValidationError if nested validator throws', async () => {
      const value = {};
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = {foo: 'invalid'};
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Invalid value for key foo.');
    });

    it('should pass if validator passes', async () => {
      const value = {foo: 'bar'};
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });

  describe('type reference', () => {
    const schema: SchemaValue = {
      type: 'reference',
      collection: () => collections.cats,
      validate: async (value: any, path: Array<string | number>, instance: Model<any>) => {
        if (value === 'invalid') {
          throw new ValidationError('Invalid id.', 'custom', value, path, instance);
        }
      },
    };

    it('should throw a ValidationError if not an id or CatModel instance', async () => {
      const value = 1;
      const instance = getInstance(schema, {key: 'fakeId'}); // pretend it's an id
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Value is not an id or CatModel instance.');
    });

    it('should throw a ValidationError if custom validator throws', async () => {
      const value = 'invalid';
      const instance = getInstance(schema, {key: value});
      await expect(validateValue(schema, value, ['key'], instance))
        .to.be.rejectedWith(ValidationError, 'Invalid id.');
    });

    it('should pass with a CatModel instance', async () => {
      const value = new CatModel({id: 'catId', name: 'Yllim'});
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });

    it('should pass with an id', async () => {
      const value = 'id';
      const instance = getInstance(schema, {key: value});
      await validateValue(schema, value, ['key'], instance);
    });
  });
});

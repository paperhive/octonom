import { ValidationError } from './errors';
import { Model } from './model';
import { SchemaMap, SchemaValue } from './schema';

export async function validateObject(
  schemaMap: SchemaMap,
  obj: object,
  path: Array<string | number>,
  instance: Model<object>,
) {
  const keys = Object.keys(obj);
  const schemaKeys = Object.keys(schemaMap);

  const invalidKeys = keys.filter(key => schemaKeys.indexOf(key) === -1);
  if (invalidKeys.length > 0) {
    const newPath = path.slice();
    newPath.push(invalidKeys[0]);
    throw new ValidationError(
      `Key ${invalidKeys[0]} not in schema.`,
      'key-unknown', obj[invalidKeys[0]], newPath, instance,
    );
  }

  await Promise.all(schemaKeys.map(async key => {
    const newPath = path.slice();
    newPath.push(key);
    await validateValue(schemaMap[key], obj[key], newPath, instance);
  }));
}

export async function validateValue(
  schema: SchemaValue,
  value: any,
  path: Array<string | number>,
  instance: Model<object>,
) {
  if (schema.required && value === undefined) {
    throw new ValidationError(
      'Required value is undefined.',
      'required',
      value,
      path,
      instance,
    );
  }

  // nothing to validate if undefined
  if (value === undefined) {
    return;
  }

  switch (schema.type) {
    case 'any':
      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'array':
      if (!(value instanceof Array)) {
        throw new ValidationError('Value is not an array.', 'no-array', value, path, instance);
      }

      if (schema.minLength !== undefined && value.length < schema.minLength) {
        throw new ValidationError(
          `Array must have at least ${schema.minLength} elements.`,
          'array-min-length', value, path, instance,
        );
      }

      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        throw new ValidationError(
          `Array must have at most ${schema.maxLength} elements.`,
          'array-max-length', value, path, instance,
        );
      }

      // validate all elements
      await Promise.all(value.map(async (element, index) => {
        const newPath = path.slice();
        newPath.push(index);
        await validateValue(schema.definition, element, newPath, instance);
      }));

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'boolean':
      if (value !== true && value !== false) {
        throw new ValidationError('Value is not a boolean.', 'no-boolean', value, path, instance);
      }

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'date':
      if (!(value instanceof Date)) {
        throw new ValidationError('Value is not a date.', 'no-date', value, path, instance);
      }

      if (schema.min && value < schema.min) {
        throw new ValidationError(`Date must not be before ${schema.min}.`, 'date-min', value, path, instance);
      }

      if (schema.max && value > schema.max) {
        throw new ValidationError(`Date must not be after ${schema.max}.`, 'date-max', value, path, instance);
      }

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'model':
      if (!(value instanceof schema.model)) {
        throw new ValidationError(
          `Value is not an instance of ${schema.model.name}.`,
          'no-instance', value, path, instance,
        );
      }
      // TODO: use value.validate() so we use the same validation we'd get on the instance
      await validateObject(schema.model._schema, value, path, instance);

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ValidationError('Value is not a number.', 'no-number', value, path, instance);
      }

      if (schema.integer && !Number.isInteger(value)) {
        throw new ValidationError('Number is not an integer.', 'no-integer', value, path, instance);
      }

      if (schema.min !== undefined && value < schema.min) {
        throw new ValidationError(
          `Number must not be less than ${schema.min}.`,
          'number-min', value, path, instance,
        );
      }

      if (schema.max !== undefined && value > schema.max) {
        throw new ValidationError(
          `Number must not be greater than ${schema.max}.`,
          'number-max', value, path, instance,
        );
      }

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'object':
      if (!(value instanceof Object)) {
        throw new ValidationError('Value is not an object.', 'no-object', value, path, instance);
      }

      await validateObject(schema.definition, value, path, instance);

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'reference':
      // note: we do not run validation on a populated reference since it's not part of
      //       the model instance

      const collection = schema.collection();
      if (typeof value !== 'string' && !(value instanceof collection.model)) {
        throw new ValidationError(
          `Value is not an id or ${collection.model.name} instance.`,
          'no-number', value, path, instance,
        );
      }

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    case 'string':
      if (typeof value !== 'string') {
        throw new ValidationError('Value is not a string.', 'no-string', value, path, instance);
      }

      if (schema.enum && schema.enum.indexOf(value) === -1) {
        throw new ValidationError(
          `String not in enum: ${schema.enum.join(', ')}.`,
          'string-enum', value, path, instance,
        );
      }

      if (schema.min && value.length < schema.min) {
        throw new ValidationError(
          `String must not have less than ${schema.min} characters.`,
          'string-min', value, path, instance,
        );
      }

      if (schema.max && value.length > schema.max) {
        throw new ValidationError(
          `String must not have more than ${schema.max} characters.`,
          'string-max', value, path, instance,
        );
      }

      if (schema.regex && !schema.regex.test(value)) {
        throw new ValidationError(`String does not match regex.`, 'string-regex', value, path, instance);
      }

      if (schema.validate) {
        await schema.validate(value, path, instance);
      }

      break;

    default:
      throw new Error(`Type ${(schema as SchemaValue).type} is unknown.`);
  }
}

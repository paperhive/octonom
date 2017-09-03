import { ValidationError } from './errors';
import { Model } from './model';
import { SchemaValue } from './schema';

export async function validate(
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
        await validate(schema.definition, element, newPath, instance);
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
  }
}

import { IModel, Model } from '../model';
import { AnySchema, IAnyOptions } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { DateSchema, IDateOptions } from './date';
import { IModelOptions, ModelSchema } from './model';
import { INumberOptions, NumberSchema } from './number';
import { IObjectOptions, ObjectSchema } from './object';
import { IReferenceOptions, ReferenceSchema } from './reference';
import { ISanitizeOptions, ISchema, ISchemaInstance } from './schema';
import { IStringOptions, StringSchema } from './string';

export function getSchemaDecorator(createSchema: () => ISchema<any, ISchemaInstance>): PropertyDecorator {
  return (target: IModel, key: string) => target.constructor.setSchema(key, createSchema());
}

/* tslint:disable:variable-name */
export const Property = {
  Any: (options: IAnyOptions = {}) => getSchemaDecorator(() => new AnySchema(options)),
  Array: <T> (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema<T>(options)),
  Boolean: (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options)),
  Date: (options: IDateOptions = {}) => getSchemaDecorator(() => new DateSchema(options)),
  Model: (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options)),
  Number: (options: INumberOptions = {}) => getSchemaDecorator(() => new NumberSchema(options)),
  Object: (options: IObjectOptions) => getSchemaDecorator(() => new ObjectSchema(options)),
  Reference: (options: IReferenceOptions) => getSchemaDecorator(() => new ReferenceSchema(options)),
  String: (options: IStringOptions = {}) => getSchemaDecorator(() => new StringSchema(options)),
};

export const Schema = {
  Any: AnySchema,
  Array: ArraySchema,
  Boolean: BooleanSchema,
  Date: DateSchema,
  Model: ModelSchema,
  Number: NumberSchema,
  Object: ObjectSchema,
  Reference: ReferenceSchema,
  String: StringSchema,
};
/* tslint:enable:variable-name */

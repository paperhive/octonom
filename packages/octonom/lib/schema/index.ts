import { IModel, Model } from '../model';
import { IAnyOptions, OctoAnyFactory } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { DateSchema, IDateOptions } from './date';
import { IModelOptions, ModelSchema } from './model';
import { INumberOptions, NumberSchema } from './number';
import { IObjectOptions, ObjectSchema } from './object';
import { IReferenceOptions, ReferenceSchema } from './reference';
import { IStringOptions, OctoStringFactory } from './string';
import { ISanitizeOptions, OctoValue, OctoValueFactory } from './value';

export function getSchemaDecorator(createSchema: () => OctoValueFactory): PropertyDecorator {
  return (target: IModel, key: string) => target.constructor.setSchema(key, createSchema());
}

/* tslint:disable:variable-name */
export const Property = {
  Any: (options: IAnyOptions = {}) => getSchemaDecorator(() => OctoAnyFactory.create(options)),
  /*
  Array: (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options)),
  Boolean: (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options)),
  Date: (options: IDateOptions = {}) => getSchemaDecorator(() => new DateSchema(options)),
  Model: (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options)),
  Number: (options: INumberOptions = {}) => getSchemaDecorator(() => new NumberSchema(options)),
  Object: (options: IObjectOptions) => getSchemaDecorator(() => new ObjectSchema(options)),
  Reference: (options: IReferenceOptions) => getSchemaDecorator(() => new ReferenceSchema(options)),
  */
  String: (options: IStringOptions = {}) => getSchemaDecorator(() => OctoStringFactory.create(options)),
};

export const Schema = {
  Any: OctoAnyFactory.create,
  /*
  Array: ArraySchema,
  Boolean: BooleanSchema,
  Date: DateSchema,
  Model: ModelSchema,
  Number: NumberSchema,
  Object: ObjectSchema,
  Reference: ReferenceSchema,
  */
  String: OctoStringFactory.create,
};
/* tslint:enable:variable-name */

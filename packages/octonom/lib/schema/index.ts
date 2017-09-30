import { IModel, Model } from '../model';
import { AnySchema, IAnyOptions } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { DateSchema, IDateOptions } from './date';
import { IModelOptions, ModelSchema } from './model';
import { INumberOptions, NumberSchema } from './number';
import { IObjectOptions, ObjectSchema } from './object';
import { IReferenceOptions, ReferenceSchema } from './reference';
import { IStringOptions, OctoString } from './string';
import { ISanitizeOptions, OctoValue } from './value';

export type OctoValueFactory<TOctoValue extends OctoValue<any> = OctoValue<any>> =
(value: any, sanitizeOptions: ISanitizeOptions) => TOctoValue;

export interface ISchemaMap {
[field: string]: OctoValueFactory;
}

export function getSchemaDecorator(createSchema: () => OctoValueFactory): PropertyDecorator {
  return (target: IModel, key: string) => target.constructor.setSchema(key, createSchema());
}

/* tslint:disable:variable-name */
export const Property = {
  /*
  Any: (options: IAnyOptions = {}) => getSchemaDecorator(() => new AnySchema(options)),
  Array: (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options)),
  Boolean: (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options)),
  Date: (options: IDateOptions = {}) => getSchemaDecorator(() => new DateSchema(options)),
  Model: (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options)),
  Number: (options: INumberOptions = {}) => getSchemaDecorator(() => new NumberSchema(options)),
  Object: (options: IObjectOptions) => getSchemaDecorator(() => new ObjectSchema(options)),
  Reference: (options: IReferenceOptions) => getSchemaDecorator(() => new ReferenceSchema(options)),
  */
  String: (options: IStringOptions = {}) => getSchemaDecorator(() => OctoString.createSchema(options)),
};

export const Schema = {
  /*
  Any: AnySchema,
  Array: ArraySchema,
  Boolean: BooleanSchema,
  Date: DateSchema,
  Model: ModelSchema,
  Number: NumberSchema,
  Object: ObjectSchema,
  Reference: ReferenceSchema,
  */
  String: OctoString.createSchema,
};
/* tslint:enable:variable-name */

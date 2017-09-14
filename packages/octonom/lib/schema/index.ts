import { ArrayCollection } from '../array-collection';
import { IModel, Model } from '../model';
import { AnySchema, IAnyOptions } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { DateSchema, IDateOptions } from './date';
import { IModelOptions, ModelSchema } from './model';
import { INumberOptions, NumberSchema } from './number';
import { IObjectOptions, ObjectSchema } from './object';
import { IReferenceOptions, ReferenceSchema } from './reference';
import { ISchema } from './schema';
import { IStringOptions, StringSchema } from './string';

export function getSchemaDecorator(createSchema: () => ISchema<any, Model>): PropertyDecorator {
  return (target: IModel, key: string) => target.constructor.setSchema(key, createSchema());
}

/* tslint:disable:variable-name */
export const AnyProperty = (options: IAnyOptions = {}) => getSchemaDecorator(() => new AnySchema(options));
export const ArrayProperty = (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options));
export const BooleanProperty = (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options));
export const DateProperty = (options: IDateOptions = {}) => getSchemaDecorator(() => new DateSchema(options));
export const ModelProperty = (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options));
export const NumberProperty = (options: INumberOptions = {}) => getSchemaDecorator(() => new NumberSchema(options));
export const ObjectProperty = (options: IObjectOptions) => getSchemaDecorator(() => new ObjectSchema(options));
export const ReferenceProperty = (options: IReferenceOptions) => getSchemaDecorator(() => new ReferenceSchema(options));
export const StringProperty = (options: IStringOptions = {}) => getSchemaDecorator(() => new StringSchema(options));
/* tslint:enable:variable-name */

export {
  AnySchema,
  ArraySchema,
  BooleanSchema,
  DateSchema,
  ModelSchema,
  NumberSchema,
  ObjectSchema,
  ReferenceSchema,
  StringSchema,
};

class Account extends Model {
  @AnyProperty()
  public any: any;
}

const accounts = new ArrayCollection<Account>(Account);

class Person extends Model {
  @ArrayProperty({elementSchema: new BooleanSchema()})
  public array: boolean[];

  @BooleanProperty()
  public boolean: boolean;

  @DateProperty()
  public date: Date;

  @ModelProperty({model: Account})
  public model: Account;

  @NumberProperty()
  public number: number;

  @ObjectProperty({schema: {enabled: new BooleanSchema()}})
  public object: object;

  @ReferenceProperty({collection: () => accounts})
  public reference: string | Account;

  @StringProperty()
  public string: string;
}

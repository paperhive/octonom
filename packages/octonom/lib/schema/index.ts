import { IModel, Model } from '../model';
import { AnySchema, IAnyOptions } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { DateSchema, IDateOptions } from './date';
import { IModelOptions, ModelSchema } from './model';
import { INumberOptions, NumberSchema } from './number';
import { IObjectOptions, ObjectSchema } from './object';
import { ISchema } from './schema';

export function getSchemaDecorator(createSchema: () => ISchema<any, Model>): PropertyDecorator {
  return (target: IModel, key: string) => {
    if (target.constructor.schema[key]) {
      throw new Error(`Key ${key} already has a schema.`);
    }

    // clone schema map
    target.constructor.schema = Object.assign({}, target.constructor.schema);
    target.constructor.schema[key] = createSchema();
  };
}

/* tslint:disable:variable-name */
export const AnyProperty = (options: IAnyOptions = {}) => getSchemaDecorator(() => new AnySchema(options));
export const ArrayProperty = (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options));
export const BooleanProperty = (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options));
export const DateProperty = (options: IDateOptions = {}) => getSchemaDecorator(() => new DateSchema(options));
export const ModelProperty = (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options));
export const NumberProperty = (options: INumberOptions = {}) => getSchemaDecorator(() => new NumberSchema(options));
export const ObjectProperty = (options: IObjectOptions) => getSchemaDecorator(() => new ObjectSchema(options));
/* tslint:enable:variable-name */

class Account extends Model {
  @AnyProperty()
  public any: any;
}

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
}

import { IModel, Model } from '../model';
import { AnySchema, IAnyOptions } from './any';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { IModelOptions, ModelSchema } from './model';
import { ISchema } from './schema';

export function getSchemaDecorator(createSchema: () => ISchema<any, Model>): PropertyDecorator {
  return (target: IModel, key: string) => {
    // clone schema map
    target.constructor.schema = Object.assign({}, target.constructor.schema);
    target.constructor.schema[key] = createSchema();
  };
}

/* tslint:disable:variable-name */
export const AnyProperty = (options: IAnyOptions = {}) => getSchemaDecorator(() => new AnySchema(options));
export const ArrayProperty = (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options));
export const BooleanProperty = (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options));
export const ModelProperty = (options: IModelOptions) => getSchemaDecorator(() => new ModelSchema(options));
/* tslint:enable:variable-name */

class Account extends Model {
  @AnyProperty()
  public any: any;
}

class Person extends Model {
  @ArrayProperty({elementSchema: new BooleanSchema()})
  public array: boolean[];

  @BooleanProperty()
  public enabled: boolean;

  @ModelProperty({model: Account})
  public account: Account;
}

import { IModel, Model } from '../model';
import { ArraySchema, IArrayOptions } from './array';
import { BooleanSchema, IBooleanOptions } from './boolean';
import { ISchema } from './schema';

export function getSchemaDecorator(createSchema: () => ISchema<any, Model>): PropertyDecorator {
  return (target: IModel, key: string) => {
    // clone schema map
    target.constructor.schema = Object.assign({}, target.constructor.schema);
    target.constructor.schema[key] = createSchema();
  };
}

export const property = {
  Array: (options: IArrayOptions) => getSchemaDecorator(() => new ArraySchema(options)),
  Boolean: (options: IBooleanOptions = {}) => getSchemaDecorator(() => new BooleanSchema(options)),
};

class Person extends Model {
  @property.Array({elementSchema: new BooleanSchema()})
  public array: boolean[];

  @property.Boolean()
  public enabled: boolean;
}

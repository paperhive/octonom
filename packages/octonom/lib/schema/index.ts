import { IModel, Model } from '../model';
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
  Boolean: (options?: IBooleanOptions) => getSchemaDecorator(() => new BooleanSchema(options)),
};

class Person extends Model {
  @property.Boolean()
  public enabled: boolean;
}

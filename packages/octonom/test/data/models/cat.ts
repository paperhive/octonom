import { Model, Property, utils } from '../../../lib/main';

export class CatModel extends Model {
  @Property.String({default: utils.generateId, required: true})
  public id: string;

  @Property.String()
  public name: string;

  @Property.Number({min: 0})
  public age: number;

  public nonSchemaProperty: string;

  constructor(data?: Partial<CatModel>) {
    super(data);
  }
}

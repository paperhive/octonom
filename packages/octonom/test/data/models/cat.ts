import { Model, Property, utils } from '../../../lib/main';

export class CatModel extends Model {
  @Property.String({default: utils.generateId})
  public id: string;

  @Property.String()
  public name: string;

  public nonSchemaProperty: string;

  constructor(data?: Partial<CatModel>) {
    super(data);
  }
}

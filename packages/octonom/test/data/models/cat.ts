import { Model, utils } from '../../../lib/main';

export class CatModel extends Model<CatModel> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  public nonSchemaProperty: string;
}

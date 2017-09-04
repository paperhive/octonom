import { Model, utils } from '../../../lib/main';

export class CatModel extends Model<CatModel> {
  @Model.Property({type: 'string', default: utils.generateId})
  public id: string;

  @Model.Property({type: 'string'})
  public name: string;

  public nonSchemaProperty: string;
}

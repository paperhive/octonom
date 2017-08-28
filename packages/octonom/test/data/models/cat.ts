import { Model, utils } from '../../../lib/main';

export interface ICat {
  id: string;
  name: string;
}

export class CatModel extends Model<ICat> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  public nonSchemaProperty: string;
}

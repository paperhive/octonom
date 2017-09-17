import { Model, StringProperty, utils } from '../../../lib/main';

export class CatModel extends Model {
  @StringProperty({default: utils.generateId})
  public id: string;

  @StringProperty()
  public name: string;

  public nonSchemaProperty: string;

  constructor(data?: Partial<CatModel>) {
    super(data);
  }
}

import { Model, utils } from '../../../lib/main';

import { PersonAccountModel } from './person-account';

export class PersonModel extends Model<PersonModel> {
  @Model.Property({type: 'string', default: utils.generateId})
  public id: string;

  @Model.Property({type: 'string'})
  public name: string;

  @Model.Property({type: 'model', model: PersonAccountModel})
  public account?: Partial<PersonAccountModel>;
}

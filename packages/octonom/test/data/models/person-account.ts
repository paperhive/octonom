import { Model } from '../../../lib/main';

export class PersonAccountModel extends Model<PersonAccountModel> {
  @Model.PropertySchema({type: 'string'})
  public username: string;
}

import { Model } from '../../../lib/main';

export class PersonAccountModel extends Model<PersonAccountModel> {
  @Model.Property({type: 'string'})
  public username: string;
}

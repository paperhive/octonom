import { Model } from '../../../lib/main';

export class PersonAccountModel extends Model {
  @Model.Property({type: 'string'})
  public username: string;

  constructor(data?: Partial<PersonAccountModel>) {
    super(data);
  }
}

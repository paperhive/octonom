import { Model, Property, utils } from '../../../lib/main';

import { PersonAccountModel } from './person-account';

export class PersonModel extends Model {
  @Property.String({default: utils.generateId})
  public id: string;

  @Property.String()
  public name: string;

  @Property.Model({model: PersonAccountModel})
  public account?: Partial<PersonAccountModel>;

  constructor(data?: Partial<PersonModel>) {
    super(data);
  }
}

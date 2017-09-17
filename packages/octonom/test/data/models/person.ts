import { Model, ModelProperty, StringProperty, utils } from '../../../lib/main';

import { PersonAccountModel } from './person-account';

export class PersonModel extends Model {
  @StringProperty({default: utils.generateId})
  public id: string;

  @StringProperty()
  public name: string;

  @ModelProperty({model: PersonAccountModel})
  public account?: Partial<PersonAccountModel>;

  constructor(data?: Partial<PersonModel>) {
    super(data);
  }
}

import { Model, Property, Schema, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class GroupWithReferencesModel extends Model {
  @Property.String({default: utils.generateId})
  public id: string;

  @Property.Array({elementSchema: new Schema.Reference({collection: () => collections.people})})
  public members: Array<string | PersonModel>;

  constructor(data?: Partial<GroupWithReferencesModel>) {
    super(data);
  }
}

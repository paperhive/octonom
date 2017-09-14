import { ArrayProperty, Model, ReferenceSchema, StringProperty, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class GroupWithReferencesModel extends Model {
  @StringProperty({default: utils.generateId})
  public id: string;

  @ArrayProperty({elementSchema: new ReferenceSchema({collection: () => collections.people})})
  public members: Array<string | PersonModel>;

  constructor(data?: Partial<GroupWithReferencesModel>) {
    super(data);
  }
}

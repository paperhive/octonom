import { ArrayCollection } from '../../lib/main';

import { CatModel } from './models/cat';
import { DiscussionModel } from './models/discussion';
import { GroupWithArrayModel } from './models/group-with-array';
import { GroupWithReferencesModel } from './models/group-with-references';
import { PersonModel } from './models/person';

export const collections = {
  cats: new ArrayCollection(CatModel),
  discussions: new ArrayCollection(DiscussionModel),
  groupsWithArray: new ArrayCollection(GroupWithArrayModel),
  groupsWithReferences: new ArrayCollection(GroupWithReferencesModel),
  people: new ArrayCollection(PersonModel),
};

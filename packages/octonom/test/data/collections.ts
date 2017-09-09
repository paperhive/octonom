import { ArrayCollection } from '../../lib/main';

import { CatModel } from './models/cat';
import { DiscussionModel } from './models/discussion';
import { GroupWithArrayModel } from './models/group-with-array';
import { GroupWithReferencesModel } from './models/group-with-references';
import { PersonModel } from './models/person';

export const collections = {
  cats: new ArrayCollection<CatModel>(CatModel),
  discussions: new ArrayCollection<DiscussionModel>(DiscussionModel),
  groupsWithArray: new ArrayCollection<GroupWithArrayModel>(GroupWithArrayModel),
  groupsWithReferences: new ArrayCollection<GroupWithReferencesModel>(GroupWithReferencesModel),
  people: new ArrayCollection<PersonModel>(PersonModel),
};

import { ArrayCollection } from '../../lib/main';

import { CatModel, ICat } from './models/cat';
import { DiscussionModel, IDiscussion } from './models/discussion';
import { GroupWithArrayModel, IGroupWithArray } from './models/group-with-array';
import { GroupWithReferencesModel, IGroupWithReferences } from './models/group-with-references';
import { IPerson, PersonModel } from './models/person';

export const collections = {
  cats: new ArrayCollection<ICat, CatModel>(CatModel),
  discussions: new ArrayCollection<IDiscussion, DiscussionModel>(DiscussionModel),
  groupsWithArray: new ArrayCollection<IGroupWithArray, GroupWithArrayModel>(GroupWithArrayModel),
  groupsWithReferences: new ArrayCollection<IGroupWithReferences, GroupWithReferencesModel>(GroupWithReferencesModel),
  people: new ArrayCollection<IPerson, PersonModel>(PersonModel),
};

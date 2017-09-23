import { find } from 'lodash';

import { Collection, ICollectionInsertOptions } from './collection';
import { Model } from './model';

// simple collection with an in-memory array
// note: we can't test Collection directly since it's abstract
export class ArrayCollection<T extends Model> extends Collection<T> {
  public array: object[] = [];

  public clear() {
    this.array.splice(0, this.array.length);
  }

  public async insert(model: T, options: ICollectionInsertOptions = {}) {
    if (options.validate !== false) {
      await model.validate();
    }

    const doc = find(this.array, {[this.modelIdField]: model[this.modelIdField]});
    if (doc) {
      throw new Error('duplicate key error');
    }
    this.array.push(this.toDb(model));
  }

  public async findById(id: string) {
    const doc = find(this.array, {[this.modelIdField]: id});

    if (!doc) {
      return undefined;
    }

    return this.fromDb(doc);
  }
}

import { find } from 'lodash';

import { Collection } from './collection';
import { Model } from './model';

// simple collection with an in-memory array
// note: we can't test Collection directly since it's abstract
export class ArrayCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
  public array: object[] = [];

  public clear() {
    this.array.splice(0, this.array.length);
  }

  public insert(model: TModel) {
    const idProperty = this.model._options.primaryIdProperty;
    const doc = find(this.array, {[idProperty]: model[idProperty]});
    if (doc) {
      throw new Error('duplicate key error');
    }
    this.array.push(this.toDb(model));
  }

  public async findById(id: string) {
    const idProperty = this.model._options.primaryIdProperty;
    const doc = find(this.array, {[idProperty]: id});

    if (!doc) {
      return undefined;
    }

    return this.fromDb(doc);
  }
}

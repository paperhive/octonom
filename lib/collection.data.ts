import { find } from 'lodash';

import { Collection } from './collection';
import { Model } from './model';
import { ModelArray } from './model-array';

// simple collection with an in-memory array
// note: we can't test Collection directly since it's abstract
export class ArrayCollection<T extends object, TModel extends Model<T>> extends Collection<T, TModel> {
  // note: only p
  public array: object[] = [];

  public clear() {
    this.array.splice(0, this.array.length);
  }

  public insert(model: TModel) {
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

  public async findByIds(ids: string[]) {
    const instances = await Promise.all(ids.map(id => this.findById(id)));
    return new ModelArray<T, TModel>(this.model, instances);
  }
}

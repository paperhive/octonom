import { Collection } from './collection';
import { Model } from './model';

export class ReferenceArray<T extends object, TModel extends Model<T>> extends Array<TModel | string> {
  constructor(
    public readonly collection: Collection<T, TModel>,
    data: Array<TModel | string> = [],
  ) {
    super();
    data.forEach(element => this.push(element));
  }

  // TODO: what do we do with undefined? do we overwrite ids with undefined?
  public async populate() {
    const fetchModels = [];
    this.forEach((element, index) => {
      // already populated?
      if (element instanceof this.collection.model) {
        return;
      }

      fetchModels.push({index, id: element});
    });

    // fetch models
    const models = await this.collection.findByIds(fetchModels.map(fetchModel => fetchModel.id));

    fetchModels.forEach((fetchModel, index) => {
      if (!models[index]) {
        throw new Error(`id ${fetchModel.id} not found`);
      }
    });

    // sort models into array
    fetchModels.forEach((fetchModel, index) => {
      this[fetchModel.index] = models[index];
    });
  }
}

export type ReferenceArrayProperty<I extends object, T extends Model<I>> = ReferenceArray<I, T> | Array<string | T>;

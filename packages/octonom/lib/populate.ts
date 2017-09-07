import { SchemaMap, SchemaValue} from './schema';

export type PopulateReference = IPopulateMap | true;

export interface IPopulateMap {
  [k: string]: PopulateReference;
}

// populate an array (modifies the array!)
export async function populateArray(arr: any[], elementSchema: SchemaValue, populateReference: PopulateReference) {
  // throw if this is not a nested population and this is not a reference
  if (populateReference === true && elementSchema.type !== 'reference') {
    throw new Error(`Reference expected but got ${elementSchema.type}`);
  }

  if (elementSchema.type === 'reference') {
    const collection = elementSchema.collection();

    const fetchModels = [];
    arr.forEach((element, index) => {
      // already populated?
      if (element instanceof collection.model) {
        return;
      }

      fetchModels.push({index, id: element});
    });

    // fetch models
    const models = await collection.findByIds(fetchModels.map(fetchModel => fetchModel.id));

    // throw if an id wasn't found
    // reason: otherwise we'd replace the id with undefined and this may get persisted to the db
    fetchModels.forEach((fetchModel, index) => {
      if (!models[index]) {
        throw new Error(`Id ${fetchModel.id} not found`);
      }
    });

    // sort models into array
    fetchModels.forEach((fetchModel, index) => {
      arr[fetchModel.index] = models[index];
    });
  }

  // no nested population
  if (populateReference === true) {
    return arr;
  }

  // nested population: populate elements individually
  await Promise.all(arr.map(async (value, index) => {
    arr[index] = await populateValue(value, elementSchema, populateReference);
  }));

  return arr;
}

// populate an object (modifies the object!)
export async function populateObject(obj: object, schemaMap: SchemaMap, populateMap: IPopulateMap) {
  const populatedResults = {};

  // gather results for all keys
  await Promise.all(Object.keys(populateMap).map(async key => {
    // fail if key is unknown
    if (!schemaMap[key]) {
      throw new Error(`Key ${key} not found in schema.`);
    }

    // ignore undefined properties
    if (obj[key] === undefined) {
      return;
    }

    // set in temp object
    populatedResults[key] = await populateValue(obj[key], schemaMap[key], populateMap[key]);
  }));

  // set in object
  Object.assign(obj, populatedResults);

  return obj;
}

// return populated value (modifies value if possible)
export async function populateValue(value: any, schema: SchemaValue, populateReference: PopulateReference) {
  switch (schema.type) {
    case 'reference': {
      const collection = schema.collection();

      // fetch if value isn't a model instance
      const instance = value instanceof collection.model
        ? value
        : await collection.findById(value);

      if (instance === undefined) {
        throw new Error(`Id ${value} not found.`);
      }

      // nested populate?
      if (populateReference !== true) {
        await populateObject(instance, collection.model.schema, populateReference);
      }

      return instance;
    }

    case 'object':
      if (populateReference === true) {
        throw new Error(`An object cannot be populated with populateReference = true.`);
      }
      return populateObject(value, schema.definition, populateReference);

    case 'array':
      return populateArray(value, schema.definition, populateReference);

    default:
      throw new Error(`Cannot populate type ${schema.type}`);
  }
}

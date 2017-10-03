import { ValidationError } from '../errors';

export interface ISchemaOptions<TOctoInstance extends IOctoInstance<any>> {
  required?: boolean;
  validate?(octoInstance: TOctoInstance): Promise<void>;
}

export type PopulateReference = IPopulateMap | true;

export interface IPopulateMap {
  [k: string]: PopulateReference;
}

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Default is false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Default is false. */
  replace?: boolean;
  /** Parent schema node */
  parent?: IParent;
}

export interface IToObjectOptions {
  /** Turn populated references into references */
  unpopulate?: boolean;
}

export type Path = Array<string | number>;

export interface IOctoInstance<T = any> {
  parent?: IParent;
  value: T;
}

export interface IOctoParentInstance<T = any> extends IOctoInstance<T> {
  beforeChange(path: Path, rawValue: any, oldInstance: IOctoInstance<T>);
  afterChange(path: Path, rawValue: any, newInstance: IOctoInstance<T>);
}

export interface IParent<T = any> {
  instance: IOctoParentInstance<any>;
  path: string | number;
}

export interface IOctoInstanceMap {
  [key: string]: IOctoInstance<any>;
}

export interface ISchema<T, TOctoInstance extends IOctoInstance<T>> {
  options: ISchemaOptions<TOctoInstance>;
  create(value: any, sanitizeOptions: ISanitizeOptions): TOctoInstance;
  populate?(octoInstance: TOctoInstance, populateReference: PopulateReference): Promise<TOctoInstance>;
  toObject(octoInstance: TOctoInstance): T;
  validate(octoInstance: TOctoInstance): Promise<void>;
}

export interface ISchemaMap {
  [key: string]: ISchema<any, any>;
}

export async function validate<TOctoInstance extends IOctoInstance>(
  schemaOptions: ISchemaOptions<TOctoInstance>,
  octoInstance: TOctoInstance,
): Promise<void> {
  if (!schemaOptions.validate) {
    return;
  }

  try {
    await schemaOptions.validate(octoInstance);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.reason = error.reason || 'custom';
      error.parent = octoInstance.parent;
      throw error;
    }
    throw error;
  }
}


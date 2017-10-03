import { ValidationError } from '../errors';

export interface ISchemaOptions<TOctoValue extends OctoValue<any>> {
  required?: boolean;
  validate?(octoValue: TOctoValue): Promise<void>;
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

export interface IOctoValueConstructor<T = any, TOctoValue extends OctoValue<any> = OctoValue<any>> {
  new (value: any, schemaOptions: ISchemaOptions<TOctoValue>, sanitizeOptions: ISanitizeOptions): TOctoValue;
}

/** An OctoValue wraps a value of a specific type.
 *  OctoValue is abstract, see OctoArray, OctoObject, OctoString, ... for
 *  non-abstract classes that are derived from OctoValue. The benefit
 *  of wrapping the value (property 'value') is that the value has
 *  additional metadata. For example, an OctoValue knows if it has a parent
 *  (property 'parent') which is useful for hooks and error messages.
 */
export abstract class OctoValue<T> implements IOctoInstance<T> {
  public value: T;
  public parent: IParent;

  constructor(
    value: any,
    public schemaOptions: ISchemaOptions<OctoValue<T>>,
    sanitizeOptions: ISanitizeOptions,
  ) {
    this.parent = sanitizeOptions.parent;
    this.value = this.sanitize(value, sanitizeOptions);
  }

  /** Populate a value (possibly nested).
   *  Note: do *not* the value property of the current instance inside populate().
   *        This is the responsibility of the parent OctoValue.
   */
  public async populate(populateReference: PopulateReference): Promise<T> {
    throw new Error(`${this.constructor.name} is not populateable.`);
  }

  /** Create a plain object representation of the value. */
  public toObject(options: IToObjectOptions = {}): T {
    return this.value;
  }

  /** Validate a value (e.g., used before saving an instance in a collection).
   *  The default implementation calls a custom validator if there is one provided in the
   *  schema options. Make sure to call this method in derived OctoValue classes.
   */
  public async validate(): Promise<void> {
    if (!this.schemaOptions.validate) {
      return;
    }

    try {
      await this.schemaOptions.validate(this);
    } catch (error) {
      if (error instanceof ValidationError) {
        error.reason = error.reason || 'custom';
        error.value = this;
        throw error;
      }
      throw error;
    }
  }

  // TODO: rename to setValue? (and then also actually set the value instead of in constructor)
  protected abstract sanitize(value: any, sanitizeOptions: ISanitizeOptions): T;
}

export interface IOctoValueMap {
  [key: string]: OctoValue<any>;
}

export interface ISchema {
  create(value: any, sanitizeOptions: ISanitizeOptions): OctoValue<any>;
}

export interface ISchemaMap {
  [key: string]: ISchema;
}

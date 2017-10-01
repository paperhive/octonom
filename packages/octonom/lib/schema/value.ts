import { ValidationError } from '../errors';

export interface ISchemaOptions<TOctoValue> {
  required?: boolean;
  validate?(schema: TOctoValue): Promise<void>;
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

export interface IParentValue<T = any> {
  beforeChange(path: Path, rawValue: any, oldOctoValue: OctoValue<T>);
  afterChange(path: Path, rawValue: any, newOctoValue: OctoValue<T>);
}

export interface IParent<T = any> {
  octoValue: OctoValue<T> & IParentValue<any>;
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
export abstract class OctoValue<T> {
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

  /** Populate a value (possibly nested) */
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

export class OctoFactory<
  TOctoValue extends OctoValue<any>,
  TOptions extends ISchemaOptions<TOctoValue>
> {
  constructor(
    private octoValueClass: IOctoValueConstructor,
    private defaultOptions?: TOptions,
  ) {}

  public create(schemaOptions: TOptions = this.defaultOptions) {
    return (value: any, sanitizeOptions: ISanitizeOptions = {}) => {
      return new this.octoValueClass(value, schemaOptions, sanitizeOptions);
    };
  }
}

export type OctoValueFactory<TOctoValue extends OctoValue<any> = OctoValue<any>> =
  (value: any, sanitizeOptions: ISanitizeOptions) => TOctoValue;

export interface ISchemaMap {
  [field: string]: OctoValueFactory;
}

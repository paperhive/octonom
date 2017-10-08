import { ArrayCollection, Model, Property, Schema } from '../../../lib/main';

export class NestedModel extends Model {
  @Property.String()
  public id: string;

  @Property.String()
  public name: string;
}

export const nestedCollection = new ArrayCollection<NestedModel>(NestedModel, {modelIdField: 'id'});

export class AllModel extends Model {
  @Property.Any()
  public any: any;

  @Property.Array({elementSchema: new Schema.Boolean()})
  public array: boolean[];

  @Property.Boolean()
  public boolean: boolean;

  @Property.Date()
  public date: Date;

  @Property.Model({model: NestedModel})
  public model: NestedModel;

  @Property.Number()
  public number: number;

  @Property.Object({schemaMap: {enabled: new Schema.Boolean()}})
  public object: {enabled: boolean};

  @Property.Reference({collection: () => nestedCollection})
  public reference: string | NestedModel;

  @Property.String()
  public string: string;

  constructor(data?: Partial<AllModel>) {
    super(data);
  }
}

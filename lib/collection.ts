export class MongoCollection {
  constructor(protected name: string, protected model: new (data: any) => any) {}
}

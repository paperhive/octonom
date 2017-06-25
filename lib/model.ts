export function createModel<T>(definition: any) {
  return class {
    constructor(public data: any) {}
  };
}

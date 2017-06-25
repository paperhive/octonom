export function enumerable(value: boolean): PropertyDecorator {
  return (target: any, key: string) => {
    // console.log(target);
    const descriptor = Object.getOwnPropertyDescriptor(target.constructor, key) || {};
    // console.log('desc', descriptor);

    // writable is false by default, so we explicitly set it to true here
    if (descriptor.writable === undefined) {
      descriptor.writable = true;
    }

    if (descriptor.enumerable !== value) {
      descriptor.enumerable = value;
      console.log(key, descriptor);
      Object.defineProperty(target.constructor, key, descriptor);
    }
  };
}

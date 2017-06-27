import { createHash } from 'crypto';
import { forEach } from 'lodash';
import { v1 as uuidV1 } from 'node-uuid';

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
      Object.defineProperty(target.constructor, key, descriptor);
    }
  };
}

export function generateId(): string {
  // alternative 1
  // return base64url(uuid.v4(null, new Buffer(16)));

  // alternative 2: random bytes in base64url
  // const nbytes = 9; // requirement: (nbytes * 8) % 6 === 0
  // return base64url(crypto.randomBytes(nbytes));

  // alternative 3: base64url(shorten(hash(uuid)))
  const nchars = 12; // 2**(nchars*6)
  return createHash('sha1')
    .update(uuidV1()) // set uuid
    .digest('base64') // get base64 hash
    .slice(0, nchars) // shorten
    .replace(/\+/g, '-').replace(/\//g, '_'); // URL-base64
}

export function invertMap(map: {[k: string]: string}) {
  const invertedMap = {};
  forEach(map, (newKey, oldKey) => invertedMap[newKey] = oldKey);
  return invertedMap;
}

export function rename(obj: object, map: {[k: string]: string}) {
  forEach(map, (newKey, oldKey) => {
    const value = obj[oldKey];
    if (!value) {
      return;
    }
    delete obj[oldKey];
    obj[newKey] = value;
  });
}

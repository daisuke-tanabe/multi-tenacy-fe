import { ErrorResponse } from '@/types';

// Object判定する型ガード
// { key: value } なオブジェクトだけで判定し、Array・function・Dateは含まない
export function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && x.constructor === Object;
}

export function isErrorResponse(x: unknown): x is ErrorResponse {
  return isObject(x) && 'error' in x;
}
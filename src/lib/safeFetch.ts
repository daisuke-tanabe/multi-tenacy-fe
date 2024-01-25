export type SafeFetchParams = Parameters<typeof fetch>;

type SafeFetchResult<T, U> = Promise<Response & {
  json: () => Promise<T | U>;
}>;

/**
 * 型安全なfetchメソッド
 */
export function safeFetch<Response extends object, ErrorResponse extends object>(
  ...args: SafeFetchParams
): SafeFetchResult<Response, ErrorResponse> {
  return fetch(...args);
}

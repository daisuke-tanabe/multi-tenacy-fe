import { safeFetch, SafeFetchParams } from './safeFetch';

export function fetchWithHandling<T extends object>(...args: SafeFetchParams): Promise<T> {
  const [url, init] = args;

  return (
    safeFetch<T, any>(url, init)
      // NOTE: ネットワークエラーは前段で処理する
      .catch((error) => {
        console.error(error);
        throw new Error(error);
      })
      // NOTE: レスポンスを処理する
      .then((result) => result.json())
  );
}

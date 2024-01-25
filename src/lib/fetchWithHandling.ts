import { safeFetch, SafeFetchParams } from './safeFetch';
import {ErrorResponseBody} from "@/types";

export function fetchWithHandling<T extends object, U extends ErrorResponseBody = ErrorResponseBody>(...args: SafeFetchParams): Promise<T | U> {
  const [url, init] = args;

  return (
    safeFetch<T, U>(url, init)
      // NOTE: ネットワークエラーは前段で処理する
      .catch((error) => {
        throw new Error(error);
      })
      // NOTE: レスポンスを返却する
      .then((result) => result.json())
  );
}

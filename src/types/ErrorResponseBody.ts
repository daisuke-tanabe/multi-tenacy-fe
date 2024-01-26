/**
 * エラー内容を含んだレスポンス
 */
export type ErrorResponseBody = {
  error: {
    message: string;
    statusCode: number;
    /**
     * InvalidParameterException: 認証に必要なユーザー属性が足りない
     *
     * 確認オペレーション
     * CodeMismatchException: コードがサーバーが期待するものと一致しない
     * NotAuthorizedException: ユーザーが承認されていない
     * https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/cognito-user-pool-managing-errors.html
     */
    name?: 'CodeMismatchException' | 'NotAuthorizedException' | 'InvalidParameterException' | string;
  };
};

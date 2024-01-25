'use client';

type Props = {
  error: Error;
};

export default function Error({ error }: Props) {
  return (
    <>
      <div>システムエラーが発生しました</div>
      <div>{error.message}</div>
    </>
  );
}

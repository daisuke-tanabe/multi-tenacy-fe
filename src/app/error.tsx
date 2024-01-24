'use client';

type Props = {
  error: Error;
};

export default function Error({ error }: Props) {
  return (
    <>
      <div>エラーが発生しました</div>
      <div>{error.message}</div>
    </>
  );
}

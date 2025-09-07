// apps/web/app/auth/check-email/page.tsx
export default function CheckEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; resent?: string };
}) {
  const email = searchParams?.email;
  const resent = searchParams?.resent === '1';

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">이메일을 확인해주세요</h1>
      {resent ? (
        <p>확인 메일을 다시 보냈습니다. 받은 편지함을 확인한 뒤 링크를 클릭하세요.</p>
      ) : (
        <p>
          가입을 완료하려면 이메일로 전송된 확인 링크를 클릭하세요.
          {email ? <> (<b>{email}</b>)</> : null}
        </p>
      )}
      <p className="text-sm text-gray-500">
        메일이 보이지 않으면 스팸함도 확인해 주세요.
      </p>
    </div>
  );
}

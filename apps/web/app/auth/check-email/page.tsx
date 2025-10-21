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
      <h1 className="text-2xl font-semibold">?´ë©”?¼ì„ ?•ì¸?´ì£¼?¸ìš”</h1>
      {resent ? (
        <p>?•ì¸ ë©”ì¼???¤ì‹œ ë³´ëƒˆ?µë‹ˆ?? ë°›ì? ?¸ì??¨ì„ ?•ì¸????ë§í¬ë¥??´ë¦­?˜ì„¸??</p>
      ) : (
        <p>
          ê°€?…ì„ ?„ë£Œ?˜ë ¤ë©??´ë©”?¼ë¡œ ?„ì†¡???•ì¸ ë§í¬ë¥??´ë¦­?˜ì„¸??
          {email ? <> (<b>{email}</b>)</> : null}
        </p>
      )}
      <p className="text-sm text-gray-500">
        ë©”ì¼??ë³´ì´ì§€ ?Šìœ¼ë©??¤íŒ¸?¨ë„ ?•ì¸??ì£¼ì„¸??
      </p>
    </div>
  );
}


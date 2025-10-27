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
      <h1 className="text-2xl font-semibold">?대찓?쇱쓣 ?뺤씤?댁＜?몄슂</h1>
      {resent ? (
        <p>?뺤씤 硫붿씪???ㅼ떆 蹂대깉?듬땲?? 諛쏆? ?몄??⑥쓣 ?뺤씤????留곹겕瑜??대┃?섏꽭??</p>
      ) : (
        <p>
          媛?낆쓣 ?꾨즺?섎젮硫??대찓?쇰줈 ?꾩넚???뺤씤 留곹겕瑜??대┃?섏꽭??
          {email ? <> (<b>{email}</b>)</> : null}
        </p>
      )}
      <p className="text-sm text-gray-500">
        硫붿씪??蹂댁씠吏 ?딆쑝硫??ㅽ뙵?⑤룄 ?뺤씤??二쇱꽭??
      </p>
    </div>
  );
}






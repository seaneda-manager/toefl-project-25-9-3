export const metadata = { title: 'TOEFL Program', description: 'Academy LMS' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko"><body style={{background:'#f7f9fc',margin:0}}>{children}</body></html>
  );
}

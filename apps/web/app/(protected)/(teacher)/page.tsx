export default function TeacherHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <ul className="mt-4 list-disc list-inside text-sm text-gray-700">
        <li><a className="underline" href="/(protected)/(teacher)/reading">Reading 관리</a></li>
        <li><a className="underline" href="/(protected)/(teacher)/listening">Listening 관리</a></li>
        <li><a className="underline" href="/(protected)/(teacher)/speaking">Speaking 관리</a></li>
        <li><a className="underline" href="/(protected)/(teacher)/writing">Writing 관리</a></li>
        <li><a className="underline" href="/(protected)/(teacher)/vocab">Vocab 관리</a></li>
      </ul>
    </main>
  );
}

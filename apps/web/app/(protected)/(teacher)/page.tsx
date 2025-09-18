export default function TeacherHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <ul className="mt-4 list-disc list-inside text-sm text-gray-700">
        <li><a className="underline" href="/(protected)/(teacher)/reading">Reading 愿由?/a></li>
        <li><a className="underline" href="/(protected)/(teacher)/listening">Listening 愿由?/a></li>
        <li><a className="underline" href="/(protected)/(teacher)/speaking">Speaking 愿由?/a></li>
        <li><a className="underline" href="/(protected)/(teacher)/writing">Writing 愿由?/a></li>
        <li><a className="underline" href="/(protected)/(teacher)/vocab">Vocab 愿由?/a></li>
      </ul>
    </main>
  );
}

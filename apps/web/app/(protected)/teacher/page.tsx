export default function TeacherHome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <ul className="mt-4 list-disc list-inside text-sm text-gray-700">
        <li><a className="underline" href="/(protected)/(teacher)/reading">Reading</a></li>
        <li><a className="underline" href="/(protected)/(teacher)/listening">Listening</a></li>
         <li><a className="underline" href="/(protected)/(teacher)/speaking">Speaking</a></li>
         <li><a className="underline" href="/(protected)/(teacher)/writing">Writing</a></li>
         <li><a className="underline" href="/(protected)/(teacher)/vocab">Vocab</a></li>
      </ul>
    </main>
  );
}

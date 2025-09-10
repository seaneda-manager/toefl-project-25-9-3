export default function ListeningIndex() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Listening</h1>
      <ul className="list-disc pl-6 space-y-1">
        <li><a className="underline" href="/listening/study">Study</a></li>
        <li><a className="underline" href="/listening/test">Test</a></li>
      </ul>
    </div>
  );
}

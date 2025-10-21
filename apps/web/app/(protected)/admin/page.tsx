export default function AdminDashboard(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-gray-500">μ½ν…μΈ??ΈνΈ(Reading/Listening)λ¥??μ„±?κ³  κ΄€λ¦¬ν•?Έμ”.</p>
      <ul className="list-disc ml-5 text-sm">
        <li>?Όμª½ ?¤λΉ„κ²μ΄?μ <b>Sets</b>?μ„ ?ΈνΈλ¥??μ„±</li>
        <li>?ΈνΈ ?΄λ???μ§€λ¬??Έλ™, λ¬Έμ , λ³΄κΈ°λ¥?μ°¨λ??€λ΅??°κ²°</li>
      </ul>
    </div>
  );
}

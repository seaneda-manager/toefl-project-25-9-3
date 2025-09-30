export default function FindIdPage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">아이디 찾기</h1>
        <p className="text-gray-700">
          회원가입 시 입력하신 정보로 아이디를 찾을 수 있어요. 본인 확인을 위해{" "}
          <span className="mx-1 font-medium">이름</span>
          을(를) 사용해 주세요.
        </p>
      </div>
    </div>
  );
}

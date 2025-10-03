"use client";

export default function SmokeLaunchReading() {
  const href = "/reading/test?setId=demo-set&mode=study&debug=1";
  return (
    <button
      type="button"
      onClick={() => window.open(href, "_blank", "width=1200,height=800")}
      className="px-3 py-2 rounded-xl border"
    >
      리딩 스모크 테스트 새창 실행
    </button>
  );
}
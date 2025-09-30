export default function Page() {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        Users & Roles
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        예: 계정 생성/비활성화, 역할 부여·변경, 권한 필드(
        <code className="px-1 rounded bg-gray-100 dark:bg-neutral-800">is_admin</code>,{" "}
        <code className="px-1 rounded bg-gray-100 dark:bg-neutral-800">can_produce</code>
        ) 관리.
      </p>
    </div>
  );
}

// apps/web/app/(protected)/admin/users/page.tsx
import UsersManager from "@/app/(protected)/admin/users/UsersManager";

export const dynamic = "force-dynamic"; // 紐⑸줉 理쒖떊 諛섏쁺

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          寃?? ??븷 蹂寃? ?섏씠吏?ㅼ씠?섏쓣 吏?먰빀?덈떎.
        </p>
      </div>
      <UsersManager />
    </div>
  );
}



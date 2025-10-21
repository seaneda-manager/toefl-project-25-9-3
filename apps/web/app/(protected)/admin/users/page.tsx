// apps/web/app/(protected)/admin/users/page.tsx
import UsersManager from "@/app/(protected)/admin/users/UsersManager";

export const dynamic = "force-dynamic"; // ëª©ë¡ ìµœì‹  ë°˜ì˜

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          ê²€?? ??•  ë³€ê²? ?˜ì´ì§€?¤ì´?˜ì„ ì§€?í•©?ˆë‹¤.
        </p>
      </div>
      <UsersManager />
    </div>
  );
}

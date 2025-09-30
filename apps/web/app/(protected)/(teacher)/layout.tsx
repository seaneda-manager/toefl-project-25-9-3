import { ReactNode } from 'react'
import TeacherTopTabs from '@/components/teacher/TeacherTopTabs'
import { requireTeacher } from '@/lib/auth/requireTeacher'


export const dynamic = 'force-dynamic'
export const revalidate = 0


export default async function TeacherLayout({ children }: { children: ReactNode }) {
// ?쒕쾭?먯꽌 沅뚰븳 ?뺤씤 (?녿뒗 寃쎌슦 ?먮윭 ?섏쭚 ???먮윭 ?섏씠吏/由щ떎?대젆??泥섎━)
await requireTeacher()
return (
<div className="mx-auto max-w-6xl px-6 py-6 space-y-4">
<header className="flex items-center justify-between">
<h1 className="text-xl font-semibold">Teacher Mode</h1>
<TeacherTopTabs />
</header>
{children}
</div>
)
}

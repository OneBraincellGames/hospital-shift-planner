import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getLocale } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Nav role={session.user.role} locale={locale} />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}

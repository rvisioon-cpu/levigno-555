import { auth } from "@/auth";
import { getSocialContents, getContentStorage } from "@/app/actions/content";
import ContentDashboard from "@/components/dashboard/content/ContentDashboard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Contenido RRSS - Dashboard Livigno",
};

export default async function ContentPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const role = session.user.role as string;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [contents, storage] = await Promise.all([getSocialContents(), getContentStorage()]);

  // Serializar campos complejos (Date, JSON) para evitar advertencias de hidratación de Next.js
  const serializedContents = contents.map((item) => ({
    id: item.id,
    title: item.title,
    platform: item.platform,
    templateType: item.templateType,
    width: item.width,
    height: item.height,
    aspectRatio: item.aspectRatio,
    prompt: item.prompt || null,
    resultUrl: item.resultUrl || null,
    referenceUrls: item.referenceUrls || [],
    status: item.status,
    createdAt: item.createdAt,
  }));

  return <>
    <div className="mb-4 rounded-xl bg-base-100 p-4 shadow-sm" aria-label="Almacenamiento de contenido">
      <div className="flex justify-between text-sm"><span>Almacenamiento usado</span><span>{storage.usedLabel} / {storage.limitLabel}</span></div>
      <progress className={`progress w-full ${storage.percent >= 90 ? "progress-error" : "progress-warning"}`} value={storage.percent} max={100} />
    </div>
    <ContentDashboard initialContentList={serializedContents} />
  </>;
}

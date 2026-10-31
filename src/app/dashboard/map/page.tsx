import { getLocations } from "@/app/actions/locations";
import { normalizeCategory } from "@/utils/categories";
import MapDashboard from "@/components/dashboard/map/MapDashboard";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MapPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const locations = await getLocations(true); // include inactive ones

  const serializedLocations = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    category: normalizeCategory(loc.category),
    imagePath: loc.imagePath || "",
    longitude: loc.longitude,
    latitude: loc.latitude,
    isActive: loc.isActive ?? true,
    createdAt: loc.createdAt,
  }));

  return <MapDashboard initialLocations={serializedLocations} />;
}

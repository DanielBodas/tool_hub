import { LoadingScreen } from "@/components/LoadingScreen";

export default function DashboardLoading() {
  return (
    <LoadingScreen
      title="Cargando tus herramientas"
      description="Organizando el panel y tus accesos..."
      compact
    />
  );
}

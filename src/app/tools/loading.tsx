import { LoadingScreen } from "@/components/LoadingScreen";

export default function ToolLoading() {
  return (
    <LoadingScreen
      title="Abriendo herramienta"
      description="Comprobando el acceso y preparando el módulo..."
      compact
    />
  );
}

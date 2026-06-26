import Link from "next/link";
import { ArrowRight, Zap, Shield, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
            Todas tus herramientas en{" "}
            <span className="text-blue-600">un solo lugar</span>.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Accede a una suite completa de aplicaciones potentes con un solo
            login. Escalable, seguro y listo para tu equipo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Empezar Ahora <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-muted text-foreground rounded-lg font-bold text-lg hover:opacity-80 transition"
            >
              Saber Más
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            ¿Por qué elegir nuestra plataforma?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Rápido y Fluido</h3>
              <p className="text-muted-foreground">
                Optimizado para ofrecer la mejor experiencia de usuario en cada
                herramienta.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Acceso Seguro</h3>
              <p className="text-muted-foreground">
                Autenticación robusta con Google Auth y acceso de administrador
                mediante código.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Escalable</h3>
              <p className="text-muted-foreground">
                Diseñado para añadir nuevas herramientas sin fricción a medida
                que creces.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

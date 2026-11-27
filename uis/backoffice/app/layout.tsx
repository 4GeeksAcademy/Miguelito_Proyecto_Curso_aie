import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthCore Backoffice",
  description: "Herramientas internas de operaciones de HealthCore.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-mark">H</span>
              <span>HealthCore</span>
            </Link>
            <p className="nav-label">OPERACIONES</p>
            <Link className="nav-link" href="/incidents">Analizador de incidencias</Link>
            <Link className="nav-link" href="/suppliers">Proveedores</Link>
            <div className="side-context"><span /> Datos sintéticos y agregados</div>
            <div className="side-footer"><strong>12 sedes</strong><br />Estados Unidos · Reino Unido</div>
          </aside>
          <main className="main-panel">{children}</main>
        </div>
      </body>
    </html>
  );
}
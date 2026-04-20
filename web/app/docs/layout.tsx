/**
 * Layout minimo para /docs/* — evita heredar el fondo oscuro del layout
 * global que rompe el styling de Swagger UI.
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "white", minHeight: "100vh", color: "#1a1a1a" }}>
      {children}
    </div>
  );
}

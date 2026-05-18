export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-mono text-sm text-aws tracking-wider">
          alfredo.dominguez
        </span>
        <div className="flex items-center gap-5 text-sm text-muted">
          <a href="#arquitecturas" className="hover:text-foreground transition-colors hidden lg:block">
            ☁️ Arquitecturas
          </a>
          <a href="#proyectos" className="hover:text-foreground transition-colors hidden lg:block">
            💻 Proyectos
          </a>
          <a href="#certificaciones" className="hover:text-foreground transition-colors hidden lg:block">
            Certs
          </a>
          <a href="#educacion" className="hover:text-foreground transition-colors hidden lg:block">
            Estudios
          </a>
          <a href="#stack" className="hover:text-foreground transition-colors hidden lg:block">
            Stack
          </a>
          <a href="#contacto" className="hover:text-foreground transition-colors hidden md:block">
            Contacto
          </a>
          <a
            href="https://wa.me/573116534760"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-aws text-black px-3 py-1 rounded font-semibold hover:bg-aws-hover transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </nav>
  );
}

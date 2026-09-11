const opciones = [
  { id: 'mesas', icono: '▱', texto: 'Mesas' },
  { id: 'pedidos', icono: '☷', texto: 'Pedidos' },
  { id: 'reservas', icono: '□', texto: 'Reservas' },
  { id: 'menu', icono: '⋮', texto: 'Menú' },
  { id: 'clientes', icono: '◯', texto: 'Clientes' },
  { id: 'cocina', icono: '⌂', texto: 'Cocina' },
  { id: 'reportes', icono: '▥', texto: 'Reportes' },
  { id: 'configuracion', icono: '⚙', texto: 'Configuración' },
]

function Sidebar({ vistaActual, cambiarVista, conectado }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-leaf">✦</div>

        <div className="brand-name">
          Trattoria
          <br />
          <strong>Bellavista</strong>
        </div>

        <div className="brand-subtitle">CUCINA ITALIANA</div>
      </div>

      <nav className="main-nav">
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className={`nav-item ${
              vistaActual === opcion.id ? 'active' : ''
            }`}
            onClick={() => cambiarVista(opcion.id)}
          >
            <span className="nav-icon">{opcion.icono}</span>
            <span>{opcion.texto}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-illustration" aria-hidden="true">
        <svg viewBox="0 0 260 100">
          <path d="M8 87 C45 50 75 63 102 33 C124 11 159 23 174 47 C195 20 225 37 252 77" />
          <path d="M14 90 H246" />
          <path d="M64 88 V57 L79 45 L94 57 V88" />
          <path d="M185 88 V53 L204 38 L222 53 V88" />
        </svg>
      </div>

      <div className="sidebar-quote">
        <em>
          Buon cibo
          <br />
          migliora la vita
        </em>

        <div className="italy-flag">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="connection">
        <span
          className={`connection-dot ${conectado ? 'ok' : 'error'}`}
        />

        <div>
          <strong>{conectado ? 'Conectado' : 'Sin conexión'}</strong>
          <small>FastAPI · PostgreSQL</small>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import MenuPage from './pages/MenuPage'
import ClientesPage from './pages/ClientesPage'
import { api } from './services/api'

const informacionVistas = {
  mesas: {
    titulo: 'Administración de mesas',
    subtitulo: 'Controla tu restaurante, crea grandes experiencias.',
  },
  pedidos: {
    titulo: 'Gestión de pedidos',
    subtitulo: 'Consulta y administra los pedidos del restaurante.',
  },
  reservas: {
    titulo: 'Gestión de reservas',
    subtitulo: 'Organiza las reservas y disponibilidad de las mesas.',
  },
  menu: {
    titulo: 'Menú del restaurante',
    subtitulo: 'Administra los productos disponibles para los pedidos.',
  },
  clientes: {
    titulo: 'Gestión de clientes',
    subtitulo: 'Consulta y administra la información de los clientes.',
  },
  cocina: {
    titulo: 'Operación de cocina',
    subtitulo: 'Gestiona el estado de preparación de los pedidos.',
  },
  reportes: {
    titulo: 'Reportes del restaurante',
    subtitulo: 'Consulta los indicadores principales de la operación.',
  },
  configuracion: {
    titulo: 'Configuración',
    subtitulo: 'Administra la información general del restaurante.',
  },
}

function App() {
  const [vistaActual, setVistaActual] = useState('mesas')
  const [conectado, setConectado] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api
      .health()
      .then(() => setConectado(true))
      .catch(() => setConectado(false))
      .finally(() => setCargando(false))
  }, [])

  const informacion = informacionVistas[vistaActual]

  return (
    <div className="app-shell">
      <Sidebar
        vistaActual={vistaActual}
        cambiarVista={setVistaActual}
        conectado={conectado}
      />

      <main className="main-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">OPERACIÓN DEL RESTAURANTE</p>

            <h1>{informacion.titulo}</h1>

            <p className="page-subtitle">
              {informacion.subtitulo}
            </p>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="button secondary"
              onClick={() => window.location.reload()}
            >
              ↻ Actualizar
            </button>
          </div>
        </header>

        {vistaActual === 'menu' ? (
          <MenuPage />
        ) : vistaActual === 'clientes' ? (
          <ClientesPage />
        ) : (
          <section className="content-card">
            {cargando ? (
              <p>Consultando el backend...</p>
            ) : conectado ? (
              <>
                <h2>{informacion.titulo}</h2>

                <p>
                  React está conectado correctamente con FastAPI. En esta
                  sección construiremos el módulo de {vistaActual}.
                </p>
              </>
            ) : (
              <>
                <h2>No fue posible conectar con FastAPI</h2>

                <p>
                  Verifica que Docker y el backend estén funcionando.
                </p>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
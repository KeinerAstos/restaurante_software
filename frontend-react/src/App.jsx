import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import MesasPage from './pages/MesasPage'
import PedidosPage from './pages/PedidosPage'
import ReservasPage from './pages/ReservasPage'
import MenuPage from './pages/MenuPage'
import ClientesPage from './pages/ClientesPage'
import CocinaPage from './pages/CocinaPage'
import ReportesPage from './pages/ReportesPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import { api } from './services/api'

const informacionVistas = {
  mesas: {
    titulo: 'Administración de mesas',
    subtitulo:
      'Controla tu restaurante, crea grandes experiencias.',
  },
  pedidos: {
    titulo: 'Gestión de pedidos',
    subtitulo:
      'Consulta y administra los pedidos del restaurante.',
  },
  reservas: {
    titulo: 'Gestión de reservas',
    subtitulo:
      'Organiza las reservas y disponibilidad de las mesas.',
  },
  menu: {
    titulo: 'Menú del restaurante',
    subtitulo:
      'Administra los productos disponibles para los pedidos.',
  },
  clientes: {
    titulo: 'Gestión de clientes',
    subtitulo:
      'Consulta y administra la información de los clientes.',
  },
  cocina: {
    titulo: 'Operación de cocina',
    subtitulo:
      'Gestiona el estado de preparación de los pedidos.',
  },
  reportes: {
    titulo: 'Reportes del restaurante',
    subtitulo:
      'Consulta los indicadores principales de la operación.',
  },
  configuracion: {
    titulo: 'Configuración',
    subtitulo:
      'Administra la información general del restaurante.',
  },
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
}

function formatearHora(fecha) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

function App() {
  const [vistaActual, setVistaActual] = useState('mesas')
  const [conectado, setConectado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [fechaActual, setFechaActual] = useState(
    () => new Date(),
  )

  async function verificarConexion() {
    try {
      setCargando(true)

      await Promise.all([
        api.health(),
        api.healthDatabase(),
      ])

      setConectado(true)
    } catch {
      setConectado(false)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    verificarConexion()
  }, [])

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setFechaActual(new Date())
    }, 30000)

    return () => {
      window.clearInterval(intervalo)
    }
  }, [])

  const informacion =
    informacionVistas[vistaActual] ||
    informacionVistas.mesas

  function mostrarContenido() {
    switch (vistaActual) {
      case 'mesas':
        return (
          <MesasPage cambiarVista={setVistaActual} />
        )

      case 'pedidos':
        return <PedidosPage />

      case 'reservas':
        return (
          <ReservasPage cambiarVista={setVistaActual} />
        )

      case 'menu':
        return <MenuPage />

      case 'clientes':
        return <ClientesPage />

case 'cocina':
  return (
    <CocinaPage cambiarVista={setVistaActual} />
  )

      case 'reportes':
        return <ReportesPage />

      case 'configuracion':
        return <ConfiguracionPage />

      default:
        return (
          <section className="content-card">
            <div className="empty-state">
              La sección seleccionada no existe.
            </div>
          </section>
        )
    }
  }

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
            <p className="eyebrow">
              OPERACIÓN DEL RESTAURANTE
            </p>

            <h1>{informacion.titulo}</h1>

            <p className="page-subtitle">
              {informacion.subtitulo}
            </p>
          </div>

          <div className="header-right">
            <div className="clock-block">
              <span>{formatearFecha(fechaActual)}</span>
              <strong>{formatearHora(fechaActual)}</strong>
            </div>

            <div className="manager-card">
              <div className="manager-avatar">
                G
              </div>

              <div>
                <span>Sesión</span>
                <strong>Gerente</strong>
              </div>
            </div>

            <button
              type="button"
              className="button secondary"
              onClick={() => window.location.reload()}
            >
              ↻ Actualizar
            </button>
          </div>
        </header>

        {!conectado && !cargando ? (
          <section className="content-card">
            <div className="empty-state">
              <h2>
                No fue posible conectar con FastAPI
              </h2>

              <p>
                Verifica que Docker y el backend estén
                funcionando.
              </p>

              <button
                type="button"
                className="button primary"
                onClick={verificarConexion}
              >
                Intentar nuevamente
              </button>
            </div>
          </section>
        ) : (
          mostrarContenido()
        )}
      </main>
    </div>
  )
}

export default App
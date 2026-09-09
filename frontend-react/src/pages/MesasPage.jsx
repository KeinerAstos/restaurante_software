import { useEffect, useState } from 'react'
import MesaDialog from '../components/MesaDialog'
import { api } from '../services/api'

const nombresEstados = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
}

function MesasPage({ cambiarVista }) {
  const [mesas, setMesas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [procesandoMesaId, setProcesandoMesaId] = useState(null)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)

  async function cargarMesas() {
    try {
      setCargando(true)
      setError('')

      const datos = await api.getMesas()
      setMesas(Array.isArray(datos) ? datos : [])
    } catch (err) {
      setError(
        err.message || 'No fue posible consultar las mesas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarMesas()
  }, [])

  function abrirNuevaMesa() {
    setMesaSeleccionada(null)
    setMostrarFormulario(true)
  }

  function abrirEdicion(mesa) {
    setMesaSeleccionada(mesa)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setMesaSeleccionada(null)
  }

  function actualizarLista(mesaGuardada) {
    setMesas((mesasActuales) => {
      const existe = mesasActuales.some(
        (mesa) => mesa.id === mesaGuardada.id,
      )

      if (existe) {
        return mesasActuales.map((mesa) =>
          mesa.id === mesaGuardada.id ? mesaGuardada : mesa,
        )
      }

      return [...mesasActuales, mesaGuardada]
    })

    cerrarFormulario()
  }

  async function cambiarEstado(mesa, nuevoEstado) {
    try {
      setProcesandoMesaId(mesa.id)

      const mesaActualizada = await api.updateMesa(mesa.id, {
        estado: nuevoEstado,
      })

      setMesas((mesasActuales) =>
        mesasActuales.map((item) =>
          item.id === mesa.id ? mesaActualizada : item,
        ),
      )
    } catch (err) {
      window.alert(
        `No fue posible actualizar la mesa: ${
          err.message || 'Error desconocido'
        }`,
      )
    } finally {
      setProcesandoMesaId(null)
    }
  }

  async function abrirPedido(mesa) {
    try {
      setProcesandoMesaId(mesa.id)

      const pedido = await api.createPedido(mesa.id)

      window.alert(
        `Pedido #${pedido.id} creado correctamente para la Mesa ${mesa.numero}.`,
      )

      await cargarMesas()

      if (cambiarVista) {
        cambiarVista('pedidos')
      }
    } catch (err) {
      window.alert(
        `No fue posible abrir el pedido: ${
          err.message || 'Error desconocido'
        }`,
      )
    } finally {
      setProcesandoMesaId(null)
    }
  }

  const textoBusqueda = busqueda.trim().toLowerCase()

  const mesasFiltradas = mesas
    .filter(
      (mesa) =>
        !textoBusqueda ||
        String(mesa.numero).includes(textoBusqueda) ||
        (mesa.ubicacion || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        nombresEstados[mesa.estado]
          ?.toLowerCase()
          .includes(textoBusqueda),
    )
    .sort(
      (mesaA, mesaB) =>
        Number(mesaA.numero) - Number(mesaB.numero),
    )

  const totalActivas = mesas.filter(
    (mesa) => mesa.activo !== false,
  ).length

  const totalLibres = mesas.filter(
    (mesa) => mesa.estado === 'LIBRE',
  ).length

  const totalOcupadas = mesas.filter(
    (mesa) => mesa.estado === 'OCUPADA',
  ).length

  const totalReservadas = mesas.filter(
    (mesa) => mesa.estado === 'RESERVADA',
  ).length

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando mesas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>No fue posible consultar las mesas: {error}</p>

        <button
          type="button"
          className="button primary"
          onClick={cargarMesas}
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <div>
            <span>Mesas activas</span>
            <strong>{totalActivas}</strong>
            <small>Configuradas</small>
          </div>
        </article>

        <article className="stat-card">
          <div>
            <span>Libres</span>
            <strong>{totalLibres}</strong>
            <small>Disponibles ahora</small>
          </div>
        </article>

        <article className="stat-card">
          <div>
            <span>Ocupadas</span>
            <strong>{totalOcupadas}</strong>
            <small>Con comensales</small>
          </div>
        </article>

        <article className="stat-card">
          <div>
            <span>Reservadas</span>
            <strong>{totalReservadas}</strong>
            <small>Reservas vigentes</small>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-toolbar">
          <div>
            <p className="eyebrow">DISTRIBUCIÓN</p>
            <h2>Mesas del restaurante</h2>
          </div>

          <div className="table-actions">
            <input
              className="control search-wide"
              type="search"
              placeholder="Buscar mesa..."
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(evento.target.value)
              }
            />

            <button
              type="button"
              className="button primary"
              onClick={abrirNuevaMesa}
            >
              + Nueva mesa
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {mesasFiltradas.map((mesa) => {
                const procesando = procesandoMesaId === mesa.id

                const puedeAbrirPedido = [
                  'LIBRE',
                  'RESERVADA',
                ].includes(mesa.estado)

                return (
                  <tr key={mesa.id}>
                    <td>
                      <strong>Mesa {mesa.numero}</strong>
                    </td>

                    <td>{mesa.capacidad} personas</td>

                    <td>
                      {mesa.ubicacion || 'Sin ubicación'}
                    </td>

                    <td>
                      <span
                        className={`status-pill status-${mesa.estado}`}
                      >
                        {nombresEstados[mesa.estado] ||
                          mesa.estado}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-chip"
                          disabled={procesando}
                          onClick={() => abrirEdicion(mesa)}
                        >
                          Editar
                        </button>

                        {puedeAbrirPedido && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() => abrirPedido(mesa)}
                          >
                            {procesando
                              ? 'Abriendo...'
                              : 'Abrir pedido'}
                          </button>
                        )}

                        {mesa.estado === 'LIBRE' && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() =>
                              cambiarEstado(
                                mesa,
                                'RESERVADA',
                              )
                            }
                          >
                            Reservar
                          </button>
                        )}

                        {mesa.estado === 'RESERVADA' && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() =>
                              cambiarEstado(mesa, 'LIBRE')
                            }
                          >
                            Liberar reserva
                          </button>
                        )}

                        {mesa.estado === 'OCUPADA' && (
                          <span className="action-disabled">
                            Pedido activo
                          </span>
                        )}

                        {mesa.estado ===
                          'FUERA_DE_SERVICIO' && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() =>
                              cambiarEstado(mesa, 'LIBRE')
                            }
                          >
                            Habilitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {mesasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      No hay mesas que coincidan con la búsqueda.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarFormulario && (
        <MesaDialog
          mesa={mesaSeleccionada}
          cerrar={cerrarFormulario}
          mesaGuardada={actualizarLista}
        />
      )}
    </>
  )
}

export default MesasPage
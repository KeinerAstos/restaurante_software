import { useEffect, useState } from 'react'
import ReservaDialog from '../components/ReservaDialog'
import { api } from '../services/api'

const nombresEstados = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_MESA: 'En mesa',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
}

const estadosEditables = ['PENDIENTE', 'CONFIRMADA']

function formatearFecha(valor) {
  if (!valor) return '—'

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return valor
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

function ReservasPage() {
  const [reservas, setReservas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mesas, setMesas] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)

  async function cargarDatos() {
    try {
      setCargando(true)
      setError('')

      const [datosReservas, datosClientes, datosMesas] =
        await Promise.all([
          api.getReservas(),
          api.getClientes(true),
          api.getMesas(),
        ])

      setReservas(Array.isArray(datosReservas) ? datosReservas : [])
      setClientes(Array.isArray(datosClientes) ? datosClientes : [])
      setMesas(Array.isArray(datosMesas) ? datosMesas : [])
    } catch (err) {
      setError(err.message || 'Ocurrió un error al consultar los datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function abrirNuevaReserva() {
    setReservaSeleccionada(null)
    setMostrarFormulario(true)
  }

  function abrirEdicion(reserva) {
    if (!estadosEditables.includes(reserva.estado)) {
      window.alert(
        `Las reservas en estado ${
          nombresEstados[reserva.estado] || reserva.estado
        } no se pueden modificar.`,
      )
      return
    }

    setReservaSeleccionada(reserva)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setReservaSeleccionada(null)
  }

  function actualizarLista(reservaGuardada) {
    setReservas((reservasActuales) => {
      const existe = reservasActuales.some(
        (reserva) => reserva.id === reservaGuardada.id,
      )

      if (existe) {
        return reservasActuales.map((reserva) =>
          reserva.id === reservaGuardada.id
            ? reservaGuardada
            : reserva,
        )
      }

      return [...reservasActuales, reservaGuardada]
    })

    cerrarFormulario()
  }

  async function cambiarEstado(reserva, nuevoEstado) {
    try {
      const reservaActualizada =
        await api.changeReservationStatus(
          reserva.id,
          nuevoEstado,
        )

      setReservas((reservasActuales) =>
        reservasActuales.map((item) =>
          item.id === reserva.id ? reservaActualizada : item,
        ),
      )
    } catch (err) {
      window.alert(
        `No fue posible cambiar el estado: ${
          err.message || 'Error desconocido'
        }`,
      )
    }
  }

  function obtenerCliente(id) {
    return clientes.find(
      (cliente) => Number(cliente.id) === Number(id),
    )
  }

  function obtenerMesa(id) {
    return mesas.find(
      (mesa) => Number(mesa.id) === Number(id),
    )
  }

  const reservasFiltradas = reservas
    .filter(
      (reserva) =>
        filtroEstado === 'TODOS' ||
        reserva.estado === filtroEstado,
    )
    .sort(
      (reservaA, reservaB) =>
        new Date(reservaB.fecha_hora).getTime() -
        new Date(reservaA.fecha_hora).getTime(),
    )

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando reservas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>No fue posible consultar las reservas: {error}</p>

        <button
          type="button"
          className="button primary"
          onClick={cargarDatos}
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="content-card">
        <div className="section-toolbar">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h2>Reservas registradas</h2>
          </div>

          <div className="table-actions">
            <select
              className="control"
              value={filtroEstado}
              onChange={(evento) =>
                setFiltroEstado(evento.target.value)
              }
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="EN_MESA">En mesa</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="CANCELADA">Canceladas</option>
              <option value="NO_ASISTIO">No asistió</option>
            </select>

            <button
              type="button"
              className="button primary"
              onClick={abrirNuevaReserva}
            >
              + Nueva reserva
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Mesa</th>
                <th>Fecha y hora</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reservasFiltradas.map((reserva) => {
                const cliente = obtenerCliente(reserva.cliente_id)
                const mesa = obtenerMesa(reserva.mesa_id)
                const puedeEditar =
                  estadosEditables.includes(reserva.estado)

                return (
                  <tr key={reserva.id}>
                    <td>
                      <strong>
                        {cliente?.nombre || 'Sin cliente'}
                      </strong>

                      {reserva.observaciones && (
                        <small>{reserva.observaciones}</small>
                      )}
                    </td>

                    <td>
                      Mesa {mesa?.numero || reserva.mesa_id}
                    </td>

                    <td>{formatearFecha(reserva.fecha_hora)}</td>

                    <td>{reserva.personas}</td>

                    <td>
                      <span
                        className={`status-pill status-${reserva.estado}`}
                      >
                        {nombresEstados[reserva.estado] ||
                          reserva.estado}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        {puedeEditar && (
                          <button
                            type="button"
                            className="action-chip"
                            onClick={() => abrirEdicion(reserva)}
                          >
                            Editar
                          </button>
                        )}

                        {reserva.estado === 'PENDIENTE' && (
                          <>
                            <button
                              type="button"
                              className="action-chip"
                              onClick={() =>
                                cambiarEstado(
                                  reserva,
                                  'CONFIRMADA',
                                )
                              }
                            >
                              Confirmar
                            </button>

                            <button
                              type="button"
                              className="action-chip danger"
                              onClick={() =>
                                cambiarEstado(
                                  reserva,
                                  'CANCELADA',
                                )
                              }
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {reserva.estado === 'CONFIRMADA' && (
                          <>
                            <button
                              type="button"
                              className="action-chip"
                              onClick={() =>
                                cambiarEstado(
                                  reserva,
                                  'EN_MESA',
                                )
                              }
                            >
                              Sentar cliente
                            </button>

                            <button
                              type="button"
                              className="action-chip danger"
                              onClick={() =>
                                cambiarEstado(
                                  reserva,
                                  'NO_ASISTIO',
                                )
                              }
                            >
                              No asistió
                            </button>
                          </>
                        )}

                        {reserva.estado === 'EN_MESA' && (
                          <button
                            type="button"
                            className="action-chip"
                            onClick={() =>
                              cambiarEstado(
                                reserva,
                                'COMPLETADA',
                              )
                            }
                          >
                            Completar
                          </button>
                        )}

                        {[
                          'COMPLETADA',
                          'CANCELADA',
                          'NO_ASISTIO',
                        ].includes(reserva.estado) && (
                          <span className="action-disabled">
                            Sin acciones
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {reservasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      No hay reservas para este filtro.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarFormulario && (
        <ReservaDialog
          reserva={reservaSeleccionada}
          clientes={clientes}
          mesas={mesas}
          cerrar={cerrarFormulario}
          reservaGuardada={actualizarLista}
        />
      )}
    </>
  )
}

export default ReservasPage
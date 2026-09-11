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

const estadosEditables = [
  'PENDIENTE',
  'CONFIRMADA',
]

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return valor
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

function ReservasPage({ cambiarVista }) {
  const [reservas, setReservas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mesas, setMesas] = useState([])
  const [filtroEstado, setFiltroEstado] =
    useState('TODOS')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState(null)
  const [
    procesandoReservaId,
    setProcesandoReservaId,
  ] = useState(null)

  async function cargarDatos() {
    try {
      setCargando(true)
      setError('')

      const [
        datosReservas,
        datosClientes,
        datosMesas,
      ] = await Promise.all([
        api.getReservas(),
        api.getClientes(true),
        api.getMesas(),
      ])

      setReservas(
        Array.isArray(datosReservas)
          ? datosReservas
          : [],
      )

      setClientes(
        Array.isArray(datosClientes)
          ? datosClientes
          : [],
      )

      setMesas(
        Array.isArray(datosMesas)
          ? datosMesas
          : [],
      )
    } catch (err) {
      setError(
        err.message ||
          'Ocurrió un error al consultar los datos.',
      )
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
          nombresEstados[reserva.estado] ||
          reserva.estado
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
        (reserva) =>
          Number(reserva.id) ===
          Number(reservaGuardada.id),
      )

      if (existe) {
        return reservasActuales.map((reserva) =>
          Number(reserva.id) ===
          Number(reservaGuardada.id)
            ? reservaGuardada
            : reserva,
        )
      }

      return [...reservasActuales, reservaGuardada]
    })

    cerrarFormulario()
  }

  async function cambiarEstado(
    reserva,
    nuevoEstado,
  ) {
    try {
      setProcesandoReservaId(reserva.id)

      const reservaActualizada =
        await api.changeReservationStatus(
          reserva.id,
          nuevoEstado,
        )

      setReservas((reservasActuales) =>
        reservasActuales.map((item) =>
          Number(item.id) === Number(reserva.id)
            ? reservaActualizada
            : item,
        ),
      )

      await cargarDatos()
    } catch (err) {
      window.alert(
        `No fue posible cambiar el estado: ${
          err.message || 'Error desconocido'
        }`,
      )
    } finally {
      setProcesandoReservaId(null)
    }
  }

  function obtenerCliente(id) {
    return clientes.find(
      (cliente) =>
        Number(cliente.id) === Number(id),
    )
  }

  function obtenerMesa(id) {
    return mesas.find(
      (mesa) => Number(mesa.id) === Number(id),
    )
  }

async function sentarCliente(reserva) {
  const mesa = obtenerMesa(reserva.mesa_id)
  const numeroMesa =
    mesa?.numero || reserva.mesa_id

  if (!mesa) {
    window.alert(
      'No fue posible encontrar la mesa asignada a la reserva.',
    )
    return
  }

  if (mesa.activo === false) {
    window.alert(
      `La Mesa ${numeroMesa} se encuentra inactiva.`,
    )
    return
  }

  if (
    !['LIBRE', 'RESERVADA'].includes(mesa.estado)
  ) {
    window.alert(
      `La Mesa ${numeroMesa} no está disponible. Su estado actual es ${
        mesa.estado || 'desconocido'
      }.`,
    )
    return
  }

  const confirmado = window.confirm(
    `¿Deseas sentar al cliente en la Mesa ${numeroMesa} y abrir un pedido?`,
  )

  if (!confirmado) return

  try {
    setProcesandoReservaId(reserva.id)

    /*
     * Primero se cambia la reserva a EN_MESA.
     * En este momento la mesa todavía está RESERVADA,
     * que es un estado permitido por el backend.
     */
    const reservaActualizada =
      await api.changeReservationStatus(
        reserva.id,
        'EN_MESA',
      )

    /*
     * Después se crea el pedido.
     * La creación del pedido cambia la mesa a OCUPADA.
     */
    const pedidoCreado = await api.createPedido(
      reserva.mesa_id,
    )

    setReservas((reservasActuales) =>
      reservasActuales.map((item) =>
        Number(item.id) === Number(reserva.id)
          ? reservaActualizada
          : item,
      ),
    )

    setMesas((mesasActuales) =>
      mesasActuales.map((item) =>
        Number(item.id) === Number(reserva.mesa_id)
          ? {
              ...item,
              estado: 'OCUPADA',
            }
          : item,
      ),
    )

    window.alert(
      `El cliente fue ubicado en la Mesa ${numeroMesa}. Se creó el pedido #${pedidoCreado.id}.`,
    )

    if (cambiarVista) {
      cambiarVista('pedidos')
    }
  } catch (err) {
    window.alert(
      `No fue posible sentar al cliente: ${
        err.message || 'Error desconocido'
      }`,
    )

    await cargarDatos()
  } finally {
    setProcesandoReservaId(null)
  }
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
        <p>
          No fue posible consultar las reservas:
          {' '}
          {error}
        </p>

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
            <p className="eyebrow">
              AGENDA
            </p>

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
              <option value="TODOS">
                Todos los estados
              </option>

              <option value="PENDIENTE">
                Pendientes
              </option>

              <option value="CONFIRMADA">
                Confirmadas
              </option>

              <option value="EN_MESA">
                En mesa
              </option>

              <option value="COMPLETADA">
                Completadas
              </option>

              <option value="CANCELADA">
                Canceladas
              </option>

              <option value="NO_ASISTIO">
                No asistió
              </option>
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
                const cliente = obtenerCliente(
                  reserva.cliente_id,
                )

                const mesa = obtenerMesa(
                  reserva.mesa_id,
                )

                const puedeEditar =
                  estadosEditables.includes(
                    reserva.estado,
                  )

                const procesando =
                  Number(procesandoReservaId) ===
                  Number(reserva.id)

                return (
                  <tr key={reserva.id}>
                    <td>
                      <strong>
                        {cliente?.nombre ||
                          'Sin cliente'}
                      </strong>

                      {reserva.observaciones && (
                        <small>
                          {reserva.observaciones}
                        </small>
                      )}
                    </td>

                    <td>
                      Mesa{' '}
                      {mesa?.numero ||
                        reserva.mesa_id}
                    </td>

                    <td>
                      {formatearFecha(
                        reserva.fecha_hora,
                      )}
                    </td>

                    <td>{reserva.personas}</td>

                    <td>
                      <span
                        className={`status-pill status-${reserva.estado}`}
                      >
                        {nombresEstados[
                          reserva.estado
                        ] || reserva.estado}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        {puedeEditar && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() =>
                              abrirEdicion(reserva)
                            }
                          >
                            Editar
                          </button>
                        )}

                        {reserva.estado ===
                          'PENDIENTE' && (
                          <>
                            <button
                              type="button"
                              className="action-chip"
                              disabled={procesando}
                              onClick={() =>
                                cambiarEstado(
                                  reserva,
                                  'CONFIRMADA',
                                )
                              }
                            >
                              {procesando
                                ? 'Procesando...'
                                : 'Confirmar'}
                            </button>

                            <button
                              type="button"
                              className="action-chip danger"
                              disabled={procesando}
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

                        {reserva.estado ===
                          'CONFIRMADA' && (
                          <>
                            <button
                              type="button"
                              className="action-chip"
                              disabled={procesando}
                              onClick={() =>
                                sentarCliente(reserva)
                              }
                            >
                              {procesando
                                ? 'Abriendo pedido...'
                                : 'Sentar cliente'}
                            </button>

                            <button
                              type="button"
                              className="action-chip danger"
                              disabled={procesando}
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

                        {reserva.estado ===
                          'EN_MESA' && (
                          <button
                            type="button"
                            className="action-chip"
                            disabled={procesando}
                            onClick={() =>
                              cambiarEstado(
                                reserva,
                                'COMPLETADA',
                              )
                            }
                          >
                            {procesando
                              ? 'Procesando...'
                              : 'Completar'}
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
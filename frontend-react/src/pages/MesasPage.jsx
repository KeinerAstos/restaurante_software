import { useEffect, useState } from 'react'
import MesaDialog from '../components/MesaDialog'
import RestaurantMap from '../components/RestaurantMap'
import { api } from '../services/api'

const nombresEstados = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
}

const nombresZonas = {
  TODAS: 'Todas las áreas',
  TERRAZA: 'Terraza',
  SALON: 'Salón principal',
  BAR: 'Bar',
  RECEPCION: 'Recepción',
  COCINA: 'Cocina',
  VIP: 'Fonda VIP',
  OTRA: 'Otra ubicación',
}

const estadosPedidosActivos = [
  'ABIERTO',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
]

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

function formatearHora(valor) {
  if (!valor) return '—'

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

function MesasPage({ cambiarVista }) {
  const [mesas, setMesas] = useState([])
  const [layouts, setLayouts] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [zonaSeleccionada, setZonaSeleccionada] =
    useState('TODAS')
  const [mesaSeleccionadaId, setMesaSeleccionadaId] =
    useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [procesandoMesaId, setProcesandoMesaId] =
    useState(null)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)
  const [mesaParaEditar, setMesaParaEditar] =
    useState(null)

  async function cargarDatos() {
    try {
      setCargando(true)
      setError('')

      const [
        datosMesas,
        datosLayouts,
        datosPedidos,
      ] = await Promise.all([
        api.getMesas(),
        api.getLayout(),
        api.getPedidos(),
      ])

      const listaMesas = Array.isArray(datosMesas)
        ? datosMesas
        : []

      setMesas(listaMesas)

      setLayouts(
        Array.isArray(datosLayouts)
          ? datosLayouts
          : [],
      )

      setPedidos(
        Array.isArray(datosPedidos)
          ? datosPedidos
          : [],
      )

      setMesaSeleccionadaId((idActual) => {
        const sigueExistiendo = listaMesas.some(
          (mesa) =>
            Number(mesa.id) === Number(idActual),
        )

        if (sigueExistiendo) {
          return idActual
        }

        const primeraMesaActiva = listaMesas.find(
          (mesa) => mesa.activo !== false,
        )

        return primeraMesaActiva?.id || null
      })
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar las mesas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function obtenerLayout(mesaId) {
    return layouts.find(
      (layout) =>
        Number(layout.mesa_id) === Number(mesaId),
    )
  }

  function obtenerPedidoActivo(mesaId) {
    return pedidos.find(
      (pedido) =>
        Number(pedido.mesa_id) === Number(mesaId) &&
        estadosPedidosActivos.includes(pedido.estado),
    )
  }

  function abrirNuevaMesa() {
    setMesaParaEditar(null)
    setMostrarFormulario(true)
  }

  function abrirEdicion(mesa) {
    setMesaParaEditar(mesa)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setMesaParaEditar(null)
  }

  async function actualizarLista(mesaGuardada) {
    cerrarFormulario()
    setMesaSeleccionadaId(mesaGuardada.id)
    await cargarDatos()
  }

  async function cambiarEstado(mesa, nuevoEstado) {
    try {
      setProcesandoMesaId(mesa.id)

      await api.updateMesa(mesa.id, {
        estado: nuevoEstado,
      })

      await cargarDatos()
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
        `Pedido #${pedido.id} creado para la Mesa ${mesa.numero}.`,
      )

      await cargarDatos()

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

  async function moverMesa(
    mesaId,
    posicion,
    guardarEnBackend,
  ) {
    let layoutActualizado

    setLayouts((layoutsActuales) => {
      const existe = layoutsActuales.some(
        (layout) =>
          Number(layout.mesa_id) === Number(mesaId),
      )

      if (existe) {
        return layoutsActuales.map((layout) => {
          if (
            Number(layout.mesa_id) !== Number(mesaId)
          ) {
            return layout
          }

          layoutActualizado = {
            ...layout,
            ...posicion,
          }

          return layoutActualizado
        })
      }

      layoutActualizado = {
        mesa_id: mesaId,
        zona: 'OTRA',
        forma: 'ROUND',
        ...posicion,
      }

      return [...layoutsActuales, layoutActualizado]
    })

    if (!guardarEnBackend) return

    try {
      const layout =
        layoutActualizado || obtenerLayout(mesaId)

      await api.updateLayoutMesa(mesaId, {
        zona: layout?.zona || 'OTRA',
        forma: layout?.forma || 'ROUND',
        pos_x: posicion.pos_x,
        pos_y: posicion.pos_y,
      })
    } catch (err) {
      window.alert(
        `No fue posible guardar la posición: ${
          err.message || 'Error desconocido'
        }`,
      )

      await cargarDatos()
    }
  }

  const mesaSeleccionada = mesas.find(
    (mesa) =>
      Number(mesa.id) === Number(mesaSeleccionadaId),
  )

  const layoutMesaSeleccionada = mesaSeleccionada
    ? obtenerLayout(mesaSeleccionada.id)
    : null

  const pedidoMesaSeleccionada = mesaSeleccionada
    ? obtenerPedidoActivo(mesaSeleccionada.id)
    : null

  const textoBusqueda =
    busqueda.trim().toLowerCase()

  const mesasFiltradas = mesas
    .filter((mesa) => {
      const layout = obtenerLayout(mesa.id)
      const zona = layout?.zona || 'OTRA'

      const coincideTexto =
        !textoBusqueda ||
        String(mesa.numero).includes(textoBusqueda) ||
        String(mesa.ubicacion || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        String(
          nombresEstados[mesa.estado] || '',
        )
          .toLowerCase()
          .includes(textoBusqueda)

      const coincideZona =
        zonaSeleccionada === 'TODAS' ||
        zona === zonaSeleccionada

      return coincideTexto && coincideZona
    })
    .sort(
      (mesaA, mesaB) =>
        Number(mesaA.numero) -
        Number(mesaB.numero),
    )

  const pedidosRecientes = [...pedidos]
    .sort(
      (pedidoA, pedidoB) =>
        new Date(pedidoB.created_at).getTime() -
        new Date(pedidoA.created_at).getTime(),
    )
    .slice(0, 5)

  const totalActivas = mesas.filter(
    (mesa) => mesa.activo !== false,
  ).length

  const totalLibres = mesas.filter(
    (mesa) => mesa.estado === 'LIBRE',
  ).length

  const totalOcupadas = mesas.filter(
    (mesa) => mesa.estado === 'OCUPADA',
  ).length

  const totalPedidosActivos = pedidos.filter(
    (pedido) =>
      estadosPedidosActivos.includes(pedido.estado),
  ).length

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando mesas y distribución...
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
          onClick={cargarDatos}
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
          <div className="stat-icon brown">
            ▱
          </div>

          <div>
            <span>Mesas activas</span>
            <strong>{totalActivas}</strong>
            <small>Configuradas</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon green">
            ▣
          </div>

          <div>
            <span>Libres</span>
            <strong>{totalLibres}</strong>
            <small>Disponibles ahora</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon red">
            ●
          </div>

          <div>
            <span>Ocupadas</span>
            <strong>{totalOcupadas}</strong>
            <small>Con comensales</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon gold">
            ⌂
          </div>

          <div>
            <span>Pedidos activos</span>
            <strong>{totalPedidosActivos}</strong>
            <small>En operación</small>
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <div>
          <section className="floor-card">
            <div className="floor-toolbar">
              <div className="legend">
                <span>
                  <i className="legend-dot libre" />
                  Libre
                </span>

                <span>
                  <i className="legend-dot ocupada" />
                  Ocupada
                </span>

                <span>
                  <i className="legend-dot reservada" />
                  Reservada
                </span>

                <span>
                  <i className="legend-dot fuera" />
                  Fuera de servicio
                </span>
              </div>

              <div className="floor-filters">
                <button
                  type="button"
                  className={`mini-button ${
                    modoEdicion ? 'active' : ''
                  }`}
                  onClick={() =>
                    setModoEdicion((actual) => !actual)
                  }
                >
                  {modoEdicion
                    ? 'Terminar edición'
                    : 'Editar plano'}
                </button>

                <select
                  className="control"
                  value={zonaSeleccionada}
                  onChange={(evento) =>
                    setZonaSeleccionada(
                      evento.target.value,
                    )
                  }
                >
                  {Object.entries(nombresZonas).map(
                    ([valor, nombre]) => (
                      <option
                        key={valor}
                        value={valor}
                      >
                        {nombre}
                      </option>
                    ),
                  )}
                </select>

                <input
                  className="control search"
                  type="search"
                  placeholder="Buscar mesa..."
                  value={busqueda}
                  onChange={(evento) =>
                    setBusqueda(evento.target.value)
                  }
                />
              </div>
            </div>

            {modoEdicion && (
              <div className="layout-banner">
                Modo edición activado: arrastra las mesas
                para modificar su posición.
              </div>
            )}

            <RestaurantMap
              mesas={mesas}
              layouts={layouts}
              mesaSeleccionadaId={mesaSeleccionadaId}
              seleccionarMesa={setMesaSeleccionadaId}
              modoEdicion={modoEdicion}
              moverMesa={moverMesa}
              busqueda={busqueda}
              zonaSeleccionada={zonaSeleccionada}
            />
          </section>

          <section className="content-card mesas-table-card">
            <div className="section-toolbar">
              <div>
                <p className="eyebrow">
                  LISTADO
                </p>

                <h2>Mesas del restaurante</h2>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={abrirNuevaMesa}
              >
                + Nueva mesa
              </button>
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
                    const procesando =
                      procesandoMesaId === mesa.id

                    const puedeAbrirPedido = [
                      'LIBRE',
                      'RESERVADA',
                    ].includes(mesa.estado)

                    return (
                      <tr key={mesa.id}>
                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              setMesaSeleccionadaId(mesa.id)
                            }
                          >
                            Mesa {mesa.numero}
                          </button>
                        </td>

                        <td>
                          {mesa.capacidad} personas
                        </td>

                        <td>
                          {mesa.ubicacion ||
                            'Sin ubicación'}
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
                              onClick={() =>
                                abrirEdicion(mesa)
                              }
                            >
                              Editar
                            </button>

                            {puedeAbrirPedido && (
                              <button
                                type="button"
                                className="action-chip"
                                disabled={procesando}
                                onClick={() =>
                                  abrirPedido(mesa)
                                }
                              >
                                Abrir pedido
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

                            {mesa.estado ===
                              'RESERVADA' && (
                              <button
                                type="button"
                                className="action-chip"
                                disabled={procesando}
                                onClick={() =>
                                  cambiarEstado(
                                    mesa,
                                    'LIBRE',
                                  )
                                }
                              >
                                Liberar
                              </button>
                            )}

                            {mesa.estado ===
                              'FUERA_DE_SERVICIO' && (
                              <button
                                type="button"
                                className="action-chip"
                                disabled={procesando}
                                onClick={() =>
                                  cambiarEstado(
                                    mesa,
                                    'LIBRE',
                                  )
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
                          No hay mesas para los filtros
                          seleccionados.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="details-column">
          <section className="selected-card">
            {mesaSeleccionada ? (
              <>
                <div className="selected-hero">
                  <div>
                    <span className="eyebrow light">
                      {nombresZonas[
                        layoutMesaSeleccionada?.zona ||
                          'OTRA'
                      ]?.toUpperCase()}
                    </span>

                    <h2>
                      Mesa {mesaSeleccionada.numero}
                    </h2>

                    <p>
                      {mesaSeleccionada.capacidad}
                      {' '}
                      personas ·{' '}
                      {nombresEstados[
                        mesaSeleccionada.estado
                      ]}
                    </p>
                  </div>
                </div>

                <div className="selected-body">
                  <div className="selected-topline">
                    <span
                      className={`status-pill status-${mesaSeleccionada.estado}`}
                    >
                      {nombresEstados[
                        mesaSeleccionada.estado
                      ]}
                    </span>

                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        abrirEdicion(mesaSeleccionada)
                      }
                    >
                      Editar mesa
                    </button>
                  </div>

                  <div className="info-list">
                    <div className="info-line">
                      <span>◉</span>

                      <span>
                        <strong>
                          {mesaSeleccionada.capacidad}
                        </strong>
                        {' '}
                        personas de capacidad
                      </span>
                    </div>

                    <div className="info-line">
                      <span>⌖</span>

                      <span>
                        {mesaSeleccionada.ubicacion ||
                          nombresZonas[
                            layoutMesaSeleccionada?.zona ||
                              'OTRA'
                          ]}
                      </span>
                    </div>

                    <div className="info-line">
                      <span>⌂</span>

                      <span>
                        {pedidoMesaSeleccionada
                          ? `Pedido #${pedidoMesaSeleccionada.id} · ${pedidoMesaSeleccionada.estado}`
                          : 'Sin pedido activo'}
                      </span>
                    </div>
                  </div>

                  <div className="selected-actions">
                    {pedidoMesaSeleccionada ? (
                      <button
                        type="button"
                        className="button primary full"
                        onClick={() =>
                          cambiarVista?.('pedidos')
                        }
                      >
                        Ver pedido activo
                      </button>
                    ) : (
                      <>
                        {mesaSeleccionada.estado ===
                          'LIBRE' && (
                          <button
                            type="button"
                            className="button secondary full"
                            onClick={() =>
                              cambiarEstado(
                                mesaSeleccionada,
                                'RESERVADA',
                              )
                            }
                          >
                            Reservar mesa manualmente
                          </button>
                        )}

                        {mesaSeleccionada.estado ===
                          'RESERVADA' && (
                          <button
                            type="button"
                            className="button secondary full"
                            onClick={() =>
                              cambiarEstado(
                                mesaSeleccionada,
                                'LIBRE',
                              )
                            }
                          >
                            Liberar reserva manual
                          </button>
                        )}

                        {[
                          'LIBRE',
                          'RESERVADA',
                        ].includes(
                          mesaSeleccionada.estado,
                        ) && (
                          <button
                            type="button"
                            className="button primary full"
                            onClick={() =>
                              abrirPedido(
                                mesaSeleccionada,
                              )
                            }
                          >
                            Abrir pedido
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="selected-hero">
                  <div>
                    <span className="eyebrow light">
                      SELECCIÓN ACTUAL
                    </span>

                    <h2>Selecciona una mesa</h2>

                    <p>
                      Haz clic sobre una mesa del plano.
                    </p>
                  </div>
                </div>

                <div className="selected-empty">
                  <div className="empty-table-icon">
                    ▱
                  </div>

                  <strong>Plano interactivo</strong>

                  <span>
                    La información de la mesa aparecerá
                    aquí.
                  </span>
                </div>
              </>
            )}
          </section>

          <section className="recent-card">
            <div className="card-heading">
              <h3>Pedidos recientes</h3>

              <button
                type="button"
                className="text-button"
                onClick={() =>
                  cambiarVista?.('pedidos')
                }
              >
                Ver todos
              </button>
            </div>

            <div className="recent-orders">
              {pedidosRecientes.map((pedido) => (
                <button
                  key={pedido.id}
                  type="button"
                  className="recent-order"
                  onClick={() =>
                    setMesaSeleccionadaId(
                      pedido.mesa_id,
                    )
                  }
                >
                  <span
                    className={`dot ${
                      estadosPedidosActivos.includes(
                        pedido.estado,
                      )
                        ? 'active'
                        : pedido.estado === 'PAGADO'
                          ? 'done'
                          : ''
                    }`}
                  />

                  <span>
                    <strong>
                      #{pedido.id} · Mesa{' '}
                      {mesas.find(
                        (mesa) =>
                          Number(mesa.id) ===
                          Number(pedido.mesa_id),
                      )?.numero || pedido.mesa_id}
                    </strong>

                    <span>
                      {pedido.estado} ·{' '}
                      {formatearDinero(pedido.total)}
                    </span>
                  </span>

                  <time>
                    {formatearHora(
                      pedido.created_at,
                    )}
                  </time>
                </button>
              ))}

              {pedidosRecientes.length === 0 && (
                <div className="empty-state">
                  Sin pedidos registrados.
                </div>
              )}
            </div>
          </section>
        </aside>
      </section>

      {mostrarFormulario && (
        <MesaDialog
          mesa={mesaParaEditar}
          cerrar={cerrarFormulario}
          mesaGuardada={actualizarLista}
        />
      )}
    </>
  )
}

export default MesasPage
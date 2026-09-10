import { useEffect, useState } from 'react'
import { api } from '../services/api'

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

function esDeHoy(valor) {
  if (!valor) return false

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return false
  }

  const hoy = new Date()

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  )
}

function ReportesPage() {
  const [reporte, setReporte] = useState({})
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] =
    useState(false)
  const [error, setError] = useState('')

  async function cargarReportes(
    mostrarCarga = true,
  ) {
    try {
      if (mostrarCarga) {
        setCargando(true)
      } else {
        setActualizando(true)
      }

      setError('')

      const [
        datosReporte,
        datosProductos,
        datosPedidos,
        datosMesas,
      ] = await Promise.all([
        api.getReportDashboard(),
        api.getReportProductos(10),
        api.getPedidos(),
        api.getMesas(),
      ])

      setReporte(datosReporte || {})

      setProductos(
        Array.isArray(datosProductos)
          ? datosProductos
          : [],
      )

      setPedidos(
        Array.isArray(datosPedidos)
          ? datosPedidos
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
          'No fue posible consultar los reportes.',
      )
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [])

  const productosConVentas = productos.filter(
    (producto) =>
      Number(producto.unidades || 0) > 0,
  )

  const maximoUnidades = Math.max(
    1,
    ...productosConVentas.map((producto) =>
      Number(producto.unidades || 0),
    ),
  )

  const pedidosHoy = pedidos.filter((pedido) =>
    esDeHoy(pedido.created_at),
  )

  const pedidosFinalizadosHoy =
    pedidosHoy.filter((pedido) =>
      ['PAGADO', 'ENTREGADO'].includes(
        pedido.estado,
      ),
    )

  const pedidosActivos = pedidos.filter(
    (pedido) =>
      !['PAGADO', 'CANCELADO'].includes(
        pedido.estado,
      ),
  )

  const mesasActivas = mesas.filter(
    (mesa) => mesa.activo !== false,
  )

  const mesasOcupadas = mesasActivas.filter(
    (mesa) => mesa.estado === 'OCUPADA',
  )

  const porcentajeOcupacion =
    mesasActivas.length > 0
      ? Math.round(
          (mesasOcupadas.length /
            mesasActivas.length) *
            100,
        )
      : 0

  const ventasProductos =
    productosConVentas.reduce(
      (total, producto) =>
        total + Number(producto.ventas || 0),
      0,
    )

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando reportes...
      </div>
    )
  }

  if (error && !reporte) {
    return (
      <div className="empty-state">
        <p>
          No fue posible consultar los reportes:
          {' '}
          {error}
        </p>

        <button
          type="button"
          className="button primary"
          onClick={() => cargarReportes()}
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="report-header-card">
        <div>
          <p className="eyebrow">
            RESUMEN DEL DÍA
          </p>

          <h2>Estado general del restaurante</h2>

          <p>
            Ventas, pedidos, reservas y ocupación
            actual.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          disabled={actualizando}
          onClick={() => cargarReportes(false)}
        >
          {actualizando
            ? 'Actualizando...'
            : '↻ Actualizar datos'}
        </button>
      </section>

      {error && (
        <p className="form-error">
          No fue posible actualizar los indicadores:
          {' '}
          {error}
        </p>
      )}

      <section className="reports-grid">
        <article className="report-metric sales">
          <div className="report-metric-icon">
            $
          </div>

          <div>
            <span>Ventas de hoy</span>

            <strong>
              {formatearDinero(
                reporte?.ventas_hoy,
              )}
            </strong>

            <small>
              Ingresos confirmados
            </small>
          </div>
        </article>

        <article className="report-metric orders">
          <div className="report-metric-icon">
            ◫
          </div>

          <div>
            <span>Pedidos de hoy</span>

            <strong>{pedidosHoy.length}</strong>

            <small>
              {pedidosFinalizadosHoy.length}
              {' '}
              finalizados
            </small>
          </div>
        </article>

        <article className="report-metric average">
          <div className="report-metric-icon">
            ◈
          </div>

          <div>
            <span>Ticket promedio</span>

            <strong>
              {formatearDinero(
                reporte?.ticket_promedio,
              )}
            </strong>

            <small>
              Promedio por pedido pagado
            </small>
          </div>
        </article>

        <article className="report-metric bookings">
          <div className="report-metric-icon">
            ◷
          </div>

          <div>
            <span>Reservas de hoy</span>

            <strong>
              {reporte?.reservas_hoy ?? 0}
            </strong>

            <small>
              Reservas registradas
            </small>
          </div>
        </article>
      </section>

      <section className="reports-secondary-grid">
        <article className="report-small-card">
          <span>Pedidos activos</span>
          <strong>{pedidosActivos.length}</strong>
          <small>En atención actualmente</small>
        </article>

        <article className="report-small-card">
          <span>Mesas ocupadas</span>

          <strong>
            {mesasOcupadas.length}
            {' / '}
            {mesasActivas.length}
          </strong>

          <small>
            {porcentajeOcupacion}% de ocupación
          </small>
        </article>

        <article className="report-small-card">
          <span>Ventas por productos</span>

          <strong>
            {formatearDinero(
              ventasProductos,
            )}
          </strong>

          <small>
            Acumulado del ranking
          </small>
        </article>
      </section>

      <section className="reports-layout">
        <article className="content-card">
          <div className="section-toolbar">
            <div>
              <p className="eyebrow">
                PRODUCTOS
              </p>

              <h2>Productos más vendidos</h2>

              <p>
                Clasificación por unidades y valor
                vendido.
              </p>
            </div>
          </div>

          <div className="ranking">
            {productosConVentas.map(
              (producto, indice) => {
                const unidades = Number(
                  producto.unidades || 0,
                )

                const porcentaje = Math.max(
                  4,
                  (unidades / maximoUnidades) *
                    100,
                )

                return (
                  <div
                    className="rank-row"
                    key={
                      producto.producto_id ||
                      producto.id ||
                      producto.nombre
                    }
                  >
                    <span className="rank-position">
                      {indice + 1}
                    </span>

                    <div className="rank-product">
                      <div className="rank-label">
                        <strong>
                          {producto.nombre}
                        </strong>

                        <span>
                          {formatearDinero(
                            producto.ventas,
                          )}
                        </span>
                      </div>

                      <div className="rank-track">
                        <div
                          className="rank-bar"
                          style={{
                            width: `${porcentaje}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="rank-value">
                      {unidades} uds.
                    </span>
                  </div>
                )
              },
            )}

            {productosConVentas.length === 0 && (
              <div className="empty-state">
                Todavía no hay información de
                ventas.
              </div>
            )}
          </div>
        </article>

        <article className="content-card highlight-card">
          <p className="eyebrow">
            DESTACADOS
          </p>

          <h2>Resumen operativo</h2>

          <div className="highlight-block">
            <span>Mesa más utilizada</span>

            <strong>
              {reporte?.mesa_mas_utilizada
                ? `Mesa ${reporte.mesa_mas_utilizada.numero}`
                : 'Sin información'}
            </strong>

            {reporte?.mesa_mas_utilizada && (
              <small>
                {
                  reporte.mesa_mas_utilizada
                    .pedidos
                }
                {' '}
                pedidos registrados
              </small>
            )}
          </div>

          <div className="highlight-block">
            <span>Producto más vendido</span>

            <strong>
              {reporte?.producto_mas_vendido
                ?.nombre || 'Sin información'}
            </strong>

            {reporte?.producto_mas_vendido && (
              <small>
                {
                  reporte.producto_mas_vendido
                    .cantidad
                }
                {' '}
                unidades vendidas
              </small>
            )}
          </div>

          <div className="occupancy-summary">
            <div className="occupancy-heading">
              <span>Ocupación actual</span>
              <strong>
                {porcentajeOcupacion}%
              </strong>
            </div>

            <div className="occupancy-track">
              <div
                className="occupancy-bar"
                style={{
                  width: `${porcentajeOcupacion}%`,
                }}
              />
            </div>

            <small>
              {mesasOcupadas.length} de{' '}
              {mesasActivas.length} mesas activas
            </small>
          </div>
        </article>
      </section>
    </>
  )
}

export default ReportesPage
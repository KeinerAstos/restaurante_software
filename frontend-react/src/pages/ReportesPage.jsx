import { useEffect, useState } from 'react'
import { api } from '../services/api'

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

function ReportesPage() {
  const [reporte, setReporte] = useState(null)
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  async function cargarReportes() {
    try {
      setCargando(true)
      setError('')

      const [datosReporte, datosProductos] =
        await Promise.all([
          api.getReportDashboard(),
          api.getReportProductos(10),
        ])

      setReporte(datosReporte || {})

      setProductos(
        Array.isArray(datosProductos)
          ? datosProductos
          : [],
      )
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar los reportes.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [])

  const maximoUnidades = Math.max(
    1,
    ...productos.map((producto) =>
      Number(producto.unidades || 0),
    ),
  )

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando reportes...
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>No fue posible consultar los reportes: {error}</p>

        <button
          type="button"
          className="button primary"
          onClick={cargarReportes}
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="reports-grid">
        <article className="report-metric">
          <span>Ventas de hoy</span>

          <strong>
            {formatearDinero(reporte?.ventas_hoy)}
          </strong>

          <small>Ingresos registrados</small>
        </article>

        <article className="report-metric">
          <span>Pedidos de hoy</span>

          <strong>
            {reporte?.pedidos_hoy ?? 0}
          </strong>

          <small>Pedidos atendidos</small>
        </article>

        <article className="report-metric">
          <span>Ticket promedio</span>

          <strong>
            {formatearDinero(reporte?.ticket_promedio)}
          </strong>

          <small>Promedio por pedido</small>
        </article>

        <article className="report-metric">
          <span>Reservas de hoy</span>

          <strong>
            {reporte?.reservas_hoy ?? 0}
          </strong>

          <small>Reservas registradas</small>
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
                Clasificación por unidades vendidas.
              </p>
            </div>

            <button
              type="button"
              className="button secondary"
              onClick={cargarReportes}
            >
              ↻ Actualizar
            </button>
          </div>

          <div className="ranking">
            {productos.map((producto) => {
              const unidades = Number(
                producto.unidades || 0,
              )

              const porcentaje = Math.max(
                4,
                (unidades / maximoUnidades) * 100,
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
                  <strong>{producto.nombre}</strong>

                  <div className="rank-track">
                    <div
                      className="rank-bar"
                      style={{
                        width: `${porcentaje}%`,
                      }}
                    />
                  </div>

                  <span className="rank-value">
                    {unidades} uds.
                  </span>
                </div>
              )
            })}

            {productos.length === 0 && (
              <div className="empty-state">
                Todavía no hay información de ventas.
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
                ? `Mesa ${
                    reporte.mesa_mas_utilizada.numero
                  }`
                : 'Sin información'}
            </strong>

            {reporte?.mesa_mas_utilizada && (
              <small>
                {reporte.mesa_mas_utilizada.pedidos}
                {' '}
                pedidos
              </small>
            )}
          </div>

          <div className="highlight-block">
            <span>Producto más vendido</span>

            <strong>
              {reporte?.producto_mas_vendido?.nombre ||
                'Sin información'}
            </strong>

            {reporte?.producto_mas_vendido && (
              <small>
                {reporte.producto_mas_vendido.cantidad}
                {' '}
                unidades
              </small>
            )}
          </div>
        </article>
      </section>
    </>
  )
}

export default ReportesPage
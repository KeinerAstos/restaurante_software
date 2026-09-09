import { useEffect, useState } from 'react'
import PedidoDialog from '../components/PedidoDialog'
import { api } from '../services/api'

const estadosActivos = [
  'ABIERTO',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
]

const nombresEstados = {
  ABIERTO: 'Abierto',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
}

const siguienteEstado = {
  ABIERTO: 'EN_PREPARACION',
  EN_PREPARACION: 'LISTO',
  LISTO: 'ENTREGADO',
  ENTREGADO: 'PAGADO',
}

const textoSiguienteEstado = {
  ABIERTO: 'Enviar a cocina',
  EN_PREPARACION: 'Marcar listo',
  LISTO: 'Marcar entregado',
  ENTREGADO: 'Cerrar y pagar',
}

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

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

function PedidosPage() {
  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] =
    useState(null)

  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [error, setError] = useState('')

  async function cargarDatos() {
    try {
      setCargando(true)
      setError('')

      const [datosPedidos, datosMesas] = await Promise.all([
        api.getPedidos(),
        api.getMesas(),
      ])

      setPedidos(
        Array.isArray(datosPedidos) ? datosPedidos : [],
      )

      setMesas(
        Array.isArray(datosMesas) ? datosMesas : [],
      )
    } catch (err) {
      setError(
        err.message || 'No fue posible consultar los pedidos.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  function obtenerNumeroMesa(mesaId) {
    const mesa = mesas.find(
      (item) => Number(item.id) === Number(mesaId),
    )

    return mesa?.numero ?? mesaId
  }

  function abrirDetalle(pedido) {
    setPedidoSeleccionadoId(pedido.id)
    setMostrarDetalle(true)
  }

  function cerrarDetalle() {
    setMostrarDetalle(false)
    setPedidoSeleccionadoId(null)
  }

  function actualizarPedidoEnLista(pedidoActualizado) {
    setPedidos((pedidosActuales) =>
      pedidosActuales.map((pedido) =>
        pedido.id === pedidoActualizado.id
          ? pedidoActualizado
          : pedido,
      ),
    )
  }

  async function cambiarEstado(pedido, nuevoEstado) {
    if (nuevoEstado === 'PAGADO') {
      if (Number(pedido.total || 0) <= 0) {
        window.alert(
          'No se puede cerrar el pedido porque todavía no tiene productos.',
        )

        return
      }

      const confirmarPago = window.confirm(
        `¿Confirmas el pago del pedido #${
          pedido.id
        } por ${formatearDinero(pedido.total)}?`,
      )

      if (!confirmarPago) {
        return
      }
    }

    try {
      setActualizandoId(pedido.id)

      const pedidoActualizado =
        await api.changeOrderStatus(
          pedido.id,
          nuevoEstado,
        )

      actualizarPedidoEnLista(pedidoActualizado)

      if (nuevoEstado === 'PAGADO') {
        window.alert(
          `Pago registrado correctamente.\nPedido #${
            pedido.id
          }\nTotal: ${formatearDinero(
            pedidoActualizado.total,
          )}`,
        )
      }
    } catch (err) {
      window.alert(
        `No fue posible actualizar el pedido: ${
          err.message || 'Error desconocido'
        }`,
      )
    } finally {
      setActualizandoId(null)
    }
  }

  async function cancelarPedido(pedido) {
    const confirmado = window.confirm(
      `¿Deseas cancelar el pedido #${pedido.id}?`,
    )

    if (!confirmado) {
      return
    }

    await cambiarEstado(pedido, 'CANCELADO')
  }

  const pedidosOrdenados = [...pedidos].sort(
    (pedidoA, pedidoB) =>
      new Date(pedidoB.created_at).getTime() -
      new Date(pedidoA.created_at).getTime(),
  )

  const pedidosActivos = pedidosOrdenados.filter(
    (pedido) => estadosActivos.includes(pedido.estado),
  )

  const historialPedidos = pedidosOrdenados.filter(
    (pedido) => !estadosActivos.includes(pedido.estado),
  )

  function renderizarPedido(pedido, permitirAcciones) {
    const proximoEstado =
      siguienteEstado[pedido.estado]

    const actualizando =
      actualizandoId === pedido.id

    return (
      <article
        className="order-card"
        key={pedido.id}
      >
        <span className="number">
          #{pedido.id}
        </span>

        <span className="order-card-info">
          <strong>
            Mesa {obtenerNumeroMesa(pedido.mesa_id)}
          </strong>

          <span>
            {nombresEstados[pedido.estado] ||
              pedido.estado}

            {' · '}

            {formatearFecha(pedido.created_at)}
          </span>
        </span>

        <span className="amount">
          {formatearDinero(pedido.total)}
        </span>

        <div className="order-card-actions">
          {permitirAcciones && (
            <>
              <button
                type="button"
                className="action-chip"
                disabled={actualizando}
                onClick={() => abrirDetalle(pedido)}
              >
                Ver pedido
              </button>

              {proximoEstado && (
                <button
                  type="button"
                  className="action-chip"
                  disabled={actualizando}
                  onClick={() =>
                    cambiarEstado(
                      pedido,
                      proximoEstado,
                    )
                  }
                >
                  {actualizando
                    ? 'Actualizando...'
                    : textoSiguienteEstado[
                        pedido.estado
                      ]}
                </button>
              )}

              <button
                type="button"
                className="action-chip danger"
                disabled={actualizando}
                onClick={() =>
                  cancelarPedido(pedido)
                }
              >
                Cancelar
              </button>
            </>
          )}

          {!permitirAcciones && (
            <span className="action-disabled">
              Pedido finalizado
            </span>
          )}
        </div>
      </article>
    )
  }

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando pedidos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>
          No fue posible consultar los pedidos:
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
              SEGUIMIENTO
            </p>

            <h2>
              Pedidos del restaurante
            </h2>

            <p>
              Estados, totales e historial de atención.
            </p>
          </div>

          <button
            type="button"
            className="button secondary"
            onClick={cargarDatos}
          >
            ↻ Actualizar
          </button>
        </div>

        <div className="two-columns">
          <div>
            <h3 className="column-title">
              Pedidos activos ({pedidosActivos.length})
            </h3>

            <div className="order-list">
              {pedidosActivos.length > 0 ? (
                pedidosActivos.map((pedido) =>
                  renderizarPedido(
                    pedido,
                    true,
                  ),
                )
              ) : (
                <div className="empty-state">
                  No hay pedidos activos.
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="column-title">
              Historial reciente
            </h3>

            <div className="order-list">
              {historialPedidos.length > 0 ? (
                historialPedidos
                  .slice(0, 20)
                  .map((pedido) =>
                    renderizarPedido(
                      pedido,
                      false,
                    ),
                  )
              ) : (
                <div className="empty-state">
                  No hay pedidos en el historial.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {mostrarDetalle &&
        pedidoSeleccionadoId && (
          <PedidoDialog
            pedidoId={pedidoSeleccionadoId}
            cerrar={cerrarDetalle}
            pedidoActualizado={
              actualizarPedidoEnLista
            }
          />
        )}
    </>
  )
}

export default PedidosPage
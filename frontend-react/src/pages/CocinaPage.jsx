import { useEffect, useState } from 'react'
import { api } from '../services/api'

const nombresEstados = {
  ABIERTO: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
}

function CocinaPage() {
  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [error, setError] = useState('')

  async function cargarCocina() {
    try {
      setCargando(true)
      setError('')

      const [listaPedidos, listaMesas, listaProductos] =
        await Promise.all([
          api.getPedidos(),
          api.getMesas(),
          api.getProductos(),
        ])

      const pedidosCocina = (
        Array.isArray(listaPedidos) ? listaPedidos : []
      ).filter((pedido) =>
        ['ABIERTO', 'EN_PREPARACION', 'LISTO'].includes(
          pedido.estado,
        ),
      )

      const detalles = await Promise.all(
        pedidosCocina.map(async (pedido) => {
          try {
            return await api.getPedido(pedido.id)
          } catch {
            return pedido
          }
        }),
      )

      setPedidos(detalles)
      setMesas(Array.isArray(listaMesas) ? listaMesas : [])
      setProductos(
        Array.isArray(listaProductos) ? listaProductos : [],
      )
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar las comandas.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarCocina()
  }, [])

  function obtenerNumeroMesa(mesaId) {
    const mesa = mesas.find(
      (item) => Number(item.id) === Number(mesaId),
    )

    return mesa?.numero ?? mesaId
  }

  function obtenerNombreProducto(productoId) {
    const producto = productos.find(
      (item) => Number(item.id) === Number(productoId),
    )

    return producto?.nombre || `Producto ${productoId}`
  }

  async function cambiarEstado(pedido, nuevoEstado) {
    try {
      setActualizandoId(pedido.id)
      setError('')

      await api.changeOrderStatus(pedido.id, nuevoEstado)
      await cargarCocina()
    } catch (err) {
      window.alert(
        `No fue posible actualizar la comanda: ${
          err.message || 'Error desconocido'
        }`,
      )
    } finally {
      setActualizandoId(null)
    }
  }

  const pendientes = pedidos.filter(
    (pedido) => pedido.estado === 'ABIERTO',
  )

  const enPreparacion = pedidos.filter(
    (pedido) => pedido.estado === 'EN_PREPARACION',
  )

  const listos = pedidos.filter(
    (pedido) => pedido.estado === 'LISTO',
  )

  function renderizarTicket(pedido, nuevoEstado, textoBoton) {
    const actualizando = actualizandoId === pedido.id

    return (
      <article className="kitchen-ticket" key={pedido.id}>
        <div className="ticket-head">
          <strong>
            #{pedido.id} · Mesa{' '}
            {obtenerNumeroMesa(pedido.mesa_id)}
          </strong>

          <span
            className={`status-pill status-${pedido.estado}`}
          >
            {nombresEstados[pedido.estado] || pedido.estado}
          </span>
        </div>

        <div className="ticket-items">
          {(pedido.items || []).map((item) => (
            <div className="ticket-item" key={item.id}>
              <b>{item.cantidad}×</b>

              {obtenerNombreProducto(item.producto_id)}

              {item.observacion && (
                <span className="ticket-note">
                  {item.observacion}
                </span>
              )}
            </div>
          ))}

          {(pedido.items || []).length === 0 && (
            <div className="ticket-item">
              El pedido todavía no tiene productos.
            </div>
          )}
        </div>

        <button
          type="button"
          className={
            nuevoEstado === 'LISTO'
              ? 'button primary full'
              : 'button secondary full'
          }
          disabled={actualizando}
          onClick={() =>
            cambiarEstado(pedido, nuevoEstado)
          }
        >
          {actualizando ? 'Actualizando...' : textoBoton}
        </button>
      </article>
    )
  }

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando comandas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <p>No fue posible consultar cocina: {error}</p>

        <button
          type="button"
          className="button primary"
          onClick={cargarCocina}
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  return (
    <section className="content-card">
      <div className="section-toolbar">
        <div>
          <p className="eyebrow">OPERACIÓN DE COCINA</p>
          <h2>Comandas</h2>
          <p>
            Pedidos pendientes, en preparación y listos.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={cargarCocina}
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="kitchen-board">
        <section className="kitchen-column">
          <div className="kitchen-column-title pending">
            <span>Pendientes</span>
            <strong>{pendientes.length}</strong>
          </div>

          <div className="kitchen-list">
            {pendientes.length > 0 ? (
              pendientes.map((pedido) =>
                renderizarTicket(
                  pedido,
                  'EN_PREPARACION',
                  'Iniciar preparación',
                ),
              )
            ) : (
              <div className="empty-state">
                No hay pedidos pendientes.
              </div>
            )}
          </div>
        </section>

        <section className="kitchen-column">
          <div className="kitchen-column-title preparing">
            <span>En preparación</span>
            <strong>{enPreparacion.length}</strong>
          </div>

          <div className="kitchen-list">
            {enPreparacion.length > 0 ? (
              enPreparacion.map((pedido) =>
                renderizarTicket(
                  pedido,
                  'LISTO',
                  'Marcar como listo',
                ),
              )
            ) : (
              <div className="empty-state">
                No hay pedidos en preparación.
              </div>
            )}
          </div>
        </section>

        <section className="kitchen-column">
          <div className="kitchen-column-title ready">
            <span>Listos</span>
            <strong>{listos.length}</strong>
          </div>

          <div className="kitchen-list">
            {listos.length > 0 ? (
              listos.map((pedido) =>
                renderizarTicket(
                  pedido,
                  'ENTREGADO',
                  'Entregar a la mesa',
                ),
              )
            ) : (
              <div className="empty-state">
                No hay pedidos listos.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default CocinaPage
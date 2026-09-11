import { useEffect, useState } from 'react'
import { api } from '../services/api'

const nombresEstados = {
  ABIERTO: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
}

const siguientesEstados = {
  ABIERTO: {
    estado: 'EN_PREPARACION',
    texto: 'Iniciar preparación',
  },
  EN_PREPARACION: {
    estado: 'LISTO',
    texto: 'Marcar como listo',
  },
  LISTO: {
    estado: 'ENTREGADO',
    texto: 'Entregar a la mesa',
  },
}

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
    hour12: true,
  }).format(fecha)
}

function calcularTiempo(valor, fechaActual) {
  if (!valor) return 'Sin hora'

  const fechaPedido = new Date(valor)

  if (Number.isNaN(fechaPedido.getTime())) {
    return 'Sin hora'
  }

  const diferencia = Math.max(
    0,
    fechaActual.getTime() -
      fechaPedido.getTime(),
  )

  const minutos = Math.floor(
    diferencia / 60000,
  )

  if (minutos < 1) {
    return 'Hace menos de 1 min'
  }

  if (minutos < 60) {
    return `Hace ${minutos} min`
  }

  const horas = Math.floor(minutos / 60)
  const minutosRestantes = minutos % 60

  if (minutosRestantes === 0) {
    return `Hace ${horas} h`
  }

  return `Hace ${horas} h ${minutosRestantes} min`
}

function CocinaPage({ cambiarVista }) {
  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizandoId, setActualizandoId] =
    useState(null)
  const [error, setError] = useState('')
  const [fechaActual, setFechaActual] = useState(
    () => new Date(),
  )

  async function cargarCocina(
    mostrarCarga = true,
  ) {
    try {
      if (mostrarCarga) {
        setCargando(true)
      }

      setError('')

      const [
        listaPedidos,
        listaMesas,
        listaProductos,
      ] = await Promise.all([
        api.getPedidos(),
        api.getMesas(),
        api.getProductos(),
      ])

      const pedidosCocina = (
        Array.isArray(listaPedidos)
          ? listaPedidos
          : []
      )
        .filter((pedido) =>
          [
            'ABIERTO',
            'EN_PREPARACION',
            'LISTO',
          ].includes(pedido.estado),
        )
        .sort(
          (pedidoA, pedidoB) =>
            new Date(
              pedidoA.created_at,
            ).getTime() -
            new Date(
              pedidoB.created_at,
            ).getTime(),
        )

      const detalles = await Promise.all(
        pedidosCocina.map(async (pedido) => {
          try {
            return await api.getPedido(
              pedido.id,
            )
          } catch {
            return {
              ...pedido,
              items: [],
            }
          }
        }),
      )

      setPedidos(detalles)

      setMesas(
        Array.isArray(listaMesas)
          ? listaMesas
          : [],
      )

      setProductos(
        Array.isArray(listaProductos)
          ? listaProductos
          : [],
      )

      setFechaActual(new Date())
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar las comandas.',
      )
    } finally {
      if (mostrarCarga) {
        setCargando(false)
      }
    }
  }

  useEffect(() => {
    cargarCocina()

    const intervaloDatos =
      window.setInterval(() => {
        cargarCocina(false)
      }, 15000)

    const intervaloTiempo =
      window.setInterval(() => {
        setFechaActual(new Date())
      }, 30000)

    return () => {
      window.clearInterval(intervaloDatos)
      window.clearInterval(intervaloTiempo)
    }
  }, [])

  function obtenerNumeroMesa(mesaId) {
    const mesa = mesas.find(
      (item) =>
        Number(item.id) === Number(mesaId),
    )

    return mesa?.numero ?? mesaId
  }

  function obtenerNombreProducto(productoId) {
    const producto = productos.find(
      (item) =>
        Number(item.id) ===
        Number(productoId),
    )

    return (
      producto?.nombre ||
      `Producto ${productoId}`
    )
  }

  async function cambiarEstado(
    pedido,
    nuevoEstado,
  ) {
    const tieneProductos =
      Array.isArray(pedido.items) &&
      pedido.items.length > 0

    if (
      pedido.estado === 'ABIERTO' &&
      !tieneProductos
    ) {
      window.alert(
        `El pedido #${pedido.id} todavía no tiene productos y no puede enviarse a preparación.`,
      )
      return
    }

    try {
      setActualizandoId(pedido.id)
      setError('')

      await api.changeOrderStatus(
        pedido.id,
        nuevoEstado,
      )

      await cargarCocina(false)
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

  function irAPedidos() {
    if (cambiarVista) {
      cambiarVista('pedidos')
    }
  }

  const pendientes = pedidos.filter(
    (pedido) =>
      pedido.estado === 'ABIERTO',
  )

  const enPreparacion = pedidos.filter(
    (pedido) =>
      pedido.estado === 'EN_PREPARACION',
  )

  const listos = pedidos.filter(
    (pedido) => pedido.estado === 'LISTO',
  )

  function renderizarTicket(pedido) {
    const actualizando =
      Number(actualizandoId) ===
      Number(pedido.id)

    const accion =
      siguientesEstados[pedido.estado]

    const items = Array.isArray(pedido.items)
      ? pedido.items
      : []

    const tieneProductos = items.length > 0

    return (
      <article
        className="kitchen-ticket"
        key={pedido.id}
      >
        <div className="ticket-head">
          <div>
            <strong>
              #{pedido.id}
              {' · '}
              Mesa{' '}
              {obtenerNumeroMesa(
                pedido.mesa_id,
              )}
            </strong>

            <small>
              {formatearHora(
                pedido.created_at,
              )}
              {' · '}
              {calcularTiempo(
                pedido.created_at,
                fechaActual,
              )}
            </small>
          </div>

          <span
            className={`status-pill status-${pedido.estado}`}
          >
            {nombresEstados[pedido.estado] ||
              pedido.estado}
          </span>
        </div>

        <div className="ticket-items">
          {items.map((item) => (
            <div
              className="ticket-item"
              key={item.id}
            >
              <div>
                <b>{item.cantidad}×</b>
                {' '}
                {obtenerNombreProducto(
                  item.producto_id,
                )}
              </div>

              {item.observacion && (
                <span className="ticket-note">
                  {item.observacion}
                </span>
              )}
            </div>
          ))}

          {!tieneProductos && (
            <div className="ticket-empty">
              Este pedido todavía no tiene
              productos.
            </div>
          )}
        </div>

        <div className="ticket-total">
          <span>Total</span>

          <strong>
            {formatearDinero(pedido.total)}
          </strong>
        </div>

        {accion && (
          <>
            {pedido.estado === 'ABIERTO' &&
            !tieneProductos ? (
              <button
                type="button"
                className="button secondary full"
                onClick={irAPedidos}
              >
                Ir a Pedidos para agregar productos
              </button>
            ) : (
              <button
                type="button"
                className={
                  pedido.estado ===
                  'EN_PREPARACION'
                    ? 'button primary full'
                    : 'button secondary full'
                }
                disabled={actualizando}
                onClick={() =>
                  cambiarEstado(
                    pedido,
                    accion.estado,
                  )
                }
              >
                {actualizando
                  ? 'Actualizando...'
                  : accion.texto}
              </button>
            )}
          </>
        )}
      </article>
    )
  }

  function renderizarColumna(
    titulo,
    clase,
    lista,
    mensajeVacio,
  ) {
    return (
      <section className="kitchen-column">
        <div
          className={`kitchen-column-title ${clase}`}
        >
          <span>{titulo}</span>
          <strong>{lista.length}</strong>
        </div>

        <div className="kitchen-list">
          {lista.length > 0 ? (
            lista.map(renderizarTicket)
          ) : (
            <div className="empty-state">
              {mensajeVacio}
            </div>
          )}
        </div>
      </section>
    )
  }

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando comandas...
      </div>
    )
  }

  if (error && pedidos.length === 0) {
    return (
      <div className="empty-state">
        <p>
          No fue posible consultar cocina:
          {' '}
          {error}
        </p>

        <button
          type="button"
          className="button primary"
          onClick={() => cargarCocina()}
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
          <p className="eyebrow">
            OPERACIÓN DE COCINA
          </p>

          <h2>Comandas</h2>

          <p>
            Pedidos pendientes, en preparación
            y listos.
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() => cargarCocina(false)}
        >
          ↻ Actualizar
        </button>
      </div>

      {error && (
        <p className="form-error">
          No fue posible actualizar automáticamente:
          {' '}
          {error}
        </p>
      )}

      <div className="kitchen-board">
        {renderizarColumna(
          'Pendientes',
          'pending',
          pendientes,
          'No hay pedidos pendientes.',
        )}

        {renderizarColumna(
          'En preparación',
          'preparing',
          enPreparacion,
          'No hay pedidos en preparación.',
        )}

        {renderizarColumna(
          'Listos',
          'ready',
          listos,
          'No hay pedidos listos.',
        )}
      </div>
    </section>
  )
}

export default CocinaPage
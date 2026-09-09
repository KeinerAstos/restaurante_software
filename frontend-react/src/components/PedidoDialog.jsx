import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

function formatearDinero(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

function PedidoDialog({
  pedidoId,
  cerrar,
  pedidoActualizado,
}) {
  const dialogRef = useRef(null)
  const [pedido, setPedido] = useState(null)
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [observacion, setObservacion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    cargarDetalle()
  }, [pedidoId])

  async function cargarDetalle() {
    try {
      setCargando(true)
      setError('')

      const [datosPedido, datosProductos] =
        await Promise.all([
          api.getPedido(pedidoId),
          api.getProductos(),
        ])

      setPedido(datosPedido)

      setProductos(
        Array.isArray(datosProductos)
          ? datosProductos.filter(
              (producto) => producto.disponible,
            )
          : [],
      )
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar el pedido.',
      )
    } finally {
      setCargando(false)
    }
  }

  function obtenerProducto(productoIdBuscado) {
    return productos.find(
      (producto) =>
        Number(producto.id) ===
        Number(productoIdBuscado),
    )
  }

  async function agregarProducto(evento) {
    evento.preventDefault()

    if (!productoId) {
      setError('Selecciona un producto.')
      return
    }

    if (Number(cantidad) < 1) {
      setError('La cantidad debe ser mínimo 1.')
      return
    }

    try {
      setGuardando(true)
      setError('')

      await api.addItem(pedidoId, {
        producto_id: Number(productoId),
        cantidad: Number(cantidad),
        observacion: observacion.trim() || null,
      })

      setProductoId('')
      setCantidad(1)
      setObservacion('')

      const pedidoRecargado = await api.getPedido(pedidoId)

      setPedido(pedidoRecargado)
      pedidoActualizado(pedidoRecargado)
    } catch (err) {
      setError(
        err.message ||
          'No fue posible agregar el producto.',
      )
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarCantidad(item, nuevaCantidad) {
    if (nuevaCantidad < 1) return

    try {
      setGuardando(true)
      setError('')

      await api.updateItem(pedidoId, item.id, {
        cantidad: nuevaCantidad,
      })

      const pedidoRecargado = await api.getPedido(pedidoId)

      setPedido(pedidoRecargado)
      pedidoActualizado(pedidoRecargado)
    } catch (err) {
      setError(
        err.message ||
          'No fue posible cambiar la cantidad.',
      )
    } finally {
      setGuardando(false)
    }
  }

  async function quitarProducto(item) {
    const confirmado = window.confirm(
      '¿Deseas quitar este producto del pedido?',
    )

    if (!confirmado) return

    try {
      setGuardando(true)
      setError('')

      await api.removeItem(pedidoId, item.id)

      const pedidoRecargado = await api.getPedido(pedidoId)

      setPedido(pedidoRecargado)
      pedidoActualizado(pedidoRecargado)
    } catch (err) {
      setError(
        err.message ||
          'No fue posible quitar el producto.',
      )
    } finally {
      setGuardando(false)
    }
  }

  function manejarCierre() {
    dialogRef.current?.close()
    cerrar()
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog order-dialog"
      onCancel={(evento) => {
        evento.preventDefault()
        manejarCierre()
      }}
      onClose={cerrar}
    >
      <div className="dialog-form">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">DETALLE DEL PEDIDO</p>

            <h2>
              Pedido #{pedido?.id || pedidoId}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={manejarCierre}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {cargando ? (
          <div className="empty-state">
            Cargando pedido...
          </div>
        ) : error && !pedido ? (
          <div className="empty-state">
            {error}
          </div>
        ) : (
          <>
            <div className="order-head">
              <strong>Productos agregados</strong>

              <span className="order-total">
                {formatearDinero(pedido?.total)}
              </span>
            </div>

            <div className="items-mini">
              {(pedido?.items || []).map((item) => {
                const producto = obtenerProducto(
                  item.producto_id,
                )

                return (
                  <div className="item-mini" key={item.id}>
                    <div>
                      <strong>
                        {producto?.nombre ||
                          `Producto ${item.producto_id}`}
                      </strong>

                      <span>
                        {formatearDinero(item.subtotal)}

                        {item.observacion
                          ? ` · ${item.observacion}`
                          : ''}
                      </span>
                    </div>

                    <div className="item-mini-actions">
                      <button
                        type="button"
                        className="qty-btn"
                        disabled={
                          guardando || item.cantidad <= 1
                        }
                        onClick={() =>
                          cambiarCantidad(
                            item,
                            item.cantidad - 1,
                          )
                        }
                      >
                        −
                      </button>

                      <strong>{item.cantidad}</strong>

                      <button
                        type="button"
                        className="qty-btn"
                        disabled={guardando}
                        onClick={() =>
                          cambiarCantidad(
                            item,
                            item.cantidad + 1,
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="remove-mini"
                        disabled={guardando}
                        onClick={() => quitarProducto(item)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                )
              })}

              {(pedido?.items || []).length === 0 && (
                <div className="empty-state">
                  El pedido todavía no tiene productos.
                </div>
              )}
            </div>

            <form
              className="add-form"
              onSubmit={agregarProducto}
            >
              <div className="row">
                <select
                  value={productoId}
                  onChange={(evento) =>
                    setProductoId(evento.target.value)
                  }
                  disabled={guardando}
                  required
                >
                  <option value="">
                    Selecciona un producto...
                  </option>

                  {productos.map((producto) => (
                    <option
                      key={producto.id}
                      value={producto.id}
                    >
                      {producto.nombre} ·{' '}
                      {formatearDinero(producto.precio)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={cantidad}
                  onChange={(evento) =>
                    setCantidad(evento.target.value)
                  }
                  disabled={guardando}
                  required
                />
              </div>

              <textarea
                placeholder="Observación opcional"
                value={observacion}
                onChange={(evento) =>
                  setObservacion(evento.target.value)
                }
                disabled={guardando}
              />

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="button primary full"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : '+ Agregar producto'}
              </button>
            </form>
          </>
        )}

        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={manejarCierre}
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default PedidoDialog
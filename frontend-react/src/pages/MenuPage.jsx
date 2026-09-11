import { useEffect, useState } from 'react'
import ProductDialog from '../components/ProductDialog'
import { api } from '../services/api'

const categorias = [
  { valor: 'TODOS', nombre: 'Todos' },
  { valor: 'ENTRADA', nombre: 'Entradas' },
  { valor: 'PLATO_FUERTE', nombre: 'Platos fuertes' },
  { valor: 'BEBIDA', nombre: 'Bebidas' },
  { valor: 'POSTRE', nombre: 'Postres' },
  { valor: 'OTRO', nombre: 'Otros' },
]

const nombresCategorias = {
  ENTRADA: 'Entrada',
  PLATO_FUERTE: 'Plato fuerte',
  BEBIDA: 'Bebida',
  POSTRE: 'Postre',
  OTRO: 'Otro',
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0))
}

function MenuPage() {
  const [productos, setProductos] = useState([])
  const [categoria, setCategoria] = useState('TODOS')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  async function cargarProductos() {
    try {
      setCargando(true)
      setError('')

      const datos = await api.getProductos()
      setProductos(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  function abrirNuevoProducto() {
    setProductoSeleccionado(null)
    setMostrarFormulario(true)
  }

  function abrirEdicion(producto) {
    setProductoSeleccionado(producto)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setProductoSeleccionado(null)
  }

  function guardarProductoEnLista(productoGuardado) {
    setProductos((actuales) => {
      const existe = actuales.some(
        (producto) => producto.id === productoGuardado.id,
      )

      if (existe) {
        return actuales.map((producto) =>
          producto.id === productoGuardado.id
            ? productoGuardado
            : producto,
        )
      }

      return [...actuales, productoGuardado]
    })

    cerrarFormulario()
  }

  async function cambiarDisponibilidad(producto) {
    try {
      const actualizado = await api.updateProducto(producto.id, {
        disponible: !producto.disponible,
      })

      setProductos((actuales) =>
        actuales.map((item) =>
          item.id === producto.id ? actualizado : item,
        ),
      )
    } catch (err) {
      window.alert(
        `No fue posible actualizar el producto: ${err.message}`,
      )
    }
  }

  const productosFiltrados = productos
    .filter(
      (producto) =>
        categoria === 'TODOS' || producto.categoria === categoria,
    )
    .sort(
      (a, b) =>
        a.categoria.localeCompare(b.categoria) ||
        a.nombre.localeCompare(b.nombre),
    )

  if (cargando) {
    return <div className="empty-state">Cargando productos...</div>
  }

  if (error) {
    return (
      <div className="empty-state">
        No fue posible consultar los productos: {error}
      </div>
    )
  }

  return (
    <>
      <section className="content-card">
        <div className="section-toolbar">
          <div>
            <p className="eyebrow">CARTA DEL RESTAURANTE</p>
            <h2>Productos disponibles</h2>
          </div>

          <button
            type="button"
            className="button primary"
            onClick={abrirNuevoProducto}
          >
            + Nuevo producto
          </button>
        </div>

        <div className="category-tabs">
          {categorias.map((item) => (
            <button
              key={item.valor}
              type="button"
              className={`category-tab ${
                categoria === item.valor ? 'active' : ''
              }`}
              onClick={() => setCategoria(item.valor)}
            >
              {item.nombre}
            </button>
          ))}
        </div>
      </section>

      <section className="menu-grid">
        {productosFiltrados.map((producto) => (
          <article className="product-card" key={producto.id}>
            <div className={`product-art ${producto.categoria}`}>
              {producto.nombre.charAt(0).toUpperCase()}
            </div>

            <div className="product-card-body">
              <div className="product-card-head">
                <div>
                  <span
                    className={`status-pill ${
                      producto.disponible
                        ? 'status-LIBRE'
                        : 'status-FUERA_DE_SERVICIO'
                    }`}
                  >
                    {producto.disponible
                      ? 'Disponible'
                      : 'No disponible'}
                  </span>

                  <h3>{producto.nombre}</h3>
                </div>

                <span className="product-price">
                  {formatearPrecio(producto.precio)}
                </span>
              </div>

              <p>
                {producto.descripcion ||
                  nombresCategorias[producto.categoria]}
              </p>

              <div className="product-footer">
                <small>{nombresCategorias[producto.categoria]}</small>

                <div className="table-actions">
                  <button
                    type="button"
                    className="action-chip"
                    onClick={() => abrirEdicion(producto)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="action-chip"
                    onClick={() => cambiarDisponibilidad(producto)}
                  >
                    {producto.disponible ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {productosFiltrados.length === 0 && (
          <div className="empty-state">
            No hay productos en esta categoría.
          </div>
        )}
      </section>

      {mostrarFormulario && (
        <ProductDialog
          producto={productoSeleccionado}
          cerrar={cerrarFormulario}
          productoGuardado={guardarProductoEnLista}
        />
      )}
    </>
  )
}

export default MenuPage
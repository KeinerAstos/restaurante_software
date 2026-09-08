import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

function ProductDialog({ producto, cerrar, productoGuardado }) {
  const dialogRef = useRef(null)

  const [formulario, setFormulario] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio || '',
    categoria: producto?.categoria || 'PLATO_FUERTE',
    disponible: producto?.disponible ?? true,
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

useEffect(() => {
  const dialogo = dialogRef.current

  if (dialogo && !dialogo.open) {
    dialogo.showModal()
  }
}, [])
  function actualizarCampo(evento) {
    const { name, value, type, checked } = evento.target

    setFormulario((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function guardar(evento) {
    evento.preventDefault()

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      precio: Number(formulario.precio),
      categoria: formulario.categoria,
      disponible: formulario.disponible,
    }

    try {
      setGuardando(true)
      setError('')

      const resultado = producto
        ? await api.updateProducto(producto.id, datos)
        : await api.createProducto(datos)

      productoGuardado(resultado)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onCancel={cerrar}
      onClose={cerrar}
    >
      <form onSubmit={guardar}>
        <div className="dialog-header">
          <div>
            <p className="eyebrow">MENÚ</p>
            <h2>{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={cerrar}
          >
            ×
          </button>
        </div>

        <label className="field">
          <span>Nombre</span>
          <input
            name="nombre"
            value={formulario.nombre}
            onChange={actualizarCampo}
            required
            minLength="2"
            maxLength="150"
          />
        </label>

        <label className="field">
          <span>Descripción</span>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={actualizarCampo}
          />
        </label>

        <div className="form-grid compact-grid">
          <label className="field">
            <span>Precio</span>
            <input
              name="precio"
              type="number"
              min="100"
              step="100"
              value={formulario.precio}
              onChange={actualizarCampo}
              required
            />
          </label>

          <label className="field">
            <span>Categoría</span>
            <select
              name="categoria"
              value={formulario.categoria}
              onChange={actualizarCampo}
              required
            >
              <option value="ENTRADA">Entrada</option>
              <option value="PLATO_FUERTE">Plato fuerte</option>
              <option value="BEBIDA">Bebida</option>
              <option value="POSTRE">Postre</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
        </div>

        <label className="toggle-field">
          <input
            name="disponible"
            type="checkbox"
            checked={formulario.disponible}
            onChange={actualizarCampo}
          />
          <span>Producto disponible para pedidos</span>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={cerrar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="button primary"
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default ProductDialog
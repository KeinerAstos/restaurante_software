import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

function ClientDialog({ cliente, cerrar, clienteGuardado }) {
  const dialogRef = useRef(null)

  const [formulario, setFormulario] = useState({
    nombre: cliente?.nombre || '',
    telefono: cliente?.telefono || '',
    email: cliente?.email || '',
    observaciones: cliente?.observaciones || '',
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
    const { name, value } = evento.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  async function guardar(evento) {
    evento.preventDefault()

    const datos = {
      nombre: formulario.nombre.trim(),
      telefono: formulario.telefono.trim() || null,
      email: formulario.email.trim() || null,
      observaciones: formulario.observaciones.trim() || null,
    }

    try {
      setGuardando(true)
      setError('')

      const resultado = cliente
        ? await api.updateCliente(cliente.id, datos)
        : await api.createCliente(datos)

      clienteGuardado(resultado)
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
            <p className="eyebrow">CLIENTES</p>
            <h2>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>
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
            minLength="2"
            maxLength="150"
            required
          />
        </label>

        <label className="field">
          <span>Teléfono</span>
          <input
            name="telefono"
            value={formulario.telefono}
            onChange={actualizarCampo}
            maxLength="30"
          />
        </label>

        <label className="field">
          <span>Correo electrónico</span>
          <input
            name="email"
            type="email"
            value={formulario.email}
            onChange={actualizarCampo}
            maxLength="150"
          />
        </label>

        <label className="field">
          <span>Observaciones</span>
          <textarea
            name="observaciones"
            value={formulario.observaciones}
            onChange={actualizarCampo}
          />
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
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default ClientDialog
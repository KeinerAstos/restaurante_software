import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

function MesaDialog({ mesa, cerrar, mesaGuardada }) {
  const dialogRef = useRef(null)

  const [formulario, setFormulario] = useState({
    numero: mesa?.numero || '',
    capacidad: mesa?.capacidad || 4,
    ubicacion: mesa?.ubicacion || '',
    estado: mesa?.estado || 'LIBRE',
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
      numero: Number(formulario.numero),
      capacidad: Number(formulario.capacidad),
      ubicacion: formulario.ubicacion.trim() || null,
      estado: formulario.estado,
    }

    try {
      setGuardando(true)
      setError('')

      let resultado

      if (mesa) {
        resultado = await api.updateMesa(mesa.id, datos)
      } else {
        resultado = await api.createMesa(datos)

        try {
          await api.updateLayoutMesa(resultado.id, {
            zona: 'OTRA',
            pos_x: 50,
            pos_y: 50,
            forma: 'ROUND',
          })
        } catch {
          // La mesa queda creada aunque el layout use valores automáticos.
        }
      }

      mesaGuardada(resultado)
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
            <p className="eyebrow">CONFIGURACIÓN</p>
            <h2>{mesa ? `Editar Mesa ${mesa.numero}` : 'Nueva mesa'}</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={cerrar}
          >
            ×
          </button>
        </div>

        <div className="form-grid compact-grid">
          <label className="field">
            <span>Número</span>
            <input
              name="numero"
              type="number"
              min="1"
              value={formulario.numero}
              onChange={actualizarCampo}
              required
            />
          </label>

          <label className="field">
            <span>Capacidad</span>
            <input
              name="capacidad"
              type="number"
              min="1"
              max="50"
              value={formulario.capacidad}
              onChange={actualizarCampo}
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Ubicación</span>
          <input
            name="ubicacion"
            value={formulario.ubicacion}
            onChange={actualizarCampo}
            maxLength="100"
            placeholder="Ejemplo: Salón principal"
          />
        </label>

        <label className="field">
          <span>Estado</span>
          <select
            name="estado"
            value={formulario.estado}
            onChange={actualizarCampo}
          >
            <option value="LIBRE">Libre</option>
            <option value="OCUPADA">Ocupada</option>
            <option value="RESERVADA">Reservada</option>
            <option value="FUERA_DE_SERVICIO">
              Fuera de servicio
            </option>
          </select>
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
            {guardando ? 'Guardando...' : 'Guardar mesa'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default MesaDialog
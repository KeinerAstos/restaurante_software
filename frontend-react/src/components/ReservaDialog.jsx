import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'

function fechaParaFormulario(valor) {
  if (!valor) return ''

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) {
    return ''
  }

  const fechaLocal = new Date(
    fecha.getTime() -
      fecha.getTimezoneOffset() * 60000,
  )

  return fechaLocal.toISOString().slice(0, 16)
}

function ReservaDialog({
  reserva,
  clientes,
  mesas,
  cerrar,
  reservaGuardada,
}) {
  const dialogRef = useRef(null)

  const [formulario, setFormulario] = useState({
    cliente_id: reserva?.cliente_id || '',
    mesa_id: reserva?.mesa_id || '',
    fecha_hora: fechaParaFormulario(
      reserva?.fecha_hora,
    ),
    personas: reserva?.personas || 2,
    observaciones: reserva?.observaciones || '',
  })

  const [guardando, setGuardando] =
    useState(false)
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

    setError('')
  }

  function obtenerMesaSeleccionada() {
    return mesas.find(
      (mesa) =>
        Number(mesa.id) ===
        Number(formulario.mesa_id),
    )
  }

  async function guardar(evento) {
    evento.preventDefault()

    const mesaSeleccionada =
      obtenerMesaSeleccionada()

    if (!mesaSeleccionada) {
      setError('Debes seleccionar una mesa.')
      return
    }

    const esMesaOriginal =
      reserva &&
      Number(mesaSeleccionada.id) ===
        Number(reserva.mesa_id)

    if (
      mesaSeleccionada.estado !== 'LIBRE' &&
      !esMesaOriginal
    ) {
      setError(
        `La Mesa ${mesaSeleccionada.numero} ya no está disponible. Selecciona otra mesa.`,
      )
      return
    }

    const personas = Number(formulario.personas)

    if (personas > Number(mesaSeleccionada.capacidad)) {
      setError(
        `La Mesa ${mesaSeleccionada.numero} admite máximo ${mesaSeleccionada.capacidad} personas.`,
      )
      return
    }

    const fecha = new Date(formulario.fecha_hora)

    if (Number.isNaN(fecha.getTime())) {
      setError('La fecha y hora no son válidas.')
      return
    }

    const datos = {
      cliente_id: Number(formulario.cliente_id),
      mesa_id: Number(formulario.mesa_id),
      fecha_hora: fecha.toISOString(),
      personas,
      observaciones:
        formulario.observaciones.trim() || null,
    }

    try {
      setGuardando(true)
      setError('')

      const resultado = reserva
        ? await api.updateReserva(
            reserva.id,
            datos,
          )
        : await api.createReserva(datos)

      reservaGuardada(resultado)
    } catch (err) {
      setError(
        err.message ||
          'No fue posible guardar la reserva.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const clientesActivos = clientes.filter(
    (cliente) => cliente.activo !== false,
  )

  const mesasDisponibles = mesas.filter((mesa) => {
    if (mesa.activo === false) {
      return false
    }

    const esMesaActual =
      reserva &&
      Number(mesa.id) ===
        Number(reserva.mesa_id)

    return mesa.estado === 'LIBRE' || esMesaActual
  })

  const mesaSeleccionada =
    obtenerMesaSeleccionada()

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
            <p className="eyebrow">
              RESERVAS
            </p>

            <h2>
              {reserva
                ? 'Editar reserva'
                : 'Nueva reserva'}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={cerrar}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        <label className="field">
          <span>Cliente</span>

          <select
            name="cliente_id"
            value={formulario.cliente_id}
            onChange={actualizarCampo}
            required
          >
            <option value="">
              Selecciona un cliente
            </option>

            {clientesActivos.map((cliente) => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid compact-grid">
          <label className="field">
            <span>Mesa disponible</span>

            <select
              name="mesa_id"
              value={formulario.mesa_id}
              onChange={actualizarCampo}
              required
            >
              <option value="">
                Selecciona una mesa
              </option>

              {mesasDisponibles.map((mesa) => (
                <option
                  key={mesa.id}
                  value={mesa.id}
                >
                  Mesa {mesa.numero}
                  {' - '}
                  {mesa.capacidad} personas
                  {mesa.estado !== 'LIBRE'
                    ? ` - ${mesa.estado}`
                    : ' - Disponible'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Personas</span>

            <input
              name="personas"
              type="number"
              min="1"
              max={
                mesaSeleccionada?.capacidad || 50
              }
              value={formulario.personas}
              onChange={actualizarCampo}
              required
            />
          </label>
        </div>

        {mesaSeleccionada && (
          <p className="field-help">
            Capacidad máxima de la Mesa{' '}
            {mesaSeleccionada.numero}:{' '}
            {mesaSeleccionada.capacidad} personas.
          </p>
        )}

        <label className="field">
          <span>Fecha y hora</span>

          <input
            name="fecha_hora"
            type="datetime-local"
            value={formulario.fecha_hora}
            onChange={actualizarCampo}
            required
          />
        </label>

        <label className="field">
          <span>Observaciones</span>

          <textarea
            name="observaciones"
            value={formulario.observaciones}
            onChange={actualizarCampo}
            placeholder="Información adicional de la reserva"
          />
        </label>

        {clientesActivos.length === 0 && (
          <p className="form-error">
            Debes registrar o reactivar un cliente
            antes de crear una reserva.
          </p>
        )}

        {mesasDisponibles.length === 0 && (
          <p className="form-error">
            No existen mesas libres para realizar
            una reserva.
          </p>
        )}

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

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
            disabled={
              guardando ||
              clientesActivos.length === 0 ||
              mesasDisponibles.length === 0
            }
          >
            {guardando
              ? 'Guardando...'
              : 'Guardar reserva'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default ReservaDialog
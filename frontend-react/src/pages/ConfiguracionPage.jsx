import { useEffect, useState } from 'react'
import { api } from '../services/api'

const valoresIniciales = {
  nombre: '',
  especialidad: '',
  moneda: 'COP',
  ciudad: '',
  telefono: '',
  direccion: '',
  horario: '',
}

function ConfiguracionPage() {
  const [formulario, setFormulario] =
    useState(valoresIniciales)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarConfiguracion() {
    try {
      setCargando(true)
      setError('')
      setMensaje('')

      const datos = await api.getConfiguracion()

      setFormulario({
        nombre: datos?.nombre || '',
        especialidad: datos?.especialidad || '',
        moneda: datos?.moneda || 'COP',
        ciudad: datos?.ciudad || '',
        telefono: datos?.telefono || '',
        direccion: datos?.direccion || '',
        horario: datos?.horario || '',
      })
    } catch (err) {
      setError(
        err.message ||
          'No fue posible consultar la configuración.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  function actualizarCampo(evento) {
    const { name, value } = evento.target

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }))

    setMensaje('')
  }

  async function guardarConfiguracion(evento) {
    evento.preventDefault()

    if (!formulario.nombre.trim()) {
      setError('El nombre del restaurante es obligatorio.')
      return
    }

    if (!formulario.especialidad.trim()) {
      setError('La especialidad es obligatoria.')
      return
    }

    if (!formulario.moneda.trim()) {
      setError('La moneda es obligatoria.')
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const datosGuardados =
        await api.updateConfiguracion({
          nombre: formulario.nombre.trim(),
          especialidad: formulario.especialidad.trim(),
          moneda: formulario.moneda.trim(),
          ciudad: formulario.ciudad.trim() || null,
          telefono: formulario.telefono.trim() || null,
          direccion: formulario.direccion.trim() || null,
          horario: formulario.horario.trim() || null,
        })

      setFormulario({
        nombre: datosGuardados?.nombre || '',
        especialidad:
          datosGuardados?.especialidad || '',
        moneda: datosGuardados?.moneda || 'COP',
        ciudad: datosGuardados?.ciudad || '',
        telefono: datosGuardados?.telefono || '',
        direccion: datosGuardados?.direccion || '',
        horario: datosGuardados?.horario || '',
      })

      setMensaje(
        'La configuración se guardó correctamente.',
      )
    } catch (err) {
      setError(
        err.message ||
          'No fue posible guardar la configuración.',
      )
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="config-layout">
      <section className="content-card">
        <div className="section-heading">
          <p className="eyebrow">IDENTIDAD</p>

          <h2>Configuración del restaurante</h2>

          <p>
            Información general almacenada en PostgreSQL.
          </p>
        </div>

        <form
          className="form-grid"
          onSubmit={guardarConfiguracion}
        >
          <label className="field">
            <span>Nombre</span>

            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={actualizarCampo}
              maxLength="150"
              required
            />
          </label>

          <label className="field">
            <span>Especialidad</span>

            <input
              type="text"
              name="especialidad"
              value={formulario.especialidad}
              onChange={actualizarCampo}
              maxLength="120"
              required
            />
          </label>

          <label className="field">
            <span>Moneda</span>

            <select
              name="moneda"
              value={formulario.moneda}
              onChange={actualizarCampo}
              required
            >
              <option value="COP">
                COP - Peso colombiano
              </option>

              <option value="USD">
                USD - Dólar estadounidense
              </option>

              <option value="EUR">
                EUR - Euro
              </option>
            </select>
          </label>

          <label className="field">
            <span>Ciudad</span>

            <input
              type="text"
              name="ciudad"
              value={formulario.ciudad}
              onChange={actualizarCampo}
              maxLength="120"
            />
          </label>

          <label className="field">
            <span>Teléfono</span>

            <input
              type="tel"
              name="telefono"
              value={formulario.telefono}
              onChange={actualizarCampo}
              maxLength="40"
            />
          </label>

          <label className="field">
            <span>Dirección</span>

            <input
              type="text"
              name="direccion"
              value={formulario.direccion}
              onChange={actualizarCampo}
              maxLength="200"
            />
          </label>

          <label className="field full-span">
            <span>Horario</span>

            <input
              type="text"
              name="horario"
              value={formulario.horario}
              onChange={actualizarCampo}
              maxLength="160"
              placeholder="Lun-Dom 12:00 - 23:00"
            />
          </label>

          {error && (
            <div className="form-error full-span">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="form-success full-span">
              {mensaje}
            </div>
          )}

          <div className="full-span form-actions">
            <button
              type="submit"
              className="button primary"
              disabled={guardando}
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </section>

      <aside className="brand-preview">
        <div className="brand-preview-leaf">✦</div>

        <small>
          {formulario.especialidad ||
            'CUCINA ITALIANA'}
        </small>

        <h2>
          {formulario.nombre ||
            'Trattoria Bellavista'}
        </h2>

        <p>
          {formulario.ciudad || 'Bogotá'}
        </p>

        <div className="preview-line" />

        <span>
          {formulario.direccion ||
            'Dirección del restaurante'}
        </span>

        <span>
          {formulario.telefono ||
            'Teléfono del restaurante'}
        </span>

        <span>
          {formulario.horario ||
            'Horario de atención'}
        </span>
      </aside>
    </div>
  )
}

export default ConfiguracionPage
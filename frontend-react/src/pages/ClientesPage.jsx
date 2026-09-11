import { useEffect, useState } from 'react'
import ClientDialog from '../components/ClientDialog'
import { api } from '../services/api'

function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  async function cargarClientes() {
    try {
      setCargando(true)
      setError('')

      const datos = await api.getClientes(true)
      setClientes(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  function abrirNuevoCliente() {
    setClienteSeleccionado(null)
    setMostrarFormulario(true)
  }

  function abrirEdicion(cliente) {
    setClienteSeleccionado(cliente)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setClienteSeleccionado(null)
  }

  function actualizarLista(clienteGuardado) {
    setClientes((actuales) => {
      const existe = actuales.some(
        (cliente) => cliente.id === clienteGuardado.id,
      )

      if (existe) {
        return actuales.map((cliente) =>
          cliente.id === clienteGuardado.id
            ? clienteGuardado
            : cliente,
        )
      }

      return [...actuales, clienteGuardado]
    })

    cerrarFormulario()
  }

  async function reactivarCliente(cliente) {
  const confirmado = window.confirm(
    `¿Deseas reactivar al cliente ${cliente.nombre}?`,
  )

  if (!confirmado) return

  try {
    const actualizado = await api.updateCliente(cliente.id, {
      activo: true,
    })

    setClientes((actuales) =>
      actuales.map((item) =>
        item.id === cliente.id ? actualizado : item,
      ),
    )
  } catch (err) {
    window.alert(`No fue posible reactivar: ${err.message}`)
  }
}

  const texto = busqueda.trim().toLowerCase()

  const clientesFiltrados = clientes
    .filter(
      (cliente) =>
        !texto ||
        cliente.nombre.toLowerCase().includes(texto) ||
        (cliente.telefono || '').toLowerCase().includes(texto) ||
        (cliente.email || '').toLowerCase().includes(texto),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <>
      <section className="content-card">
        <div className="section-toolbar">
          <div>
            <p className="eyebrow">DIRECTORIO</p>
            <h2>Clientes registrados</h2>
          </div>

          <div className="table-actions">
            <input
              className="control search-wide"
              type="search"
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />

            <button
              type="button"
              className="button primary"
              onClick={abrirNuevoCliente}
            >
              + Nuevo cliente
            </button>
          </div>
        </div>

        {cargando && (
          <div className="empty-state">Cargando clientes...</div>
        )}

        {error && (
          <div className="empty-state">
            No fue posible consultar los clientes: {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre}</strong>
                      <small>{cliente.observaciones || ''}</small>
                    </td>

                    <td>{cliente.telefono || '—'}</td>
                    <td>{cliente.email || '—'}</td>

                    <td>
                      <span
                        className={`status-pill ${
                          cliente.activo
                            ? 'status-LIBRE'
                            : 'status-FUERA_DE_SERVICIO'
                        }`}
                      >
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-chip"
                          onClick={() => abrirEdicion(cliente)}
                        >
                          Editar
                        </button>

                            {cliente.activo ? (
                            <button
                                type="button"
                                className="action-chip danger"
                                onClick={() => desactivarCliente(cliente)}
                            >
                                Desactivar
                            </button>
                            ) : (
                            <button
                                type="button"
                                className="action-chip"
                                onClick={() => reactivarCliente(cliente)}
                            >
                                Reactivar
                            </button>
                            )}
                      </div>
                    </td>
                  </tr>
                ))}

                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        No hay clientes registrados.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrarFormulario && (
        <ClientDialog
          cliente={clienteSeleccionado}
          cerrar={cerrarFormulario}
          clienteGuardado={actualizarLista}
        />
      )}
    </>
  )
}

export default ClientesPage
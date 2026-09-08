import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [estado, setEstado] = useState('Consultando backend...')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/health')
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('El backend respondió con un error')
        }

        return respuesta.json()
      })
      .then((datos) => {
        setEstado(
          `${datos.status} - ${datos.application} - versión ${datos.version}`,
        )
      })
      .catch((errorConsulta) => {
        setError(errorConsulta.message)
      })
  }, [])

  return (
    <main>
      <h1>Trattoria Bellavista</h1>
      <h2>Frontend desarrollado con React</h2>

      <section>
        <h3>Estado de conexión con FastAPI</h3>

        {error ? (
          <p>Error: {error}</p>
        ) : (
          <p>{estado}</p>
        )}
      </section>
    </main>
  )
}

export default App
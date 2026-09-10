import { useRef, useState } from 'react'

const formas = {
  ROUND: 'round',
  RECT: 'rect',
  SMALL: 'small',
}

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function RestaurantMap({
  mesas,
  layouts,
  mesaSeleccionadaId,
  seleccionarMesa,
  modoEdicion,
  moverMesa,
  busqueda,
  zonaSeleccionada,
}) {
  const mapaRef = useRef(null)
  const [mesaArrastrandoId, setMesaArrastrandoId] =
    useState(null)

  function obtenerLayout(mesaId) {
    return layouts.find(
      (layout) =>
        Number(layout.mesa_id) === Number(mesaId),
    )
  }

  function coincideConFiltros(mesa, layout) {
    const texto = busqueda.trim().toLowerCase()

    const coincideTexto =
      !texto ||
      String(mesa.numero).includes(texto) ||
      String(mesa.ubicacion || '')
        .toLowerCase()
        .includes(texto)

    const zona = layout?.zona || 'OTRA'

    const coincideZona =
      zonaSeleccionada === 'TODAS' ||
      zona === zonaSeleccionada

    return coincideTexto && coincideZona
  }

  function calcularPosicion(evento) {
    const rectangulo =
      mapaRef.current?.getBoundingClientRect()

    if (!rectangulo) {
      return null
    }

    const posX = limitar(
      ((evento.clientX - rectangulo.left) /
        rectangulo.width) *
        100,
      3,
      97,
    )

    const posY = limitar(
      ((evento.clientY - rectangulo.top) /
        rectangulo.height) *
        100,
      4,
      96,
    )

    return {
      pos_x: Number(posX.toFixed(2)),
      pos_y: Number(posY.toFixed(2)),
    }
  }

  function iniciarMovimiento(evento, mesa) {
    seleccionarMesa(mesa.id)

    if (!modoEdicion) return

    evento.preventDefault()
    evento.currentTarget.setPointerCapture(
      evento.pointerId,
    )

    setMesaArrastrandoId(mesa.id)
  }

  function mover(evento, mesa) {
    if (
      !modoEdicion ||
      Number(mesaArrastrandoId) !== Number(mesa.id)
    ) {
      return
    }

    const posicion = calcularPosicion(evento)

    if (!posicion) return

    moverMesa(mesa.id, posicion, false)
  }

  function terminarMovimiento(evento, mesa) {
    if (
      !modoEdicion ||
      Number(mesaArrastrandoId) !== Number(mesa.id)
    ) {
      return
    }

    const posicion = calcularPosicion(evento)

    setMesaArrastrandoId(null)

    if (!posicion) return

    moverMesa(mesa.id, posicion, true)
  }

  return (
    <div
      ref={mapaRef}
      className={`restaurant-map ${
        modoEdicion ? 'layout-editing' : ''
      }`}
    >
      <div className="zone terrace">
        <div className="zone-title">
          TERRAZA
        </div>

        <div className="plant p1" />
        <div className="plant p2" />
        <div className="umbrella u1" />
        <div className="umbrella u2" />
      </div>

      <div className="zone dining">
        <div className="zone-title">
          SALÓN PRINCIPAL
        </div>

        <div className="rug" />
        <div className="plant p3" />
        <div className="plant p4" />
      </div>

      <div className="zone bar">
        <div className="zone-title">
          BAR
        </div>

        <div className="bar-counter" />
        <div className="bar-stool s1" />
        <div className="bar-stool s2" />
        <div className="bar-stool s3" />
        <div className="bar-stool s4" />
      </div>

      <div className="zone reception">
        <div className="zone-title">
          RECEPCIÓN
        </div>

        <div className="host-desk" />
      </div>

      <div className="zone kitchen">
        <div className="zone-title">
          COCINA
        </div>

        <div className="kitchen-counter k1" />
        <div className="kitchen-counter k2" />
        <div className="kitchen-counter k3" />
      </div>

      <div className="zone vip">
        <div className="zone-title">
          FONDA VIP
        </div>
      </div>

      <div className="entrance-label">
        ENTRADA
      </div>

      <div className="table-layer">
        {mesas
          .filter((mesa) => mesa.activo !== false)
          .map((mesa) => {
            const layout = obtenerLayout(mesa.id)

            const visible = coincideConFiltros(
              mesa,
              layout,
            )

            const forma =
              formas[layout?.forma] || 'round'

            return (
              <button
                key={mesa.id}
                type="button"
                className={[
                  'floor-table',
                  forma,
                  `state-${mesa.estado}`,
                  Number(mesaSeleccionadaId) ===
                  Number(mesa.id)
                    ? 'selected'
                    : '',
                  !visible ? 'filtered' : '',
                  Number(mesaArrastrandoId) ===
                  Number(mesa.id)
                    ? 'dragging'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${layout?.pos_x ?? 50}%`,
                  top: `${layout?.pos_y ?? 50}%`,
                }}
                onPointerDown={(evento) =>
                  iniciarMovimiento(evento, mesa)
                }
                onPointerMove={(evento) =>
                  mover(evento, mesa)
                }
                onPointerUp={(evento) =>
                  terminarMovimiento(evento, mesa)
                }
                onPointerCancel={() =>
                  setMesaArrastrandoId(null)
                }
                title={
                  modoEdicion
                    ? `Mover Mesa ${mesa.numero}`
                    : `Seleccionar Mesa ${mesa.numero}`
                }
              >
                <span className="table-badge">
                  Mesa {mesa.numero}
                </span>
              </button>
            )
          })}
      </div>
    </div>
  )
}

export default RestaurantMap
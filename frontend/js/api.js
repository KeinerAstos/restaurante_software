const API_BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`${API_BASE}${path}`, config);

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload?.detail
        ? (typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail))
        : `Error HTTP ${response.status}`;

    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  health: () => request("/health"),
  healthDatabase: () => request("/health/database"),

  getMesas: () => request("/api/mesas"),
  getMesa: (id) => request(`/api/mesas/${id}`),
  createMesa: (data) => request("/api/mesas", { method: "POST", body: JSON.stringify(data) }),
  updateMesa: (id, data) => request(`/api/mesas/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getProductos: () => request("/api/productos"),
  getProducto: (id) => request(`/api/productos/${id}`),
  createProducto: (data) => request("/api/productos", { method: "POST", body: JSON.stringify(data) }),
  updateProducto: (id, data) => request(`/api/productos/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getPedidos: () => request("/api/pedidos"),
  getPedido: (id) => request(`/api/pedidos/${id}`),
  getPedidosMesa: (mesaId) => request(`/api/mesas/${mesaId}/pedidos`),
  createPedido: (mesaId) => request("/api/pedidos", { method: "POST", body: JSON.stringify({ mesa_id: mesaId }) }),
  addItem: (pedidoId, data) => request(`/api/pedidos/${pedidoId}/items`, { method: "POST", body: JSON.stringify(data) }),
  updateItem: (pedidoId, itemId, data) => request(`/api/pedidos/${pedidoId}/items/${itemId}`, { method: "PUT", body: JSON.stringify(data) }),
  removeItem: (pedidoId, itemId) => request(`/api/pedidos/${pedidoId}/items/${itemId}`, { method: "DELETE" }),
  changeOrderStatus: (pedidoId, estado) => request(`/api/pedidos/${pedidoId}/estado`, { method: "PUT", body: JSON.stringify({ estado }) }),

  getClientes: (includeInactive = false, search = "") => {
    const params = new URLSearchParams();
    params.set("include_inactive", String(includeInactive));
    if (search) params.set("search", search);
    return request(`/api/clientes?${params.toString()}`);
  },
  getCliente: (id) => request(`/api/clientes/${id}`),
  createCliente: (data) => request("/api/clientes", { method: "POST", body: JSON.stringify(data) }),
  updateCliente: (id, data) => request(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivateCliente: (id) => request(`/api/clientes/${id}`, { method: "DELETE" }),

  getReservas: () => request("/api/reservas"),
  getReserva: (id) => request(`/api/reservas/${id}`),
  createReserva: (data) => request("/api/reservas", { method: "POST", body: JSON.stringify(data) }),
  updateReserva: (id, data) => request(`/api/reservas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  changeReservationStatus: (id, estado) => request(`/api/reservas/${id}/estado`, { method: "PUT", body: JSON.stringify({ estado }) }),

  getLayout: () => request("/api/layout/mesas"),
  getLayoutMesa: (mesaId) => request(`/api/layout/mesas/${mesaId}`),
  updateLayoutMesa: (mesaId, data) => request(`/api/layout/mesas/${mesaId}`, { method: "PUT", body: JSON.stringify(data) }),

  getConfiguracion: () => request("/api/configuracion/restaurante"),
  updateConfiguracion: (data) => request("/api/configuracion/restaurante", { method: "PUT", body: JSON.stringify(data) }),

  getReportDashboard: () => request("/api/reportes/dashboard"),
  getReportProductos: (limit = 10) => request(`/api/reportes/productos?limit=${limit}`),
};
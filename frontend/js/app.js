import { api } from "./api.js";

const ACTIVE_ORDER_STATES = new Set(["ABIERTO","EN_PREPARACION","LISTO","ENTREGADO"]);
const NEXT_ORDER_STATE = {
  ABIERTO: "EN_PREPARACION",
  EN_PREPARACION: "LISTO",
  LISTO: "ENTREGADO",
  ENTREGADO: "PAGADO",
};
const NEXT_ORDER_LABEL = {
  ABIERTO: "Enviar a cocina",
  EN_PREPARACION: "Marcar listo",
  LISTO: "Marcar entregado",
  ENTREGADO: "Cerrar y pagar",
};

const RESERVATION_TRANSITIONS = {
  PENDIENTE: ["CONFIRMADA","CANCELADA","NO_ASISTIO"],
  CONFIRMADA: ["EN_MESA","CANCELADA","NO_ASISTIO"],
  EN_MESA: ["COMPLETADA","CANCELADA"],
  COMPLETADA: [],
  CANCELADA: [],
  NO_ASISTIO: [],
};

const viewMeta = {
  mesas: { eyebrow:"OPERACIÓN DEL RESTAURANTE", title:"Administración de mesas", subtitle:"Controla tu restaurante, crea grandes experiencias.", action:"+ Nueva mesa" },
  pedidos: { eyebrow:"SEGUIMIENTO", title:"Pedidos", subtitle:"Control operativo e historial de atención.", action:null },
  reservas: { eyebrow:"AGENDA", title:"Reservas", subtitle:"Planifica visitas y asigna mesas con anticipación.", action:"+ Nueva reserva" },
  menu: { eyebrow:"CUCINA ITALIANA", title:"Menú", subtitle:"Productos, disponibilidad y precios.", action:"+ Nuevo producto" },
  clientes: { eyebrow:"RELACIONES", title:"Clientes", subtitle:"Información de clientes y relación con reservas.", action:"+ Nuevo cliente" },
  cocina: { eyebrow:"OPERACIÓN DE COCINA", title:"Comandas", subtitle:"Pedidos pendientes, en preparación y listos.", action:null },
  reportes: { eyebrow:"INTELIGENCIA DEL NEGOCIO", title:"Reportes", subtitle:"Ventas, comportamiento y productos destacados.", action:null },
  configuracion: { eyebrow:"ADMINISTRACIÓN", title:"Configuración", subtitle:"Identidad e información general de Trattoria Bellavista.", action:null },
};

const state = {
  currentView: "mesas",
  mesas: [],
  productos: [],
  pedidos: [],
  pedidoDetails: new Map(),
  clientes: [],
  reservas: [],
  layouts: [],
  config: null,
  report: null,
  reportProducts: [],
  selectedMesaId: null,
  menuCategory: "TODOS",
  layoutEditMode: false,
  draggingMesaId: null,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const refs = {
  apiDot: $("#apiDot"), apiStatus: $("#apiStatus"),
  pageEyebrow: $("#pageEyebrow"), pageTitle: $("#pageTitle"), pageSubtitle: $("#pageSubtitle"),
  currentDate: $("#currentDate"), currentTime: $("#currentTime"), refreshButton: $("#refreshButton"), contextAction: $("#contextAction"),
  statTotal: $("#statTotal"), statFree: $("#statFree"), statOccupied: $("#statOccupied"), statOrders: $("#statOrders"),
  areaFilter: $("#areaFilter"), tableSearch: $("#tableSearch"), tableLayer: $("#tableLayer"), restaurantMap: $("#restaurantMap"),
  layoutEditButton: $("#layoutEditButton"), layoutModeBanner: $("#layoutModeBanner"),
  selectedTableCard: $("#selectedTableCard"), recentOrders: $("#recentOrders"),
  activeOrders: $("#activeOrders"), orderHistory: $("#orderHistory"),
  reservationStatusFilter: $("#reservationStatusFilter"), reservationSummary: $("#reservationSummary"), reservationsTable: $("#reservationsTable"),
  menuCategories: $("#menuCategories"), menuGrid: $("#menuGrid"),
  clientSearch: $("#clientSearch"), clientsTable: $("#clientsTable"),
  kitchenPending: $("#kitchenPending"), kitchenPreparing: $("#kitchenPreparing"), kitchenReady: $("#kitchenReady"),
  kitchenPendingCount: $("#kitchenPendingCount"), kitchenPreparingCount: $("#kitchenPreparingCount"), kitchenReadyCount: $("#kitchenReadyCount"),
  reportSales: $("#reportSales"), reportOrders: $("#reportOrders"), reportTicket: $("#reportTicket"), reportReservations: $("#reportReservations"),
  productRanking: $("#productRanking"), topTable: $("#topTable"), topProduct: $("#topProduct"),
  configForm: $("#configForm"), configName: $("#configName"), configSpecialty: $("#configSpecialty"), configCurrency: $("#configCurrency"),
  configCity: $("#configCity"), configPhone: $("#configPhone"), configAddress: $("#configAddress"), configHours: $("#configHours"),
  configPreviewName: $("#configPreviewName"), configPreviewSpecialty: $("#configPreviewSpecialty"), configPreviewCity: $("#configPreviewCity"),
  mesaDialog: $("#mesaDialog"), mesaForm: $("#mesaForm"), mesaDialogTitle: $("#mesaDialogTitle"), mesaId: $("#mesaId"), mesaNumero: $("#mesaNumero"), mesaCapacidad: $("#mesaCapacidad"), mesaUbicacion: $("#mesaUbicacion"),
  productDialog: $("#productDialog"), productForm: $("#productForm"), productDialogTitle: $("#productDialogTitle"), productId: $("#productId"), productName: $("#productName"), productDescription: $("#productDescription"), productPrice: $("#productPrice"), productCategory: $("#productCategory"), productAvailable: $("#productAvailable"),
  clientDialog: $("#clientDialog"), clientForm: $("#clientForm"), clientDialogTitle: $("#clientDialogTitle"), clientId: $("#clientId"), clientName: $("#clientName"), clientPhone: $("#clientPhone"), clientEmail: $("#clientEmail"), clientNotes: $("#clientNotes"),
  reservationDialog: $("#reservationDialog"), reservationForm: $("#reservationForm"), reservationDialogTitle: $("#reservationDialogTitle"), reservationId: $("#reservationId"), reservationClient: $("#reservationClient"), reservationTable: $("#reservationTable"), reservationPeople: $("#reservationPeople"), reservationDateTime: $("#reservationDateTime"), reservationNotes: $("#reservationNotes"),
  toastContainer: $("#toastContainer"),
};

function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function money(value){return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(value||0))}
function statusLabel(v){
  const m={LIBRE:"Libre",OCUPADA:"Ocupada",RESERVADA:"Reservada",FUERA_DE_SERVICIO:"Fuera de servicio",ABIERTO:"Abierto",EN_PREPARACION:"En preparación",LISTO:"Listo",ENTREGADO:"Entregado",PAGADO:"Pagado",CANCELADO:"Cancelado",PENDIENTE:"Pendiente",CONFIRMADA:"Confirmada",EN_MESA:"En mesa",COMPLETADA:"Completada",CANCELADA:"Cancelada",NO_ASISTIO:"No asistió"};
  return m[v]||v;
}
function categoryLabel(v){return {ENTRADA:"Entrada",PLATO_FUERTE:"Plato fuerte",BEBIDA:"Bebida",POSTRE:"Postre",OTRO:"Otro"}[v]||v}
function productInitial(name){return (String(name||"?").trim()[0]||"?").toUpperCase()}
function setConnection(ok){refs.apiDot.classList.toggle("ok",ok);refs.apiDot.classList.toggle("error",!ok);refs.apiStatus.textContent=ok?"Conectado":"Sin conexión"}
function toast(title,message="",type=""){const el=document.createElement("div");el.className=`toast ${type}`;el.innerHTML=`<strong>${escapeHtml(title)}</strong>${message?`<span>${escapeHtml(message)}</span>`:""}`;refs.toastContainer.append(el);setTimeout(()=>el.remove(),3600)}
function updateClock(){const n=new Date();refs.currentDate.textContent=new Intl.DateTimeFormat("es-CO",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(n);refs.currentTime.textContent=new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit",hour12:false}).format(n)}
function activeMesas(){return state.mesas.filter(m=>m.activo)}
function activePedidos(){return state.pedidos.filter(p=>ACTIVE_ORDER_STATES.has(p.estado))}
function mapById(items){return new Map(items.map(x=>[Number(x.id),x]))}
function layoutByMesa(){return new Map(state.layouts.map(x=>[Number(x.mesa_id),x]))}
function getMesa(id){return state.mesas.find(x=>Number(x.id)===Number(id))}
function getCliente(id){return state.clientes.find(x=>Number(x.id)===Number(id))}
function getProducto(id){return state.productos.find(x=>Number(x.id)===Number(id))}
function formatDateTime(value){if(!value)return "—";return new Intl.DateTimeFormat("es-CO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value))}
function zoneLabel(z){return {SALON:"Salón principal",TERRAZA:"Terraza",VIP:"Sala privada VIP",BAR:"Bar",OTRA:"Otra"}[z]||z}

function renderStats(){
  const mesas=activeMesas();
  refs.statTotal.textContent=mesas.length;
  refs.statFree.textContent=mesas.filter(m=>m.estado==="LIBRE").length;
  refs.statOccupied.textContent=mesas.filter(m=>m.estado==="OCUPADA").length;
  refs.statOrders.textContent=activePedidos().length;
}

async function refreshAll({silent=true,preserveSelection=true}={}){
  try{
    const [mesas,productos,pedidos,clientes,reservas,layouts,config,report,reportProducts]=await Promise.all([
      api.getMesas(),api.getProductos(),api.getPedidos(),api.getClientes(true),api.getReservas(),api.getLayout(),api.getConfiguracion(),api.getReportDashboard(),api.getReportProductos(10)
    ]);
    state.mesas=Array.isArray(mesas)?mesas:[];
    state.productos=Array.isArray(productos)?productos:[];
    state.pedidos=Array.isArray(pedidos)?pedidos:[];
    state.clientes=Array.isArray(clientes)?clientes:[];
    state.reservas=Array.isArray(reservas)?reservas:[];
    state.layouts=Array.isArray(layouts)?layouts:[];
    state.config=config;
    state.report=report;
    state.reportProducts=Array.isArray(reportProducts)?reportProducts:[];

    const active=state.pedidos.filter(p=>ACTIVE_ORDER_STATES.has(p.estado));
    const details=await Promise.all(active.map(async p=>{try{return await api.getPedido(p.id)}catch{return null}}));
    state.pedidoDetails=new Map(details.filter(Boolean).map(p=>[Number(p.id),p]));

    setConnection(true);
    renderAll();

    if(preserveSelection&&state.selectedMesaId&&state.mesas.some(m=>Number(m.id)===Number(state.selectedMesaId))){
      await selectMesa(state.selectedMesaId,{skipMap:true});
    }
    if(!silent)toast("Información actualizada");
  }catch(e){setConnection(false);toast("No fue posible actualizar",e.message,"error")}
}

function renderAll(){
  renderStats();renderMap();renderRecentOrders();renderOrders();renderReservations();renderMenu();renderClients();renderKitchen();renderReports();renderConfig();
}

function showView(view){
  state.currentView=view;
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>v.classList.remove("active"));
  $(`#view${view[0].toUpperCase()}${view.slice(1)}`)?.classList.add("active");

  const meta=viewMeta[view];
  refs.pageEyebrow.textContent=meta.eyebrow;refs.pageTitle.textContent=meta.title;refs.pageSubtitle.textContent=meta.subtitle;
  if(meta.action){refs.contextAction.classList.remove("hidden");refs.contextAction.textContent=meta.action}else refs.contextAction.classList.add("hidden");

  if(view==="reportes")renderReports();
  if(view==="cocina")renderKitchen();
}

function handleContextAction(){
  if(state.currentView==="mesas")openMesaDialog();
  if(state.currentView==="menu")openProductDialog();
  if(state.currentView==="clientes")openClientDialog();
  if(state.currentView==="reservas")openReservationDialog();
}

function renderMap(){
  const layouts=layoutByMesa(), area=refs.areaFilter.value, search=refs.tableSearch.value.trim().toLowerCase();
  const mesas=activeMesas().filter(m=>layouts.has(Number(m.id))).sort((a,b)=>a.numero-b.numero);

  refs.tableLayer.innerHTML=mesas.map(m=>{
    const l=layouts.get(Number(m.id));
    const areaOk=area==="TODAS"||l.zona===area;
    const searchOk=!search||String(m.numero).includes(search)||zoneLabel(l.zona).toLowerCase().includes(search);
    const shape=l.forma==="RECT"?"rect":l.forma==="SMALL"?"small":"round";
    return `<button class="floor-table ${shape} state-${m.estado} ${Number(state.selectedMesaId)===Number(m.id)?"selected":""} ${areaOk&&searchOk?"":"filtered"}"
      style="left:${Number(l.pos_x)}%;top:${Number(l.pos_y)}%" data-mesa-id="${m.id}" title="Mesa ${m.numero} · ${zoneLabel(l.zona)}">
      <span class="table-badge">Mesa ${m.numero}</span></button>`;
  }).join("");

  refs.tableLayer.querySelectorAll("[data-mesa-id]").forEach(el=>{
    el.addEventListener("click",()=>{if(!state.layoutEditMode)selectMesa(Number(el.dataset.mesaId))});
    el.addEventListener("pointerdown",ev=>startTableDrag(ev,el));
  });
}

function startTableDrag(event,el){
  if(!state.layoutEditMode)return;
  event.preventDefault();
  const mesaId=Number(el.dataset.mesaId);
  state.draggingMesaId=mesaId;
  el.classList.add("dragging");el.setPointerCapture(event.pointerId);

  const move=ev=>{
    const rect=refs.restaurantMap.getBoundingClientRect();
    let x=((ev.clientX-rect.left)/rect.width)*100;
    let y=((ev.clientY-rect.top)/rect.height)*100;
    x=Math.max(2,Math.min(98,x));y=Math.max(3,Math.min(97,y));
    el.style.left=`${x}%`;el.style.top=`${y}%`;
  };

  const up=async ev=>{
    el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.classList.remove("dragging");
    const rect=refs.restaurantMap.getBoundingClientRect();
    let x=Math.max(2,Math.min(98,((ev.clientX-rect.left)/rect.width)*100));
    let y=Math.max(3,Math.min(97,((ev.clientY-rect.top)/rect.height)*100));
    const current=state.layouts.find(l=>Number(l.mesa_id)===mesaId);
    try{
      const updated=await api.updateLayoutMesa(mesaId,{pos_x:Number(x.toFixed(2)),pos_y:Number(y.toFixed(2)),zona:current.zona,forma:current.forma});
      const idx=state.layouts.findIndex(l=>Number(l.mesa_id)===mesaId);if(idx>=0)state.layouts[idx]=updated;
      toast("Posición guardada",`Mesa ${getMesa(mesaId)?.numero}`);
    }catch(e){toast("No fue posible guardar la posición",e.message,"error");renderMap()}
    state.draggingMesaId=null;
  };

  el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);
}

async function selectMesa(id,{skipMap=false}={}){
  state.selectedMesaId=id;if(!skipMap)renderMap();
  const mesa=getMesa(id), layouts=layoutByMesa(), l=layouts.get(Number(id));
  if(!mesa)return;
  const pedidosMesa=state.pedidos.filter(p=>Number(p.mesa_id)===Number(id));
  const active=pedidosMesa.find(p=>ACTIVE_ORDER_STATES.has(p.estado));
  let pedido=active?state.pedidoDetails.get(Number(active.id)):null;
  if(active&&!pedido){try{pedido=await api.getPedido(active.id);state.pedidoDetails.set(Number(active.id),pedido)}catch{}}

  refs.selectedTableCard.innerHTML=`
    <div class="selected-hero"><div><span class="eyebrow light">${escapeHtml(zoneLabel(l?.zona||"OTRA").toUpperCase())}</span><h2>Mesa ${mesa.numero}</h2><p>${mesa.capacidad} personas · ${statusLabel(mesa.estado)}</p></div></div>
    <div class="selected-body">
      <div class="selected-topline"><span class="status-pill status-${mesa.estado}">${statusLabel(mesa.estado)}</span><button id="editSelectedMesa" class="text-button">Editar mesa</button></div>
      <div class="info-list">
        <div class="info-line"><span>◉</span><span><strong>${mesa.capacidad}</strong> personas de capacidad</span></div>
        <div class="info-line"><span>⌖</span><span>${escapeHtml(zoneLabel(l?.zona||"OTRA"))}</span></div>
        <div class="info-line"><span>⌂</span><span>${pedido?`Pedido <strong>#${pedido.id}</strong> · ${statusLabel(pedido.estado)}`:"Sin pedido activo"}</span></div>
      </div>
      ${pedido?renderOrderDetail(mesa,pedido):renderMesaActions(mesa)}
    </div>`;

  $("#editSelectedMesa")?.addEventListener("click",()=>openMesaDialog(mesa));
  wireTableActions(mesa,pedido);
}

function renderMesaActions(mesa){
  const canOpen=["LIBRE","RESERVADA"].includes(mesa.estado);
  return `<div class="selected-actions">
    ${mesa.estado==="LIBRE"?`<button id="reserveMesa" class="button secondary full">Reservar mesa manualmente</button>`:""}
    ${mesa.estado==="RESERVADA"?`<button id="releaseMesa" class="button secondary full">Liberar reserva manual</button>`:""}
    ${canOpen?`<button id="openOrder" class="button primary full">Abrir pedido</button>`:""}
  </div>`;
}

function renderOrderDetail(mesa,pedido){
  const pmap=mapById(state.productos);
  const items=(pedido.items||[]).map(i=>{const p=pmap.get(Number(i.producto_id));return `<div class="item-mini"><div><strong>${escapeHtml(p?.nombre||`Producto ${i.producto_id}`)}</strong><span>${money(i.subtotal)}${i.observacion?` · ${escapeHtml(i.observacion)}`:""}</span></div><div class="item-mini-actions"><button class="qty-btn" data-item-action="minus" data-item="${i.id}" data-qty="${i.cantidad}">−</button><strong>${i.cantidad}</strong><button class="qty-btn" data-item-action="plus" data-item="${i.id}" data-qty="${i.cantidad}">+</button><button class="remove-mini" data-item-action="remove" data-item="${i.id}">Quitar</button></div></div>`}).join("")||`<div class="empty-state">El pedido aún no tiene productos.</div>`;
  const available=state.productos.filter(p=>p.disponible);
  return `<div class="order-detail">
    <div class="order-head"><strong>Pedido #${pedido.id}</strong><span class="order-total">${money(pedido.total)}</span></div>
    <div class="items-mini">${items}</div>
    <form id="addItemForm" class="add-form">
      <div class="row"><select id="orderProduct" required><option value="">Agregar producto...</option>${available.map(p=>`<option value="${p.id}">${escapeHtml(p.nombre)} · ${money(p.precio)}</option>`).join("")}</select><input id="orderQty" type="number" min="1" max="100" value="1" required></div>
      <textarea id="orderNote" placeholder="Observación opcional"></textarea><button class="button secondary full">+ Agregar</button>
    </form>
    <div class="selected-actions">${NEXT_ORDER_STATE[pedido.estado]?`<button id="advanceOrder" class="button primary full">${NEXT_ORDER_LABEL[pedido.estado]}</button>`:""}<button id="cancelOrder" class="button danger full">Cancelar pedido</button></div>
  </div>`;
}

function wireTableActions(mesa,pedido){
  $("#reserveMesa")?.addEventListener("click",()=>changeMesaStatus(mesa.id,"RESERVADA"));
  $("#releaseMesa")?.addEventListener("click",()=>changeMesaStatus(mesa.id,"LIBRE"));
  $("#openOrder")?.addEventListener("click",async()=>{try{await api.createPedido(mesa.id);toast("Pedido abierto",`Mesa ${mesa.numero}`);await refreshAll({silent:true})}catch(e){toast("No fue posible abrir pedido",e.message,"error")}});

  if(!pedido)return;
  refs.selectedTableCard.querySelectorAll("[data-item-action]").forEach(b=>b.addEventListener("click",async()=>{
    const id=Number(b.dataset.item),qty=Number(b.dataset.qty),action=b.dataset.itemAction;
    try{
      if(action==="plus")await api.updateItem(pedido.id,id,{cantidad:qty+1});
      if(action==="minus"&&qty>1)await api.updateItem(pedido.id,id,{cantidad:qty-1});
      if(action==="remove")await api.removeItem(pedido.id,id);
      await refreshAll({silent:true});
    }catch(e){toast("No fue posible modificar el pedido",e.message,"error")}
  }));
  $("#addItemForm")?.addEventListener("submit",async ev=>{ev.preventDefault();try{await api.addItem(pedido.id,{producto_id:Number($("#orderProduct").value),cantidad:Number($("#orderQty").value),observacion:$("#orderNote").value.trim()||null});toast("Producto agregado");await refreshAll({silent:true})}catch(e){toast("No fue posible agregar producto",e.message,"error")}});
  $("#advanceOrder")?.addEventListener("click",async()=>{const next=NEXT_ORDER_STATE[pedido.estado];if(!next)return;try{await api.changeOrderStatus(pedido.id,next);toast("Pedido actualizado",statusLabel(next));await refreshAll({silent:true})}catch(e){toast("No fue posible actualizar",e.message,"error")}});
  $("#cancelOrder")?.addEventListener("click",async()=>{if(!confirm("¿Cancelar este pedido?"))return;try{await api.changeOrderStatus(pedido.id,"CANCELADO");toast("Pedido cancelado");await refreshAll({silent:true})}catch(e){toast("No fue posible cancelar",e.message,"error")}});
}

async function changeMesaStatus(id,estado){try{await api.updateMesa(id,{estado});toast("Mesa actualizada",statusLabel(estado));await refreshAll({silent:true})}catch(e){toast("No fue posible actualizar la mesa",e.message,"error")}}

function renderRecentOrders(){
  const mmap=mapById(state.mesas), items=[...state.pedidos].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  refs.recentOrders.innerHTML=items.length?items.map(p=>`<button class="recent-order" data-recent-mesa="${p.mesa_id}"><span class="dot ${ACTIVE_ORDER_STATES.has(p.estado)?"active":p.estado==="PAGADO"?"done":""}"></span><span><strong>#${p.id} · Mesa ${mmap.get(Number(p.mesa_id))?.numero??p.mesa_id}</strong><span>${statusLabel(p.estado)} · ${money(p.total)}</span></span><time>${new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(p.created_at))}</time></button>`).join(""):`<div class="empty-state">Sin pedidos registrados.</div>`;
  refs.recentOrders.querySelectorAll("[data-recent-mesa]").forEach(b=>b.addEventListener("click",()=>{showView("mesas");selectMesa(Number(b.dataset.recentMesa))}));
}

function renderOrders(){
  const mmap=mapById(state.mesas), list=[...state.pedidos].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)), active=list.filter(p=>ACTIVE_ORDER_STATES.has(p.estado)), history=list.filter(p=>!ACTIVE_ORDER_STATES.has(p.estado));
  const card=p=>`<button class="order-card" data-order-mesa="${p.mesa_id}"><span class="number">#${p.id}</span><span><strong>Mesa ${mmap.get(Number(p.mesa_id))?.numero??p.mesa_id}</strong><span>${statusLabel(p.estado)} · ${formatDateTime(p.created_at)}</span></span><span class="amount">${money(p.total)}</span></button>`;
  refs.activeOrders.innerHTML=active.length?active.map(card).join(""):`<div class="empty-state">No hay pedidos activos.</div>`;
  refs.orderHistory.innerHTML=history.length?history.slice(0,20).map(card).join(""):`<div class="empty-state">Sin historial.</div>`;
  $$("#viewPedidos [data-order-mesa]").forEach(b=>b.addEventListener("click",()=>{showView("mesas");selectMesa(Number(b.dataset.orderMesa))}));
}

function renderReservations(){
  const cmap=mapById(state.clientes), mmap=mapById(state.mesas), filter=refs.reservationStatusFilter.value;
  const rows=[...state.reservas].sort((a,b)=>new Date(a.fecha_hora)-new Date(b.fecha_hora)).filter(r=>filter==="TODAS"||r.estado===filter);
  const active=state.reservas.filter(r=>["PENDIENTE","CONFIRMADA","EN_MESA"].includes(r.estado));
  refs.reservationSummary.innerHTML=`<div class="mini-stat"><span>Activas</span><strong>${active.length}</strong></div><div class="mini-stat"><span>Pendientes</span><strong>${active.filter(r=>r.estado==="PENDIENTE").length}</strong></div><div class="mini-stat"><span>Confirmadas</span><strong>${active.filter(r=>r.estado==="CONFIRMADA").length}</strong></div>`;
  refs.reservationsTable.innerHTML=rows.length?rows.map(r=>{
    const c=cmap.get(Number(r.cliente_id)),m=mmap.get(Number(r.mesa_id)),actions=RESERVATION_TRANSITIONS[r.estado]||[];
    const actionButtons=actions.map(st=>`<button class="action-chip ${["CANCELADA","NO_ASISTIO"].includes(st)?"danger":""}" data-res-status="${st}" data-res-id="${r.id}">${st==="CONFIRMADA"?"Confirmar":st==="EN_MESA"?"Sentar":st==="COMPLETADA"?"Completar":st==="CANCELADA"?"Cancelar":"No asistió"}</button>`).join("");
    return `<tr><td><strong>${formatDateTime(r.fecha_hora)}</strong><small>${escapeHtml(r.observaciones||"Sin observaciones")}</small></td><td><strong>${escapeHtml(c?.nombre||`Cliente ${r.cliente_id}`)}</strong><small>${escapeHtml(c?.telefono||"")}</small></td><td>Mesa ${m?.numero??r.mesa_id}</td><td>${r.personas}</td><td><span class="status-pill status-${r.estado}">${statusLabel(r.estado)}</span></td><td><div class="table-actions">${["PENDIENTE","CONFIRMADA"].includes(r.estado)?`<button class="action-chip" data-edit-res="${r.id}">Editar</button>`:""}${actionButtons}${r.estado==="CONFIRMADA"?`<button class="action-chip" data-seat-order="${r.id}">Sentar + pedido</button>`:""}</div></td></tr>`;
  }).join(""):`<tr><td colspan="6"><div class="empty-state">No hay reservas para este filtro.</div></td></tr>`;

  refs.reservationsTable.querySelectorAll("[data-res-status]").forEach(b=>b.addEventListener("click",()=>changeReservationStatus(Number(b.dataset.resId),b.dataset.resStatus)));
  refs.reservationsTable.querySelectorAll("[data-edit-res]").forEach(b=>b.addEventListener("click",()=>openReservationDialog(state.reservas.find(r=>Number(r.id)===Number(b.dataset.editRes)))));
  refs.reservationsTable.querySelectorAll("[data-seat-order]").forEach(b=>b.addEventListener("click",()=>seatAndOpenOrder(Number(b.dataset.seatOrder))));
}

async function changeReservationStatus(id,status){try{await api.changeReservationStatus(id,status);toast("Reserva actualizada",statusLabel(status));await refreshAll({silent:true})}catch(e){toast("No fue posible actualizar la reserva",e.message,"error")}}
async function seatAndOpenOrder(id){const r=state.reservas.find(x=>Number(x.id)===id);if(!r)return;try{await api.changeReservationStatus(id,"EN_MESA");await api.createPedido(r.mesa_id);toast("Cliente sentado","Mesa ocupada y pedido abierto.");await refreshAll({silent:true});showView("mesas");selectMesa(r.mesa_id)}catch(e){toast("No fue posible sentar al cliente",e.message,"error")}}

function renderMenu(){
  const items=state.productos.filter(p=>state.menuCategory==="TODOS"||p.categoria===state.menuCategory).sort((a,b)=>a.categoria.localeCompare(b.categoria)||a.nombre.localeCompare(b.nombre));
  refs.menuGrid.innerHTML=items.length?items.map(p=>`<article class="product-card"><div class="product-art ${p.categoria}">${productInitial(p.nombre)}</div><div class="product-card-body"><div class="product-card-head"><div><span class="status-pill ${p.disponible?"status-LIBRE":"status-FUERA_DE_SERVICIO"}">${p.disponible?"Disponible":"No disponible"}</span><h3>${escapeHtml(p.nombre)}</h3></div><span class="product-price">${money(p.precio)}</span></div><p>${escapeHtml(p.descripcion||categoryLabel(p.categoria))}</p><div class="product-footer"><small>${categoryLabel(p.categoria)}</small><div class="table-actions"><button class="action-chip" data-edit-product="${p.id}">Editar</button><button class="action-chip" data-toggle-product="${p.id}">${p.disponible?"Desactivar":"Activar"}</button></div></div></div></article>`).join(""):`<div class="empty-state">No hay productos en esta categoría.</div>`;
  refs.menuGrid.querySelectorAll("[data-edit-product]").forEach(b=>b.addEventListener("click",()=>openProductDialog(getProducto(Number(b.dataset.editProduct)))));
  refs.menuGrid.querySelectorAll("[data-toggle-product]").forEach(b=>b.addEventListener("click",async()=>{const p=getProducto(Number(b.dataset.toggleProduct));try{await api.updateProducto(p.id,{disponible:!p.disponible});toast("Disponibilidad actualizada");await refreshAll({silent:true})}catch(e){toast("No fue posible actualizar",e.message,"error")}}));
}

function renderClients(){
  const q=refs.clientSearch.value.trim().toLowerCase();
  const rows=[...state.clientes].filter(c=>!q||c.nombre.toLowerCase().includes(q)||(c.telefono||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  refs.clientsTable.innerHTML=rows.length?rows.map(c=>`<tr><td><strong>${escapeHtml(c.nombre)}</strong><small>${escapeHtml(c.observaciones||"")}</small></td><td>${escapeHtml(c.telefono||"—")}</td><td>${escapeHtml(c.email||"—")}</td><td><span class="status-pill ${c.activo?"status-LIBRE":"status-FUERA_DE_SERVICIO"}">${c.activo?"Activo":"Inactivo"}</span></td><td><div class="table-actions"><button class="action-chip" data-edit-client="${c.id}">Editar</button>${c.activo?`<button class="action-chip danger" data-deactivate-client="${c.id}">Desactivar</button>`:""}</div></td></tr>`).join(""):`<tr><td colspan="5"><div class="empty-state">No hay clientes.</div></td></tr>`;
  refs.clientsTable.querySelectorAll("[data-edit-client]").forEach(b=>b.addEventListener("click",()=>openClientDialog(getCliente(Number(b.dataset.editClient)))));
  refs.clientsTable.querySelectorAll("[data-deactivate-client]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("¿Desactivar este cliente?"))return;try{await api.deactivateCliente(Number(b.dataset.deactivateClient));toast("Cliente desactivado");await refreshAll({silent:true})}catch(e){toast("No fue posible desactivar",e.message,"error")}}));
}

function renderKitchen(){
  const mmap=mapById(state.mesas),pmap=mapById(state.productos);
  const groups={ABIERTO:[],EN_PREPARACION:[],LISTO:[]};
  state.pedidos.filter(p=>groups[p.estado]).forEach(p=>groups[p.estado].push(state.pedidoDetails.get(Number(p.id))||p));
  refs.kitchenPendingCount.textContent=groups.ABIERTO.length;refs.kitchenPreparingCount.textContent=groups.EN_PREPARACION.length;refs.kitchenReadyCount.textContent=groups.LISTO.length;
  const ticket=(p,next,label)=>{const mesa=mmap.get(Number(p.mesa_id)),items=(p.items||[]).map(i=>{const prod=pmap.get(Number(i.producto_id));return `<div class="ticket-item"><b>${i.cantidad}×</b>${escapeHtml(prod?.nombre||`Producto ${i.producto_id}`)}${i.observacion?`<span class="ticket-note">${escapeHtml(i.observacion)}</span>`:""}</div>`}).join("")||`<div class="ticket-item">Sin detalle cargado</div>`;return `<article class="kitchen-ticket"><div class="ticket-head"><strong>#${p.id} · Mesa ${mesa?.numero??p.mesa_id}</strong><span class="status-pill status-${p.estado}">${statusLabel(p.estado)}</span></div><div class="ticket-items">${items}</div><button class="button ${next==="LISTO"?"primary":"secondary"} full" data-kitchen-order="${p.id}" data-kitchen-next="${next}">${label}</button></article>`};
  refs.kitchenPending.innerHTML=groups.ABIERTO.length?groups.ABIERTO.map(p=>ticket(p,"EN_PREPARACION","Iniciar preparación")).join(""):`<div class="empty-state">Sin pendientes.</div>`;
  refs.kitchenPreparing.innerHTML=groups.EN_PREPARACION.length?groups.EN_PREPARACION.map(p=>ticket(p,"LISTO","Marcar listo")).join(""):`<div class="empty-state">Nada en preparación.</div>`;
  refs.kitchenReady.innerHTML=groups.LISTO.length?groups.LISTO.map(p=>ticket(p,"ENTREGADO","Entregar a mesa")).join(""):`<div class="empty-state">Sin pedidos listos.</div>`;
  $("#viewCocina")?.querySelectorAll("[data-kitchen-order]").forEach(b=>b.addEventListener("click",async()=>{try{await api.changeOrderStatus(Number(b.dataset.kitchenOrder),b.dataset.kitchenNext);toast("Comanda actualizada",statusLabel(b.dataset.kitchenNext));await refreshAll({silent:true})}catch(e){toast("No fue posible actualizar",e.message,"error")}}));
}

function renderReports(){
  const r=state.report||{};
  refs.reportSales.textContent=money(r.ventas_hoy);refs.reportOrders.textContent=r.pedidos_hoy??0;refs.reportTicket.textContent=money(r.ticket_promedio);refs.reportReservations.textContent=r.reservas_hoy??0;
  refs.topTable.textContent=r.mesa_mas_utilizada?`Mesa ${r.mesa_mas_utilizada.numero} · ${r.mesa_mas_utilizada.pedidos} pedidos`:"Sin datos";
  refs.topProduct.textContent=r.producto_mas_vendido?`${r.producto_mas_vendido.nombre} · ${r.producto_mas_vendido.cantidad} unidades`:"Sin datos";
  const max=Math.max(1,...state.reportProducts.map(p=>Number(p.unidades||0)));
  refs.productRanking.innerHTML=state.reportProducts.length?state.reportProducts.map(p=>`<div class="rank-row"><strong>${escapeHtml(p.nombre)}</strong><div class="rank-track"><div class="rank-bar" style="width:${Math.max(4,(Number(p.unidades||0)/max)*100)}%"></div></div><span class="rank-value">${p.unidades} uds.</span></div>`).join(""):`<div class="empty-state">Sin datos de ventas.</div>`;
}

function renderConfig(){
  if(!state.config)return;
  refs.configName.value=state.config.nombre||"";refs.configSpecialty.value=state.config.especialidad||"";refs.configCurrency.value=state.config.moneda||"COP";refs.configCity.value=state.config.ciudad||"";refs.configPhone.value=state.config.telefono||"";refs.configAddress.value=state.config.direccion||"";refs.configHours.value=state.config.horario||"";
  refs.configPreviewName.textContent=state.config.nombre||"Trattoria Bellavista";refs.configPreviewSpecialty.textContent=state.config.especialidad||"Cucina Italiana";refs.configPreviewCity.textContent=state.config.ciudad||"";
}

function openMesaDialog(m=null){refs.mesaDialogTitle.textContent=m?`Editar Mesa ${m.numero}`:"Nueva mesa";refs.mesaId.value=m?.id||"";refs.mesaNumero.value=m?.numero||"";refs.mesaCapacidad.value=m?.capacidad||4;refs.mesaUbicacion.value=m?.ubicacion||"";refs.mesaDialog.showModal()}
function openProductDialog(p=null){refs.productDialogTitle.textContent=p?`Editar ${p.nombre}`:"Nuevo producto";refs.productId.value=p?.id||"";refs.productName.value=p?.nombre||"";refs.productDescription.value=p?.descripcion||"";refs.productPrice.value=p?Number(p.precio):"";refs.productCategory.value=p?.categoria||"PLATO_FUERTE";refs.productAvailable.checked=p?.disponible??true;refs.productDialog.showModal()}
function openClientDialog(c=null){refs.clientDialogTitle.textContent=c?`Editar ${c.nombre}`:"Nuevo cliente";refs.clientId.value=c?.id||"";refs.clientName.value=c?.nombre||"";refs.clientPhone.value=c?.telefono||"";refs.clientEmail.value=c?.email||"";refs.clientNotes.value=c?.observaciones||"";refs.clientDialog.showModal()}
function openReservationDialog(r=null){
  const activeClients=state.clientes.filter(c=>c.activo),activeTables=state.mesas.filter(m=>m.activo&&m.estado!=="FUERA_DE_SERVICIO");
  refs.reservationDialogTitle.textContent=r?"Editar reserva":"Nueva reserva";refs.reservationId.value=r?.id||"";
  refs.reservationClient.innerHTML=`<option value="">Seleccionar cliente</option>${activeClients.map(c=>`<option value="${c.id}">${escapeHtml(c.nombre)}${c.telefono?` · ${escapeHtml(c.telefono)}`:""}</option>`).join("")}`;
  refs.reservationTable.innerHTML=`<option value="">Seleccionar mesa</option>${activeTables.map(m=>`<option value="${m.id}">Mesa ${m.numero} · ${m.capacidad} personas</option>`).join("")}`;
  refs.reservationClient.value=r?.cliente_id||"";refs.reservationTable.value=r?.mesa_id||"";refs.reservationPeople.value=r?.personas||2;refs.reservationNotes.value=r?.observaciones||"";
  if(r){const d=new Date(r.fecha_hora);const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);refs.reservationDateTime.value=local}else{const d=new Date(Date.now()+86400000);d.setHours(19,0,0,0);const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);refs.reservationDateTime.value=local}
  refs.reservationDialog.showModal();
}

refs.mesaForm.addEventListener("submit",async e=>{e.preventDefault();const id=Number(refs.mesaId.value||0),payload={numero:Number(refs.mesaNumero.value),capacidad:Number(refs.mesaCapacidad.value),ubicacion:refs.mesaUbicacion.value.trim()||null};try{let mesa;if(id)mesa=await api.updateMesa(id,payload);else mesa=await api.createMesa({...payload,estado:"LIBRE"});if(!id){await api.updateLayoutMesa(mesa.id,{zona:"OTRA",pos_x:50,pos_y:50,forma:"ROUND"})}refs.mesaDialog.close();toast(id?"Mesa actualizada":"Mesa creada");await refreshAll({silent:true})}catch(err){toast("No fue posible guardar la mesa",err.message,"error")}});
refs.productForm.addEventListener("submit",async e=>{e.preventDefault();const id=Number(refs.productId.value||0),payload={nombre:refs.productName.value.trim(),descripcion:refs.productDescription.value.trim()||null,precio:Number(refs.productPrice.value),categoria:refs.productCategory.value,disponible:refs.productAvailable.checked};try{if(id)await api.updateProducto(id,payload);else await api.createProducto(payload);refs.productDialog.close();toast(id?"Producto actualizado":"Producto creado");await refreshAll({silent:true})}catch(err){toast("No fue posible guardar el producto",err.message,"error")}});
refs.clientForm.addEventListener("submit",async e=>{e.preventDefault();const id=Number(refs.clientId.value||0),payload={nombre:refs.clientName.value.trim(),telefono:refs.clientPhone.value.trim()||null,email:refs.clientEmail.value.trim()||null,observaciones:refs.clientNotes.value.trim()||null};try{if(id)await api.updateCliente(id,payload);else await api.createCliente(payload);refs.clientDialog.close();toast(id?"Cliente actualizado":"Cliente creado");await refreshAll({silent:true})}catch(err){toast("No fue posible guardar el cliente",err.message,"error")}});
refs.reservationForm.addEventListener("submit",async e=>{e.preventDefault();const id=Number(refs.reservationId.value||0),payload={mesa_id:Number(refs.reservationTable.value),cliente_id:Number(refs.reservationClient.value),fecha_hora:new Date(refs.reservationDateTime.value).toISOString(),personas:Number(refs.reservationPeople.value),observaciones:refs.reservationNotes.value.trim()||null};try{if(id)await api.updateReserva(id,payload);else await api.createReserva(payload);refs.reservationDialog.close();toast(id?"Reserva actualizada":"Reserva creada");await refreshAll({silent:true})}catch(err){toast("No fue posible guardar la reserva",err.message,"error")}});

refs.configForm.addEventListener("submit",async e=>{e.preventDefault();const payload={nombre:refs.configName.value.trim(),especialidad:refs.configSpecialty.value.trim(),moneda:refs.configCurrency.value.trim(),ciudad:refs.configCity.value.trim()||null,telefono:refs.configPhone.value.trim()||null,direccion:refs.configAddress.value.trim()||null,horario:refs.configHours.value.trim()||null};try{state.config=await api.updateConfiguracion(payload);renderConfig();toast("Configuración guardada")}catch(err){toast("No fue posible guardar",err.message,"error")}});

$$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-go-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goView)));
refs.contextAction.addEventListener("click",handleContextAction);refs.refreshButton.addEventListener("click",()=>refreshAll({silent:false}));
refs.areaFilter.addEventListener("change",renderMap);refs.tableSearch.addEventListener("input",renderMap);
refs.reservationStatusFilter.addEventListener("change",renderReservations);refs.clientSearch.addEventListener("input",renderClients);
refs.layoutEditButton.addEventListener("click",()=>{state.layoutEditMode=!state.layoutEditMode;refs.layoutEditButton.classList.toggle("active",state.layoutEditMode);refs.layoutEditButton.textContent=state.layoutEditMode?"Terminar edición":"Editar plano";refs.layoutModeBanner.classList.toggle("hidden",!state.layoutEditMode);toast(state.layoutEditMode?"Modo edición activado":"Modo edición finalizado")});
refs.menuCategories.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{state.menuCategory=b.dataset.category;refs.menuCategories.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x===b));renderMenu()}));
$$(".dialog").forEach(d=>{d.querySelectorAll(".dialog-close,.dialog-cancel").forEach(b=>b.addEventListener("click",()=>d.close()))});

async function boot(){
  updateClock();setInterval(updateClock,30000);
  try{await api.health();await api.healthDatabase();setConnection(true)}catch{setConnection(false)}
  await refreshAll({silent:true,preserveSelection:false});
  const first=activeMesas().find(m=>m.estado==="OCUPADA")||activeMesas().find(m=>m.estado==="RESERVADA")||activeMesas()[0];
  if(first)await selectMesa(first.id);
  setInterval(()=>{if(!document.hidden&&!state.layoutEditMode)refreshAll({silent:true})},30000);
}

boot();
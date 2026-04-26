// ============================================================
// app.js — Lógica de la tienda de postres
// ============================================================

let productos = [];
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
let filtroActual = 'todos';
let terminoBusqueda = '';

// ── Inicialización ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarrito();
  renderCarrito();
  cargarProductos();
  inicializarEventos();
  actualizarFechaMinima();
});

// ── Carga de productos ───────────────────────────────────────
async function cargarProductos() {
  const contenedor = document.getElementById('productos-grid');
  const skeleton   = document.getElementById('productos-skeleton');
  try {
    if (skeleton) skeleton.classList.remove('hidden');

    const { data, error } = await db
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .order('categoria', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    productos = data || [];
    renderProductos();
  } catch (err) {
    console.error('Error cargando productos:', err);
    if (contenedor) contenedor.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <span class="material-symbols-outlined text-4xl block mb-2">error</span>
        No pudimos cargar el catálogo. Recarga la página.
      </div>`;
  } finally {
    if (skeleton) skeleton.classList.add('hidden');
  }
}

// ── Render productos ─────────────────────────────────────────
function renderProductos() {
  const contenedor = document.getElementById('productos-grid');
  if (!contenedor) return;

  let lista = productos;
  if (filtroActual !== 'todos') lista = lista.filter(p => p.categoria === filtroActual);
  if (terminoBusqueda) {
    const q = terminoBusqueda.toLowerCase();
    lista = lista.filter(p =>
      p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q)
    );
  }

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        <span class="material-symbols-outlined text-5xl block mb-3">search_off</span>
        No encontramos productos con esos criterios.
      </div>`;
    return;
  }

  contenedor.innerHTML = lista.map(p => {
    const esTorta      = p.categoria === 'tortas';
    const diasMin      = p.dias_anticipacion || (esTorta ? 5 : 0);
    const disponibleHoy = p.disponible_hoy && !esTorta;

    return `
    <article class="product-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div class="relative overflow-hidden h-56">
        <img
          src="${escapeHtml(p.imagen_url || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80')}"
          alt="${escapeHtml(p.nombre)}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80'"
        />
        <div class="absolute top-3 left-3 flex flex-col gap-1.5">
          ${disponibleHoy ? `
            <span class="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-white rounded-full inline-block"></span> Disponible hoy
            </span>` : ''}
          ${esTorta || diasMin > 0 ? `
            <span class="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
              ${diasMin}d anticipación
            </span>` : ''}
        </div>
        <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-amber-700 capitalize">
          ${escapeHtml(p.categoria || '')}
        </span>
      </div>
      <div class="p-5">
        <h3 class="font-semibold text-gray-900 text-lg leading-tight mb-1">${escapeHtml(p.nombre)}</h3>
        <p class="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">${escapeHtml(p.descripcion || '')}</p>
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xl font-bold text-amber-700">${formatearPrecio(p.precio)}</span>
            <p class="text-xs text-gray-400 mt-0.5">Abono 50%: ${formatearPrecio(p.precio * 0.5)}</p>
          </div>
          <button
            onclick="agregarAlCarrito(${p.id})"
            class="flex items-center gap-1.5 bg-gray-900 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200"
          >
            <span class="material-symbols-outlined text-sm" style="font-size:16px">add_shopping_cart</span>
            Agregar
          </button>
        </div>
      </div>
    </article>`;
  }).join('');
}

// ── Filtros ──────────────────────────────────────────────────
function inicializarEventos() {
  document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.addEventListener('click', () => {
      filtroActual = btn.dataset.filtro;
      document.querySelectorAll('[data-filtro]').forEach(b => {
        b.classList.remove('bg-gray-900', 'text-white');
        b.classList.add('bg-white', 'text-gray-700');
      });
      btn.classList.add('bg-gray-900', 'text-white');
      btn.classList.remove('bg-white', 'text-gray-700');
      renderProductos();
    });
  });

  const inputBusqueda = document.getElementById('busqueda');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', e => {
      terminoBusqueda = e.target.value.trim();
      renderProductos();
    });
  }

  document.getElementById('btn-carrito')?.addEventListener('click', abrirCarrito);
  document.getElementById('overlay-carrito')?.addEventListener('click', cerrarCarrito);
  document.getElementById('btn-cerrar-carrito')?.addEventListener('click', cerrarCarrito);
  document.getElementById('form-checkout')?.addEventListener('submit', procesarPedido);

  document.getElementById('btn-checkout')?.addEventListener('click', () => {
    if (!carrito.length) { mostrarToast('El carrito está vacío', 'error'); return; }
    document.getElementById('panel-carrito')?.classList.add('hidden');
    document.getElementById('panel-checkout')?.classList.remove('hidden');
    actualizarResumenCheckout();
  });

  document.getElementById('btn-volver-carrito')?.addEventListener('click', () => {
    document.getElementById('panel-checkout')?.classList.add('hidden');
    document.getElementById('panel-carrito')?.classList.remove('hidden');
  });

  // Actualizar monto de abono al cambiar items
  document.getElementById('form-checkout')?.addEventListener('input', actualizarResumenCheckout);

  document.getElementById('form-newsletter')?.addEventListener('submit', suscribirNewsletter);
  document.getElementById('form-contacto')?.addEventListener('submit', enviarContacto);

  document.getElementById('btn-contacto')?.addEventListener('click', () => {
    document.getElementById('modal-contacto')?.classList.remove('hidden');
  });
  document.getElementById('btn-cerrar-contacto')?.addEventListener('click', () => {
    document.getElementById('modal-contacto')?.classList.add('hidden');
  });
  document.getElementById('overlay-contacto')?.addEventListener('click', () => {
    document.getElementById('modal-contacto')?.classList.add('hidden');
  });

  // Cerrar modal de éxito
  document.getElementById('btn-cerrar-exito')?.addEventListener('click', () => {
    document.getElementById('modal-exito')?.classList.add('hidden');
  });
}

// ── Fecha mínima de entrega ──────────────────────────────────
function actualizarFechaMinima() {
  const input = document.getElementById('fecha_entrega');
  if (!input) return;
  // Fecha mínima por defecto: mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  input.min = manana.toISOString().split('T')[0];
}

function calcularFechaMinima() {
  const tieneTorta = carrito.some(i => {
    const p = productos.find(pr => pr.id === i.id);
    return p?.categoria === 'tortas';
  });
  const diasMin = tieneTorta ? 5 : 1;
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasMin);
  return { fechaMin: fecha.toISOString().split('T')[0], diasMin, tieneTorta };
}

function actualizarResumenCheckout() {
  const total = calcularTotal();
  const abono = total * 0.5;

  const elTotal = document.getElementById('checkout-total');
  const elAbono = document.getElementById('checkout-abono');
  if (elTotal) elTotal.textContent = formatearPrecio(total);
  if (elAbono) elAbono.textContent = formatearPrecio(abono);

  // Ajustar fecha mínima según si hay tortas
  const { fechaMin, tieneTorta } = calcularFechaMinima();
  const inputFecha = document.getElementById('fecha_entrega');
  if (inputFecha) {
    inputFecha.min = fechaMin;
    const aviso = document.getElementById('aviso-fecha-torta');
    if (aviso) aviso.classList.toggle('hidden', !tieneTorta);
  }
}

// ── Carrito ──────────────────────────────────────────────────
function agregarAlCarrito(productoId) {
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return;

  const item = carrito.find(i => i.id === productoId);
  if (item) {
    item.cantidad += 1;
  } else {
    carrito.push({
      id:         producto.id,
      nombre:     producto.nombre,
      precio:     producto.precio,
      imagen_url: producto.imagen_url,
      categoria:  producto.categoria,
      cantidad:   1,
    });
  }

  guardarCarrito();
  renderCarrito();
  actualizarContadorCarrito();
  abrirCarrito();
  mostrarToast(`"${producto.nombre}" añadido al carrito`);
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
  guardarCarrito();
  renderCarrito();
  actualizarContadorCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarrito();
  renderCarrito();
  actualizarContadorCarrito();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderCarrito();
  actualizarContadorCarrito();
}

function guardarCarrito() { localStorage.setItem('carrito', JSON.stringify(carrito)); }
function calcularTotal()  { return carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0); }

function renderCarrito() {
  const lista       = document.getElementById('carrito-items');
  const totalEl     = document.getElementById('carrito-total');
  const emptyEl     = document.getElementById('carrito-vacio');
  const contenidoEl = document.getElementById('carrito-contenido');
  if (!lista) return;

  if (!carrito.length) {
    emptyEl?.classList.remove('hidden');
    contenidoEl?.classList.add('hidden');
  } else {
    emptyEl?.classList.add('hidden');
    contenidoEl?.classList.remove('hidden');
    lista.innerHTML = carrito.map(item => `
      <div class="flex gap-3 items-start py-3 border-b border-gray-100 last:border-0">
        <img src="${escapeHtml(item.imagen_url || '')}" alt="${escapeHtml(item.nombre)}"
          class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          onerror="this.src='https://images.unsplash.com/photo-1551024601-bec78aea704b?w=100&q=60'" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm text-gray-900 truncate">${escapeHtml(item.nombre)}</p>
          <p class="text-amber-700 font-semibold text-sm mt-0.5">${formatearPrecio(item.precio)}</p>
          ${item.categoria === 'tortas' ? `<p class="text-xs text-amber-600 mt-0.5">⏰ 5 días anticipación</p>` : ''}
          <div class="flex items-center gap-2 mt-2">
            <button onclick="cambiarCantidad(${item.id}, -1)" class="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <span class="material-symbols-outlined" style="font-size:14px">remove</span>
            </button>
            <span class="text-sm font-semibold w-5 text-center">${item.cantidad}</span>
            <button onclick="cambiarCantidad(${item.id}, 1)" class="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <span class="material-symbols-outlined" style="font-size:14px">add</span>
            </button>
          </div>
        </div>
        <button onclick="eliminarDelCarrito(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
          <span class="material-symbols-outlined" style="font-size:18px">delete</span>
        </button>
      </div>`).join('');

    if (totalEl) totalEl.textContent = formatearPrecio(calcularTotal());
  }
}

function actualizarContadorCarrito() {
  const total    = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const contador = document.getElementById('carrito-contador');
  if (contador) {
    contador.textContent = total;
    contador.classList.toggle('hidden', total === 0);
  }
}

function abrirCarrito() {
  document.getElementById('drawer-carrito')?.classList.remove('translate-x-full');
  document.getElementById('overlay-carrito')?.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.getElementById('panel-carrito')?.classList.remove('hidden');
  document.getElementById('panel-checkout')?.classList.add('hidden');
}

function cerrarCarrito() {
  document.getElementById('drawer-carrito')?.classList.add('translate-x-full');
  document.getElementById('overlay-carrito')?.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// ── Checkout → crea pedido a través del Worker ───────────────
async function procesarPedido(e) {
  e.preventDefault();
  if (!carrito.length) { mostrarToast('El carrito está vacío', 'error'); return; }

  const btn  = document.getElementById('btn-confirmar-pedido');
  const form = e.target;

  const nombre      = form.nombre.value.trim();
  const email       = form.email.value.trim();
  const telefono    = form.telefono?.value.trim();
  const direccion   = form.direccion.value.trim();
  const metodoPago  = form.metodo_pago.value;
  const fechaEntrega = form.fecha_entrega?.value;
  const notas       = form.notas?.value.trim();

  if (!nombre || nombre.length < 2) return mostrarToast('Nombre inválido', 'error');
  if (!validarEmail(email))         return mostrarToast('Correo inválido', 'error');
  if (!direccion || direccion.length < 5) return mostrarToast('Dirección muy corta', 'error');
  if (!metodoPago)                  return mostrarToast('Selecciona un método de pago', 'error');
  if (!fechaEntrega)                return mostrarToast('Selecciona una fecha de entrega', 'error');

  // Validar fecha mínima según tipo de productos
  const { fechaMin, tieneTorta } = calcularFechaMinima();
  if (fechaEntrega < fechaMin) {
    const msg = tieneTorta
      ? 'Las tortas requieren mínimo 5 días de anticipación'
      : 'La fecha de entrega debe ser a partir de mañana';
    return mostrarToast(msg, 'error');
  }

  btn.disabled    = true;
  btn.textContent = 'Procesando...';

  const items = carrito.map(i => ({
    producto_id: i.id,
    nombre:      i.nombre,
    precio:      i.precio,
    cantidad:    i.cantidad,
    categoria:   i.categoria,
  }));

  const total = calcularTotal();

  const res = await fetch(`${WORKER_URL}/api/pedido`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_nombre:    nombre,
      cliente_email:     email,
      cliente_telefono:  telefono || null,
      cliente_direccion: direccion,
      items,
      total,
      metodo_pago:   metodoPago,
      fecha_entrega: fechaEntrega,
      notas:         notas || null,
    }),
  });

  btn.disabled    = false;
  btn.textContent = 'Confirmar pedido';

  const data = await res.json();

  if (!res.ok) {
    mostrarToast(data.error || 'Error al procesar el pedido', 'error');
    return;
  }

  vaciarCarrito();
  cerrarCarrito();
  form.reset();
  mostrarModalExito(data.numero_recibo);
}

function mostrarModalExito(numeroRecibo) {
  const modal   = document.getElementById('modal-exito');
  const reciboEl = document.getElementById('exito-recibo');
  const linkEl  = document.getElementById('exito-link-pedido');

  if (reciboEl)  reciboEl.textContent = numeroRecibo || '';
  if (linkEl)    linkEl.href = `pedido.html?recibo=${encodeURIComponent(numeroRecibo || '')}`;
  if (modal)     modal.classList.remove('hidden');
}

// ── Newsletter ───────────────────────────────────────────────
async function suscribirNewsletter(e) {
  e.preventDefault();
  const form  = e.target;
  const email = form.email.value.trim();
  if (!validarEmail(email)) { mostrarToast('Correo inválido', 'error'); return; }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const txt = btn.textContent;
  btn.textContent = 'Suscribiendo...';

  const { error } = await db.from('suscriptores').insert({ email });
  btn.disabled = false;
  btn.textContent = txt;

  if (error) {
    if (error.code === '23505') mostrarToast('Este correo ya está suscrito', 'info');
    else mostrarToast('Error al suscribirse', 'error');
    return;
  }

  // Notificar al webhook en background (sin bloquear)
  fetch(`${WORKER_URL}/api/pedido`, { method: 'OPTIONS' }).catch(() => {});

  form.reset();
  mostrarToast('¡Suscripción exitosa! Gracias por unirte.', 'success');
}

// ── Contacto ─────────────────────────────────────────────────
async function enviarContacto(e) {
  e.preventDefault();
  const form    = e.target;
  const nombre  = form.nombre.value.trim();
  const email   = form.email.value.trim();
  const mensaje = form.mensaje.value.trim();

  if (!nombre || nombre.length < 2) return mostrarToast('Nombre inválido', 'error');
  if (!validarEmail(email))          return mostrarToast('Correo inválido', 'error');
  if (!mensaje || mensaje.length < 10) return mostrarToast('Mensaje muy corto', 'error');

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const txt = btn.textContent;
  btn.textContent = 'Enviando...';

  const { error } = await db.from('contactos').insert({ nombre, email, mensaje });
  btn.disabled    = false;
  btn.textContent = txt;

  if (error) { mostrarToast('Error al enviar', 'error'); return; }

  form.reset();
  document.getElementById('modal-contacto')?.classList.add('hidden');
  mostrarToast('¡Mensaje enviado! Te responderemos pronto.', 'success');
}

// ── Utilidades ───────────────────────────────────────────────
function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(precio);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function mostrarToast(mensaje, tipo = 'success', duracion = 3000) {
  const cont = document.getElementById('toast-container') || crearContenedorToast();
  const toast = document.createElement('div');
  const colores = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
  toast.className = `${colores[tipo] || colores.success} text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300`;
  toast.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:18px">${tipo === 'error' ? 'error' : tipo === 'info' ? 'info' : 'check_circle'}</span>
    ${escapeHtml(mensaje)}`;
  cont.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

function crearContenedorToast() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center';
  document.body.appendChild(div);
  return div;
}

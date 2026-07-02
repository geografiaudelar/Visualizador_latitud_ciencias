// ─── LOADER ────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) { loader.classList.add('hidden'); setTimeout(() => loader.remove(), 500); }
});

// ─── MAPA ÚNICO ─────────────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: false }).setView([-32.94069733878892, -56.1013533999368], 7);
L.control.zoom({ position: 'topright' }).addTo(map);

// Capa base: Carto Light (siempre visible en todo el mapa)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd', maxZoom: 20,
  attribution: '&copy; CARTO | &copy; OpenStreetMap contributors'
}).addTo(map);

// Capa derecha: Imagen satelital (se muestra a la DERECHA del divisor)
const layerSatelite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 20, ext: 'jpg', attribution: '&copy; Esri' }
).addTo(map);

// Capa izquierda: Ortomosaico 1966 en PNG con transparencia (se muestra a la IZQUIERDA del divisor)
const layerOrto = L.tileLayer.wms('https://mapas.ide.uy/geoserver-raster/ortofotos/ows?', {
  layers: 'ortofoto_1966',
  format: 'image/png',
  transparent: true,
  version: '1.3.0',
  attribution: 'IDE Uruguay'
}).addTo(map);

// Asegurar que los contenedores no capturan eventos del mouse
[layerSatelite, layerOrto].forEach(l => {
  l.on('load', () => { if (l.getContainer()) l.getContainer().style.pointerEvents = 'none'; });
});

// ─── SWIPE: clip CSS sobre cada capa ────────────────────────────────────────
let swipeRatio = 0.5;

function updateClip() {
  const nw = map.containerPointToLayerPoint([0, 0]);
  const se = map.containerPointToLayerPoint(map.getSize());
  const clipX = nw.x + (se.x - nw.x) * swipeRatio;

  // Ortomosaico 1966: visible solo a la DERECHA del divisor
  const cOrto = layerOrto.getContainer();
  if (cOrto) cOrto.style.clip = `rect(${nw.y}px,${se.x}px,${se.y}px,${clipX}px)`;

  // Satélite 2025: visible solo a la IZQUIERDA del divisor
  const cSat = layerSatelite.getContainer();
  if (cSat) cSat.style.clip = `rect(${nw.y}px,${clipX}px,${se.y}px,${nw.x}px)`;
}

map.on('move zoom resize', updateClip);
layerOrto.on('load',     updateClip);
layerSatelite.on('load', updateClip);

// ─── DIVISOR VISUAL ─────────────────────────────────────────────────────────
const mapDiv = document.getElementById('map');

const dividerEl = document.createElement('div');
dividerEl.id = 'divider';
dividerEl.innerHTML = `
  <div id="divider-line"></div>
  <div id="divider-handle">
    <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19" fill="#1a1916" stroke="white" stroke-width="2"/>
      <polygon points="7,20 15,13 15,27" fill="white"/>
      <polygon points="33,20 25,13 25,27" fill="white"/>
    </svg>
  </div>`;
mapDiv.appendChild(dividerEl);

// Etiquetas fijas en los bordes del mapa (no se mueven con el divisor)
const labelIzq = document.createElement('div');
labelIzq.className = 'map-label left-label';
labelIzq.textContent = '2025';
mapDiv.appendChild(labelIzq);

const labelDer = document.createElement('div');
labelDer.className = 'map-label right-label';
labelDer.textContent = '1966';
mapDiv.appendChild(labelDer);

function positionDivider() {
  const px = swipeRatio * mapDiv.offsetWidth;
  dividerEl.style.left = px + 'px';
}

function setSwipe(ratio) {
  swipeRatio = Math.max(0, Math.min(1, ratio));
  positionDivider();
  updateClip();
  sliderEl.value = swipeRatio;
  badge.textContent = Math.round(swipeRatio * 100) + '%';
}

positionDivider();
updateClip();

// ─── DRAG ───────────────────────────────────────────────────────────────────
let dragging = false;

dividerEl.addEventListener('mousedown', e => {
  dragging = true; e.preventDefault(); e.stopPropagation();
  map.dragging.disable();
  document.body.style.cursor = 'ew-resize';
});
dividerEl.addEventListener('touchstart', e => {
  dragging = true; e.preventDefault();
  map.dragging.disable();
}, { passive: false });

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const rect = mapDiv.getBoundingClientRect();
  setSwipe((e.clientX - rect.left) / rect.width);
});
document.addEventListener('touchmove', e => {
  if (!dragging) return;
  const rect = mapDiv.getBoundingClientRect();
  setSwipe((e.touches[0].clientX - rect.left) / rect.width);
}, { passive: false });

document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false; map.dragging.enable(); document.body.style.cursor = '';
});
document.addEventListener('touchend', () => {
  dragging = false; map.dragging.enable();
});

const sliderEl = document.getElementById('slider');
const badge    = document.getElementById('badge-slider');
sliderEl.addEventListener('input', () => setSwipe(parseFloat(sliderEl.value)));

// ─── DATOS ──────────────────────────────────────────────────────────────────
const puntosReferencia = { type:'FeatureCollection', features:[
  { type:'Feature', properties:{ nombre:'Palacio Legislativo',       descripcion:'Punto de referencia' }, geometry:{ type:'Point', coordinates:[-56.18718852186468,-34.89087536505866] } },
  { type:'Feature', properties:{ nombre:'Puerta de la Ciudadela',    descripcion:'Punto de referencia' }, geometry:{ type:'Point', coordinates:[-56.20084688780987,-34.90657204438357] } },
  { type:'Feature', properties:{ nombre:'Intendencia de Montevideo', descripcion:'Punto de referencia' }, geometry:{ type:'Point', coordinates:[-56.186046995093946,-34.905971248750184] } },
  { type:'Feature', properties:{ nombre:'Tres Cruces',               descripcion:'Punto de referencia' }, geometry:{ type:'Point', coordinates:[-56.16636042776932,-34.89353016598076] } }
]};

const puntosInteres = { type:'FeatureCollection', features:[
  { type:'Feature', properties:{ nombre:'Antel Arena',               descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.15224018593663,-34.862820644767794] } },
  { type:'Feature', properties:{ nombre:'Terminal Cuenca del Plata', descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.21830463190138,-34.90654718091103] } },
  { type:'Feature', properties:{ nombre:'Santa Catalina',            descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.29257553116456,-34.88971177206129] } },
  { type:'Feature', properties:{ nombre:'Facultad de Veterinaria',   descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.065909964342374,-34.79207956648584] } },
  { type:'Feature', properties:{ nombre:'Asentamiento 24 de Junio',  descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.09407214661945,-34.79644077617708] } },
  { type:'Feature', properties:{ nombre:'Facultad de Ciencias',      descripcion:'Punto de interés' }, geometry:{ type:'Point', coordinates:[-56.11733998776521,-34.8822251337097] } }
]};

// ─── ICONOS ─────────────────────────────────────────────────────────────────
function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"/>
    <circle fill="#fff" cx="12" cy="12" r="4"/></svg>`;
  return L.divIcon({ html:svg, className:'', iconSize:[24,36], iconAnchor:[12,36], popupAnchor:[0,-38] });
}
const iconAmarillo = makeIcon('#d4a017');
const iconVerde    = makeIcon('#2d8a52');
const iconAzul     = makeIcon('#1d6fa4');

function popupContent(f) {
  return `<div class="popup-title">${f.properties.nombre}</div><div class="popup-desc">${f.properties.descripcion}</div>`;
}

const capaReferencia = L.geoJSON(puntosReferencia, {
  pointToLayer: (f,ll) => L.marker(ll,{icon:iconAmarillo}).bindPopup(popupContent(f))
}).addTo(map);

const capaInteres = L.geoJSON(puntosInteres, {
  pointToLayer: (f,ll) => L.marker(ll,{icon:iconVerde}).bindPopup(popupContent(f))
}).addTo(map);

// ─── TOGGLES ────────────────────────────────────────────────────────────────
document.getElementById('toggle-referencia').addEventListener('change', function () {
  this.checked ? capaReferencia.addTo(map) : map.removeLayer(capaReferencia);
});
document.getElementById('toggle-interes').addEventListener('change', function () {
  this.checked ? capaInteres.addTo(map) : map.removeLayer(capaInteres);
});

// ─── AÑADIR PUNTO ───────────────────────────────────────────────────────────
let modoAgregarPunto = false;
const btnAgregar = document.getElementById('btn-agregar-punto');
const coordPanel = document.getElementById('coord-panel');

btnAgregar.addEventListener('click', function () {
  modoAgregarPunto = !modoAgregarPunto;
  this.textContent = modoAgregarPunto ? 'Haga clic en el mapa...' : 'Añadir punto al mapa';
  this.classList.toggle('active', modoAgregarPunto);
  map.getContainer().style.cursor = modoAgregarPunto ? 'crosshair' : '';
});

map.on('click', function (e) {
  if (!modoAgregarPunto) return;
  modoAgregarPunto = false;
  btnAgregar.textContent = 'Añadir punto al mapa';
  btnAgregar.classList.remove('active');
  map.getContainer().style.cursor = '';

  const lat = e.latlng.lat.toFixed(5);
  const lng = e.latlng.lng.toFixed(5);
  coordPanel.textContent = `${lat}, ${lng}`;

  const marker = L.marker(e.latlng, { icon:iconAzul, draggable:true }).addTo(map);
  marker.bindPopup(`
    <div class="popup-title">Punto agregado</div>
    <div class="popup-coords">${lat}, ${lng}</div>
    <button class="popup-remove" id="remove-marker">Eliminar</button>
  `).openPopup();

  marker.on('popupopen', () => {
    const btn = document.getElementById('remove-marker');
    if (btn) btn.addEventListener('click', () => {
      map.removeLayer(marker);
      coordPanel.textContent = 'Marcador eliminado';
    });
  });
  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    coordPanel.textContent = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
  });
});

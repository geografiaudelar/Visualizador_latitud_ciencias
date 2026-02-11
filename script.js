// Crear el mapa
const map = L.map('map').setView([-33.027, -52.811], 7);

// Capa base debajo del swipe
const baselayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenStreetMap</a> contributors',
  ext: 'jpg'
}).addTo(map);

// Capa superior recortada con swipe (1966)
const topLayer = L.tileLayer.wms("https://mapas.ide.uy/geoserver-raster/ortofotos/ows?", {
  layers: "ortofoto_1966",
  format: 'image/jpeg',
  transparent: true,
  version: '1.3.0',
  attribution: "IDE-URUGUAY"
}).addTo(map);

topLayer.on('load', () => {
  const container = topLayer.getContainer();
  container.style.pointerEvents = 'none';
  clip();
});

function clip() {
  const range = document.getElementById('slider');
  const container = topLayer.getContainer();
  const nw = map.containerPointToLayerPoint([0, 0]);
  const se = map.containerPointToLayerPoint(map.getSize());
  const clipX = nw.x + (se.x - nw.x) * range.value;
  container.style.clip = `rect(${nw.y}px, ${clipX}px, ${se.y}px, ${nw.x}px)`;
}

document.getElementById('slider').addEventListener('input', clip);
map.on('move zoom resize', clip);

// === GEOJSON ===
const puntosReferencia = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "nombre": "Palacio Legislativo", "descripcion": "Punto de referencia" }, "geometry": { "type": "Point", "coordinates": [-56.18718852186468, -34.89087536505866] } },
    { "type": "Feature", "properties": { "nombre": "Puerta de la Ciudadela", "descripcion": "Punto de referencia" }, "geometry": { "type": "Point", "coordinates": [-56.20084688780987, -34.90657204438357] } },
    { "type": "Feature", "properties": { "nombre": "Intendencia de Montevideo", "descripcion": "Punto de referencia" }, "geometry": { "type": "Point", "coordinates": [-56.186046995093946, -34.905971248750184] } },
    { "type": "Feature", "properties": { "nombre": "Tres Cruces", "descripcion": "Punto de referencia" }, "geometry": { "type": "Point", "coordinates": [-56.16636042776932, -34.89353016598076] } }
  ]
};

const puntosInteres = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "nombre": "Antel Arena", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.15224018593663, -34.862820644767794] } },
    { "type": "Feature", "properties": { "nombre": "Terminal Cuenca del Plata", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.21830463190138, -34.90654718091103] } },
    { "type": "Feature", "properties": { "nombre": "Santa Catalina", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.29257553116456, -34.88971177206129] } },
    { "type": "Feature", "properties": { "nombre": "Facultad de Veterinaria", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.065909964342374, -34.79207956648584] } },
    { "type": "Feature", "properties": { "nombre": "Asentamiento 24 de Junio", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.09407214661945, -34.79644077617708] } },
    { "type": "Feature", "properties": { "nombre": "Facultad de Ciencias", "descripcion": "Puntos Interesantes" }, "geometry": { "type": "Point", "coordinates": [-56.11733998776521, -34.8822251337097] } }
  ]
};

// Capa puntos de referencia (amarillo)
// Iconos pin personalizados amarillo y verde
const iconRojo = new L.Icon.Default();

// Definición de icons (como ya tienes)
const iconVerde = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-green.png',  // cambié a verde
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconAmarillo = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Crear las capas geoJSON con sus iconos
const capaReferencia = L.geoJSON(puntosReferencia, {
  pointToLayer: (feature, latlng) => L.marker(latlng, { icon: iconAmarillo })
    .bindPopup(`<b>${feature.properties.nombre}</b>`)
});

const capaInteres = L.geoJSON(puntosInteres, {
  pointToLayer: (feature, latlng) => L.marker(latlng, { icon: iconVerde })
    .bindPopup(`<b>${feature.properties.nombre}</b>`)
});

// Crear grupo overlay para control de capas
const overlayLayers = {
  "Puntos de Referencia (Amarillo)": capaReferencia,
  "Puntos de Interés (Verde)": capaInteres
};

// Añadir capas al mapa (opcional, o las puedes dejar sin añadir para activarlas desde control)
capaReferencia.addTo(map);
capaInteres.addTo(map);

// Añadir control de capas (overlay) a la izquierda (por defecto)
L.control.layers(null, overlayLayers, { collapsed: true, position: 'topleft' }).addTo(map);



// Control de capas
L.control.layers({ "Base": baselayer }, { "Puntos de Referencia": capaReferencia, "Puntos de Interés": capaInteres }).addTo(map);

// === FUNCIONALIDAD DE AÑADIR PUNTO ===
let modoAgregarPunto = false;

document.getElementById("btn-agregar-punto").addEventListener("click", function () {
  modoAgregarPunto = !modoAgregarPunto;
  this.textContent = modoAgregarPunto ? "Haga clic en el mapa" : "Añadir Punto";
  this.style.backgroundColor = modoAgregarPunto ? "lightgreen" : "lightblue";
});

map.on("click", function (e) {
  if (modoAgregarPunto) {
    addMarker(e);
    modoAgregarPunto = false;
    const boton = document.getElementById("btn-agregar-punto");
    boton.textContent = "Añadir Punto";
    boton.style.backgroundColor = "lightblue";
  }
});

function addMarker(e) {
  const markerPlace = document.querySelector(".marker-position");
  markerPlace.textContent = `Coordenadas del punto: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;

  const marker = L.marker(e.latlng, { draggable: true })
    .addTo(map)
    .bindPopup(`
      <button type="button" class="remove">🗑 Eliminar marcador</button>
    `)
    .openPopup();

  marker.on("popupopen", () => {
    // Botón eliminar
    const btn = document.querySelector(".remove");
    if (btn) {
      btn.addEventListener("click", () => {
        map.removeLayer(marker);
        markerPlace.textContent = "Marcador eliminado";
      });
    }

    // Input nombre
    const input = document.querySelector(".add_name");
    if (input) {
      input.addEventListener("input", () => {
        const name = input.value;
        const pos = marker.getLatLng();
        markerPlace.textContent = `Coordenadas: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} | Nombre: ${name}`;
      });
    }
  });

  marker.on("dragend", () => {
    const pos = marker.getLatLng();
    const input = document.querySelector(".add_name");
    const name = input ? input.value : "";
    markerPlace.textContent = `Nueva posición: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} | Nombre: ${name}`;
  });
}

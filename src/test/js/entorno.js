/*
 * Prepara el entorno de navegador que las vistas esperan: jQuery global, $.ajax simulado,
 * utilidades.js cargado como global y navegación/plug-ins de Bootstrap sustituidos por mocks.
 */
const path = require("path");

const RUTA_JS = path.resolve(__dirname, "../../main/resources/static/js");

function prepararEntorno(html = "") {
  document.body.innerHTML = html;
  localStorage.clear();

  const $ = require("jquery");
  global.$ = global.jQuery = $;
  $.ajax = jest.fn();
  $.fn.modal = jest.fn();

  const utilidades = require(path.join(RUTA_JS, "utilidades.js"));
  Object.assign(global, utilidades);
  global.navegarA = jest.fn();
  return $;
}

/** Carga un script de la vista en un registro de módulos limpio (vuelve a ejecutar su código global). */
function cargarScript(nombre) {
  let modulo;
  jest.isolateModules(() => {
    modulo = require(path.join(RUTA_JS, nombre));
  });
  return modulo;
}

/** Última llamada a $.ajax (las opciones que recibió). */
function ultimaPeticion() {
  const llamadas = global.$.ajax.mock.calls;
  return llamadas[llamadas.length - 1][0];
}

/** Espera a que jQuery ejecute los manejadores de $(document).ready, que corren de forma asíncrona. */
function esperarDocumentoListo() {
  return new Promise((resolve) => global.$(resolve)).then(() => new Promise((r) => setTimeout(r, 0)));
}

module.exports = { prepararEntorno, cargarScript, ultimaPeticion, esperarDocumentoListo, RUTA_JS };

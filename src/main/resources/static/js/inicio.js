const ICONO_MENU = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                              <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                            </svg>`;

const ICONO_EDITAR = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6d7578" class="bi bi-pencil-fill me-3 mb-3 mt-2" viewBox="0 0 16 16">
                                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>`;

const ICONO_ELIMINAR = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#6d7578" class="bi bi-trash3-fill me-3 mb-2" viewBox="0 0 16 16">
                                  <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                </svg>`;

const FONDO_POR_DEFECTO = "/Images/blanco.png";

/** Genera la tarjeta HTML de un proyecto; todos los datos de la API se escapan. */
function crearTarjetaProyecto(proyecto) {
	const id = idSeguro(proyecto.id_proyecto);
	return `
              <div class="col-md-4">
                <div class="card mb-4">
                  <img src="${escapeHtml(proyecto.fondo)}" alt="...">
                  <div class="card-body">
                    <div class="dropdown">
                      <div class="d-flex justify-content-end">
                          <button type="button" data-bs-toggle="dropdown" aria-expanded="false" class="border-0">
                            ${ICONO_MENU}
                          </button>
                          <ul class="dropdown-menu">
                              <li><a onclick="actualizarProyecto(${id})" class="dropdown-item">
                                ${ICONO_EDITAR}
                                Editar
                              </a></li>
                              <li><a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#modalAlerta" onclick="obtenerInfo(${id}, 'hiddenId', ${jsArg(proyecto.nombre)})">
                                ${ICONO_ELIMINAR}
                                Eliminar
                            </a></li>
                         </ul>
                      </div>
                    </div>
                    <h5 class="card-title">${escapeHtml(proyecto.nombre)}</h5>
                    <p class="card-text">${escapeHtml(proyecto.descripcion)}</p>
                    <p class="card-text">Fecha de inicio: ${escapeHtml(proyecto.fecha_inicio)}</p>
                    <p class="card-text">Fecha de finalización: ${escapeHtml(proyecto.fecha_finalizacion)}</p>
                    <p class="card-text">Estado del proyecto: ${escapeHtml(proyecto.estado_proyecto)}</p>
                    <a href="/proyecto?id_proyecto=${id}" class="btn btn-primary">Ir al proyecto</a>
                </div>
              </div>
            `;
}

function cargarProyectos() {
	$.ajax({
		url: '/consultarProyectos',
		type: 'POST',
		dataType: 'json',
		success: function(data) {
			const contenedor = $('#cardContainer');
			contenedor.empty();
			data.forEach(function(proyecto) {
				contenedor.append(crearTarjetaProyecto(proyecto));
			});
		},
		error: function(error) {
			console.error('Error al cargar proyectos:', error);
		}
	});
}

$(document).ready(cargarProyectos);

function eliminarProyecto(idProyecto) {
	$.ajax({
		url: "/eliminarProyecto",
		contentType: "application/json",
		data: JSON.stringify({ id_proyecto: idProyecto }),
		type: "POST",
		success: function() {
			navegarA('inicio');
		}
	});
}

function obtenerInfo(datos, objetivo, nombre) {
	document.getElementById("textAlerta").innerText = "¿Esta seguro que sea eliminar el proyecto " + nombre + "?";
	document.getElementById(objetivo).value = datos;
}

function botonEliminar() {
	eliminarProyecto(document.getElementById("hiddenId").value);
}

function actualizarProyecto(idProyecto) {
	$.ajax({
		url: "/actualizarProyecto",
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify({ id_proyecto: idProyecto }),
		type: "POST",
		success: function(data) {
			const modal = $('#modalEditar');
			modal.modal('show');
			modal.find('.modal-title').text('Editar');

			document.getElementById("id").value = data.id_proyecto;
			document.getElementById("editarNombre").value = data.nombre;
			document.getElementById("editarDescripcion").value = data.descripcion;
			document.getElementById("editar_fecha_inicio").value = data.fecha_inicio;
			document.getElementById("editar_fecha_finalizacion").value = data.fecha_finalizacion;
			document.getElementById("editar_estado_proyecto").value = data.estado_proyecto;
			document.getElementById("editar_fondo").value = data.fondo;
		},
		error: function() {
			console.error("Error al consultar el proyecto", idProyecto);
		}
	});
}

/** Si el usuario no eligió fondo se asigna el blanco por defecto. */
function asignarFondoPorDefecto(idCampo) {
	const campo = document.getElementById(idCampo);
	if (campo && campo.value === "") {
		campo.value = FONDO_POR_DEFECTO;
	}
}

function asignarFondo() {
	asignarFondoPorDefecto("fondo");
}

function asignarFondoEditar() {
	// El campo del formulario de edición se llama editar_fondo (antes se buscaba "editarFondo", que no existe)
	asignarFondoPorDefecto("editar_fondo");
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		crearTarjetaProyecto, cargarProyectos, eliminarProyecto, obtenerInfo, botonEliminar,
		actualizarProyecto, asignarFondo, asignarFondoEditar, FONDO_POR_DEFECTO
	};
}

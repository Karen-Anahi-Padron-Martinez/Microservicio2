const ICONO_PAPELERA = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
						  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
						  </svg>`;

/** Contenedor del tablero y del menú lateral para cada lista de tareas. */
const LISTAS = {
	pendientes: { tablero: '#tareasPendientes', lateral: '#dropdownPendientes' },
	encurso: { tablero: '#enCurso', lateral: '#dropdownEnCurso' },
	terminado: { tablero: '#trabajoTerminado', lateral: '#dropdownTerminado' }
};

function idProyectoDeLaUrl() {
	const urlParams = new URLSearchParams(window.location.search);
	return Number(urlParams.get('id_proyecto'));
}

function irAlProyectoActual() {
	const id = document.getElementById("IdProyectoURL").value;
	navegarA(`proyecto?id_proyecto=${encodeURIComponent(id)}`);
}

function usuarioEnSesion() {
	try {
		return JSON.parse(localStorage.getItem("usuario"));
	} catch (e) {
		console.error("Sesión inválida", e);
		return null;
	}
}

function mostrarUsuario(usuario) {
	document.getElementById("imagenUsuario").style.backgroundColor = usuario.imagen_usuario;
	// textContent en lugar de innerHTML: el nombre lo escribe el propio usuario
	document.getElementById("Nombre").textContent = usuario.nombre;
	document.getElementById("Email").textContent = usuario.correo_electronico;
	document.getElementById("inicial").textContent = usuario.nombre ? usuario.nombre[0] : "";
}

/** Botón principal de una tarea: abre el modal de edición y carga sus comentarios. */
function botonTarea(tarea, clases) {
	const id = idSeguro(tarea.id_tarea);
	return `<button type="button" class="${clases}" data-bs-toggle="modal" data-bs-target="#editarTarea" onclick="actualizarTarea(${id});comentarios(${id})">${escapeHtml(tarea.nombre)}</button>`;
}

/**
 * Tarjeta del tablero. Las tareas pendientes piden confirmación antes de eliminarse (modal de alerta);
 * las de "en curso" y "terminado" se eliminan directamente, como en la versión original.
 */
function crearTarjetaTarea(tarea) {
	const id = idSeguro(tarea.id_tarea);
	const eliminar = (tarea.lista === "pendientes")
		? `data-bs-toggle="modal" data-bs-target="#modalAlerta" onclick="obtenerInfo(${id}, 'hiddenId', ${jsArg(tarea.nombre)})"`
		: `onclick="eliminarTarea(${id});"`;
	return `
	            <ul class="my-2">
	              <li>
					<div class="my-2 badge text-bg-light-subtle mx-auto d-flex">
						${botonTarea(tarea, `btn btn-light text-start d-grid gap-2 border border-${escapeHtml(tarea.estado)}`)}
						<button ${eliminar} class="bg-light-subtle m-1 p-2 border border-0">${ICONO_PAPELERA}
						</button>
					</div>
				  </li>
				</ul>
            	`;
}

function crearBotonLateral(tarea) {
	return botonTarea(tarea, "btn btn-light text-start d-grid gap-2 dropdown-item");
}

function pintarTareas(data) {
	Object.values(LISTAS).forEach(function(lista) {
		$(lista.tablero).empty();
		$(lista.lateral).empty();
	});
	data.forEach(function(tarea) {
		const lista = LISTAS[tarea.lista];
		if (lista) {
			$(lista.tablero).append(crearTarjetaTarea(tarea));
			$(lista.lateral).append(crearBotonLateral(tarea));
		}
	});
}

function pintarMiembros(data) {
	const contenedor = $('#miembrosLateral');
	contenedor.empty();
	data.forEach(function(usuario) {
		contenedor.append(`<p>${escapeHtml(usuario.nombre)}</p>`);
	});
}

function inicializarProyecto() {
	document.getElementById("etiqueta").selectedIndex = "0";

	const usuario = usuarioEnSesion();
	if (!usuario) {
		navegarA('login');
		return;
	}
	mostrarUsuario(usuario);

	const idProyecto = idProyectoDeLaUrl();
	document.getElementById("IdProyectoURL").value = idProyecto;

	llenarBarraLateral(idProyecto);

	$.ajax({
		url: '/consultarUsuarios',
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		success: pintarMiembros
	});

	$.ajax({
		url: '/obtenerTareas',
		data: JSON.stringify({ id_proyecto: idProyecto }),
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		success: pintarTareas,
		error: function(error) {
			console.error('Error al cargar tareas:', error);
		}
	});
}

$(document).ready(inicializarProyecto);

/** Muestra u oculta el campo y el botón para capturar una nueva tarea en una lista. */
function alternarNuevaTarea(idInput, idBoton) {
	const input = document.getElementById(idInput);
	const boton = document.getElementById(idBoton);
	const ocultos = window.getComputedStyle(input).display === "none"
		&& window.getComputedStyle(boton).display === "none";

	input.style.display = ocultos ? "block" : "none";
	boton.style.display = ocultos ? "block" : "none";
	if (ocultos) {
		input.focus();
	}
}

function newTarea() {
	alternarNuevaTarea("inputTarea", "btnTarea");
}

function newTarea2() {
	alternarNuevaTarea("inputTarea2", "btnTarea2");
}

function newTarea3() {
	alternarNuevaTarea("inputTarea3", "btnTarea3");
}

function Fechas() {
	const inputFechas = document.getElementById("inputFechas");
	if (window.getComputedStyle(inputFechas).display === "none") {
		inputFechas.style.display = "block";
		inputFechas.focus();
	} else {
		inputFechas.style.display = "none";
	}
}

/** Envía una tarea nueva tomando el nombre y la lista de los campos indicados. */
function enviarNuevaTarea(selectorNombre, selectorLista) {
	$.ajax({
		url: "/verificarTarea",
		contentType: "application/json",
		data: JSON.stringify({ nombre: $(selectorNombre).val(), lista: $(selectorLista).val(), id_proyecto: idProyectoDeLaUrl() }),
		type: "POST",
		success: irAlProyectoActual
	});
}

function validarTarea() {
	enviarNuevaTarea("#inputTarea", "#estado");
}

function validarTarea2() {
	enviarNuevaTarea("#inputTarea2", "#estado2");
}

function validarTarea3() {
	enviarNuevaTarea("#inputTarea3", "#estado3");
}

function eliminarTarea(idTarea) {
	$.ajax({
		url: "/eliminarTarea",
		contentType: "application/json",
		data: JSON.stringify({ id_tarea: idTarea }),
		type: "POST",
		success: irAlProyectoActual
	});
}

function actualizarTarea(idTarea) {
	$.ajax({
		url: "/actualizarTarea",
		dataType: "json",
		contentType: "application/json",
		data: JSON.stringify({ id_tarea: idTarea }),
		type: "POST",
		success: function(data) {
			const modal = $('#editarTarea');
			modal.modal('show');
			modal.find('.modal-title').text(data.nombre);

			document.getElementById("id_tarea").value = data.id_tarea;
			document.getElementById("id_proyecto").value = data.id_proyecto;
			document.getElementById("descripcionT").value = data.descripcion;
			document.getElementById("inputFechas").value = data.fecha_vencimiento;
			document.getElementById("etiqueta").value = data.estado;
			document.getElementById("cambiarLista").value = data.lista;
			document.getElementById("nombre").value = data.nombre;
		},
		error: function() {
			console.error("Error al consultar la tarea", idTarea);
		}
	});
}

/** Fecha con el formato que ya usa la BD: aa/mm/dd hh:mm */
function formatearFecha(fecha) {
	const dosDigitos = (n) => ('0' + n).slice(-2);
	const anio = fecha.getFullYear().toString().slice(-2);
	return `${anio}/${dosDigitos(fecha.getMonth() + 1)}/${dosDigitos(fecha.getDate())} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function guardarComentario() {
	const usuario = usuarioEnSesion();
	$.ajax({
		url: '/saveComentario',
		contentType: 'application/json',
		data: JSON.stringify({
			id_tarea: $('#id_tarea').val(),
			texto_comentario: $('#comentarioT').val(),
			fecha_hora: formatearFecha(new Date()),
			id_usuario: usuario ? usuario.nombre : ""
		}),
		type: 'POST',
		success: irAlProyectoActual,
		error: function(error) {
			console.error('Error al guardar el comentario:', error);
		}
	});
}

function llenarBarraLateral(idProyecto) {
	$.ajax({
		url: '/actualizarProyecto',
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify({ id_proyecto: idProyecto }),
		type: "POST",
		success: function(data) {
			document.getElementById("offcanvasScrollingLabel").textContent = data.nombre;
			document.getElementById("despliegueDescripcion").textContent = data.descripcion;
		},
		error: function() {
			console.error("Error al consultar el proyecto", idProyecto);
		}
	});
}

function crearComentario(comentario) {
	return `
					<div class="text-start bg-secondary p-2 bg-opacity-50 mb-3 rounded">
					    <strong class="me-auto">${escapeHtml(comentario.id_usuario)}</strong>
					    <small class="text-body-secondary">${escapeHtml(comentario.fecha_hora)}</small>
					  <div>
					    ${escapeHtml(comentario.texto_comentario)}
					  </div>
				    </div>
					`;
}

function comentarios(idTarea) {
	$.ajax({
		url: '/obtenerComentarios',
		data: JSON.stringify({ id_tarea: idTarea }),
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		success: function(data) {
			const contenedor = $('#contenedorComentario');
			contenedor.empty();
			data.forEach(function(comentario) {
				contenedor.append(crearComentario(comentario));
			});
		}
	});
}

function IrInicio() {
	navegarA('inicio');
}

function obtenerInfo(datos, objetivo, nombre) {
	document.getElementById("textAlerta").innerText = "¿Esta seguro que sea eliminar la tarea " + nombre + "?";
	document.getElementById(objetivo).value = datos;
}

function botonEliminar() {
	eliminarTarea(document.getElementById("hiddenId").value);
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		LISTAS, idProyectoDeLaUrl, irAlProyectoActual, usuarioEnSesion, mostrarUsuario, crearTarjetaTarea,
		crearBotonLateral, pintarTareas, pintarMiembros, inicializarProyecto, alternarNuevaTarea, newTarea,
		newTarea2, newTarea3, Fechas, enviarNuevaTarea, validarTarea, validarTarea2, validarTarea3,
		eliminarTarea, actualizarTarea, formatearFecha, guardarComentario, llenarBarraLateral, crearComentario,
		comentarios, IrInicio, obtenerInfo, botonEliminar
	};
}

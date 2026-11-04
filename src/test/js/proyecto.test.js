const { prepararEntorno, cargarScript, ultimaPeticion, esperarDocumentoListo } = require("./entorno");

const HTML = `
  <select id="etiqueta"><option value="primary">p</option><option value="danger">d</option></select>
  <input id="IdProyectoURL">
  <h5 id="offcanvasScrollingLabel"></h5><p id="despliegueDescripcion"></p>
  <div id="dropdownPendientes"></div><div id="dropdownEnCurso"></div><div id="dropdownTerminado"></div>
  <div id="miembrosLateral"><p>viejo</p></div>
  <span id="Nombre"></span><span id="Email"></span><div id="imagenUsuario"><span id="inicial"></span></div>
  <div id="tareasPendientes"></div><div id="enCurso"></div><div id="trabajoTerminado"></div>
  <input id="inputTarea" style="display:none"><select id="estado"><option value="pendientes">p</option></select><button id="btnTarea" style="display:none"></button>
  <input id="inputTarea2" style="display:none"><select id="estado2"><option value="encurso">e</option></select><button id="btnTarea2" style="display:none"></button>
  <input id="inputTarea3" style="display:none"><select id="estado3"><option value="terminado">t</option></select><button id="btnTarea3" style="display:none"></button>
  <div id="editarTarea"><h1 class="modal-title"></h1></div>
  <input id="id_tarea"><input id="nombre"><input id="id_proyecto"><input id="descripcionT">
  <textarea id="comentarioT"></textarea><div id="contenedorComentario"><p>viejo</p></div>
  <input id="inputFechas" style="display:none">
  <select id="cambiarLista"><option value="pendientes">p</option><option value="encurso">e</option></select>
  <p id="textAlerta"></p><input id="hiddenId">
`;

const USUARIO = { id_usuario: 1, nombre: "Ana Demo", correo_electronico: "ana@example.com", imagen_usuario: "#112233" };

let proyecto;

function iniciarSesion(usuario = USUARIO) {
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function peticionA(url) {
  const llamada = $.ajax.mock.calls.map((c) => c[0]).find((o) => o.url === url);
  if (!llamada) throw new Error(`No hubo petición a ${url}`);
  return llamada;
}

beforeEach(() => {
  prepararEntorno(HTML);
  window.history.replaceState({}, "", "/proyecto?id_proyecto=197");
  proyecto = cargarScript("proyecto.js");
});

describe("inicialización de la página", () => {
  test("al cargar el documento inicializa la vista con el usuario en sesión", async () => {
    iniciarSesion();
    await esperarDocumentoListo();

    expect(document.getElementById("Nombre").textContent).toBe("Ana Demo");
    expect(peticionA("/obtenerTareas")).toBeDefined();
  });

  test("muestra el usuario, guarda el id del proyecto y lanza las tres consultas", () => {
    iniciarSesion();
    proyecto.inicializarProyecto();

    expect(document.getElementById("etiqueta").selectedIndex).toBe(0);
    expect(document.getElementById("Nombre").textContent).toBe("Ana Demo");
    expect(document.getElementById("Email").textContent).toBe("ana@example.com");
    expect(document.getElementById("inicial").textContent).toBe("A");
    expect(document.getElementById("imagenUsuario").style.backgroundColor).toBe("rgb(17, 34, 51)");
    expect(document.getElementById("IdProyectoURL").value).toBe("197");
    expect(JSON.parse(peticionA("/actualizarProyecto").data)).toEqual({ id_proyecto: 197 });
    expect(JSON.parse(peticionA("/obtenerTareas").data)).toEqual({ id_proyecto: 197 });
    expect(peticionA("/consultarUsuarios").type).toBe("POST");
  });

  test("sin sesión redirige al login y no consulta la API", () => {
    proyecto.inicializarProyecto();

    expect(navegarA).toHaveBeenCalledWith("login");
    expect($.ajax).not.toHaveBeenCalled();
  });

  test("una sesión corrupta se trata como sin sesión", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("usuario", "{no es json");

    expect(proyecto.usuarioEnSesion()).toBeNull();
    proyecto.inicializarProyecto();
    expect(navegarA).toHaveBeenCalledWith("login");
    espia.mockRestore();
  });

  test("el nombre del usuario se muestra como texto (sin interpretar HTML)", () => {
    proyecto.mostrarUsuario({ ...USUARIO, nombre: "<b>Ana</b>" });

    expect(document.getElementById("Nombre").textContent).toBe("<b>Ana</b>");
    expect(document.querySelector("#Nombre b")).toBeNull();
  });

  test("un usuario sin nombre no rompe la inicial", () => {
    proyecto.mostrarUsuario({ ...USUARIO, nombre: "" });
    expect(document.getElementById("inicial").textContent).toBe("");
  });

  test("el error al cargar tareas se registra en consola", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    iniciarSesion();
    proyecto.inicializarProyecto();
    peticionA("/obtenerTareas").error("500");

    expect(espia).toHaveBeenCalledWith("Error al cargar tareas:", "500");
    espia.mockRestore();
  });
});

describe("tablero de tareas", () => {
  const TAREAS = [
    { id_tarea: 1, nombre: "BD", lista: "pendientes", estado: "danger" },
    { id_tarea: 2, nombre: "API", lista: "encurso", estado: "primary" },
    { id_tarea: 3, nombre: "Web", lista: "terminado", estado: "success" },
    { id_tarea: 4, nombre: "Huérfana", lista: "otra", estado: "info" },
  ];

  test("reparte cada tarea en su columna y en el menú lateral, ignorando listas desconocidas", () => {
    document.getElementById("tareasPendientes").innerHTML = "<p>viejo</p>";
    proyecto.pintarTareas(TAREAS);

    expect(document.querySelectorAll("#tareasPendientes ul")).toHaveLength(1);
    expect(document.querySelectorAll("#enCurso ul")).toHaveLength(1);
    expect(document.querySelectorAll("#trabajoTerminado ul")).toHaveLength(1);
    expect(document.getElementById("tareasPendientes").textContent).not.toContain("viejo");
    expect(document.getElementById("dropdownEnCurso").textContent.trim()).toBe("API");
    expect(document.body.textContent).not.toContain("Huérfana");
  });

  test("las pendientes piden confirmación y las demás se eliminan directo", () => {
    const pendiente = proyecto.crearTarjetaTarea(TAREAS[0]);
    const enCurso = proyecto.crearTarjetaTarea(TAREAS[1]);

    expect(pendiente).toContain('data-bs-target="#modalAlerta"');
    expect(pendiente).toContain("obtenerInfo(1, 'hiddenId', &quot;BD&quot;)");
    expect(enCurso).toContain("eliminarTarea(2);");
    expect(enCurso).toContain("border-primary");
  });

  test("los datos de la tarea no pueden inyectar HTML ni JavaScript", () => {
    document.body.innerHTML = proyecto.crearTarjetaTarea({
      id_tarea: "1);window.xss=1;(",
      nombre: `<img src=x onerror="window.xss=2">`,
      lista: "encurso",
      estado: `x" onclick="window.xss=3`,
    });

    // En el navegador estas funciones son globales; aquí se sustituyen por espías
    window.actualizarTarea = jest.fn();
    window.comentarios = jest.fn();
    window.eliminarTarea = jest.fn();

    expect(document.querySelectorAll("img")).toHaveLength(0);
    document.querySelectorAll("button").forEach((b) => b.click());
    expect(window.xss).toBeUndefined();
    // El id malicioso se reemplaza por 0 en todos los manejadores
    expect(window.actualizarTarea).toHaveBeenCalledWith(0);
    expect(window.comentarios).toHaveBeenCalledWith(0);
    expect(window.eliminarTarea).toHaveBeenCalledWith(0);
  });

  test("el botón lateral abre la tarea y sus comentarios", () => {
    const boton = proyecto.crearBotonLateral({ id_tarea: 8, nombre: "UI" });
    expect(boton).toContain("actualizarTarea(8);comentarios(8)");
    expect(boton).toContain("dropdown-item");
  });

  test("pintarMiembros lista los nombres escapados", () => {
    proyecto.pintarMiembros([{ nombre: "Ana" }, { nombre: "<i>Beto</i>" }]);

    const miembros = document.querySelectorAll("#miembrosLateral p");
    expect(miembros).toHaveLength(2);
    expect(miembros[1].textContent).toBe("<i>Beto</i>");
  });
});

describe("captura de tareas nuevas", () => {
  test("newTarea muestra el campo oculto y luego lo vuelve a ocultar", () => {
    proyecto.newTarea();
    expect(document.getElementById("inputTarea").style.display).toBe("block");
    expect(document.getElementById("btnTarea").style.display).toBe("block");
    expect(document.activeElement.id).toBe("inputTarea");

    proyecto.newTarea();
    expect(document.getElementById("inputTarea").style.display).toBe("none");
    expect(document.getElementById("btnTarea").style.display).toBe("none");
  });

  test("newTarea2 y newTarea3 controlan sus propias columnas", () => {
    proyecto.newTarea2();
    proyecto.newTarea3();

    expect(document.getElementById("inputTarea2").style.display).toBe("block");
    expect(document.getElementById("inputTarea3").style.display).toBe("block");
    expect(document.getElementById("inputTarea").style.display).toBe("none");
  });

  test("si solo uno de los dos elementos está visible, ambos se ocultan (corrige el uso de & por &&)", () => {
    document.getElementById("inputTarea").style.display = "block";
    proyecto.newTarea();

    expect(document.getElementById("inputTarea").style.display).toBe("none");
    expect(document.getElementById("btnTarea").style.display).toBe("none");
  });

  test("Fechas alterna el campo de fecha", () => {
    proyecto.Fechas();
    expect(document.getElementById("inputFechas").style.display).toBe("block");
    proyecto.Fechas();
    expect(document.getElementById("inputFechas").style.display).toBe("none");
  });

  test.each([
    ["validarTarea", "inputTarea", "pendientes"],
    ["validarTarea2", "inputTarea2", "encurso"],
    ["validarTarea3", "inputTarea3", "terminado"],
  ])("%s envía nombre, lista e id del proyecto y recarga el proyecto", (funcion, campo, lista) => {
    document.getElementById(campo).value = "Nueva";
    document.getElementById("IdProyectoURL").value = "197";

    proyecto[funcion]();
    const peticion = ultimaPeticion();

    expect(peticion.url).toBe("/verificarTarea");
    expect(JSON.parse(peticion.data)).toEqual({ nombre: "Nueva", lista, id_proyecto: 197 });
    peticion.success(1);
    expect(navegarA).toHaveBeenCalledWith("proyecto?id_proyecto=197");
  });
});

describe("edición y eliminación de tareas", () => {
  test("eliminarTarea envía el id y recarga el proyecto", () => {
    document.getElementById("IdProyectoURL").value = "197";
    proyecto.eliminarTarea(5);
    const peticion = ultimaPeticion();

    expect(peticion.url).toBe("/eliminarTarea");
    expect(JSON.parse(peticion.data)).toEqual({ id_tarea: 5 });
    peticion.success();
    expect(navegarA).toHaveBeenCalledWith("proyecto?id_proyecto=197");
  });

  test("actualizarTarea carga la tarea en el modal", () => {
    proyecto.actualizarTarea(5);
    ultimaPeticion().success({
      id_tarea: 5, id_proyecto: 197, nombre: "BD", descripcion: "tablas",
      fecha_vencimiento: "2024-06-13", estado: "danger", lista: "encurso",
    });

    expect($.fn.modal).toHaveBeenCalledWith("show");
    expect(document.querySelector("#editarTarea .modal-title").textContent).toBe("BD");
    expect(document.getElementById("id_tarea").value).toBe("5");
    expect(document.getElementById("id_proyecto").value).toBe("197");
    expect(document.getElementById("descripcionT").value).toBe("tablas");
    expect(document.getElementById("inputFechas").value).toBe("2024-06-13");
    expect(document.getElementById("etiqueta").value).toBe("danger");
    expect(document.getElementById("cambiarLista").value).toBe("encurso");
    expect(document.getElementById("nombre").value).toBe("BD");
  });

  test("actualizarTarea registra el error de la API", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    proyecto.actualizarTarea(5);
    ultimaPeticion().error();

    expect(espia).toHaveBeenCalledWith("Error al consultar la tarea", 5);
    espia.mockRestore();
  });

  test("obtenerInfo y botonEliminar confirman y eliminan la tarea elegida", () => {
    proyecto.obtenerInfo(5, "hiddenId", "BD");
    expect(document.getElementById("textAlerta").innerText).toBe("¿Esta seguro que sea eliminar la tarea BD?");

    proyecto.botonEliminar();
    expect(JSON.parse(ultimaPeticion().data)).toEqual({ id_tarea: "5" });
  });

  test("IrInicio regresa a la lista de proyectos", () => {
    proyecto.IrInicio();
    expect(navegarA).toHaveBeenCalledWith("inicio");
  });
});

describe("barra lateral del proyecto", () => {
  test("muestra nombre y descripción como texto", () => {
    proyecto.llenarBarraLateral(197);
    ultimaPeticion().success({ nombre: "<b>API</b>", descripcion: "Sistema" });

    expect(document.getElementById("offcanvasScrollingLabel").textContent).toBe("<b>API</b>");
    expect(document.getElementById("despliegueDescripcion").textContent).toBe("Sistema");
  });

  test("registra el error si no se puede consultar", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    proyecto.llenarBarraLateral(9);
    ultimaPeticion().error();

    expect(espia).toHaveBeenCalledWith("Error al consultar el proyecto", 9);
    espia.mockRestore();
  });
});

describe("comentarios", () => {
  test("formatearFecha usa aa/mm/dd hh:mm con dos dígitos", () => {
    expect(proyecto.formatearFecha(new Date(2024, 5, 6, 8, 5))).toBe("24/06/06 08:05");
    expect(proyecto.formatearFecha(new Date(2025, 11, 31, 23, 59))).toBe("25/12/31 23:59");
  });

  test("guardarComentario envía texto, tarea, fecha y autor", () => {
    iniciarSesion();
    document.getElementById("id_tarea").value = "5";
    document.getElementById("comentarioT").value = "Listo";
    document.getElementById("IdProyectoURL").value = "197";

    proyecto.guardarComentario();
    const peticion = ultimaPeticion();
    const cuerpo = JSON.parse(peticion.data);

    expect(peticion.url).toBe("/saveComentario");
    expect(cuerpo).toEqual(expect.objectContaining({ id_tarea: "5", texto_comentario: "Listo", id_usuario: "Ana Demo" }));
    expect(cuerpo.fecha_hora).toMatch(/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    peticion.success();
    expect(navegarA).toHaveBeenCalledWith("proyecto?id_proyecto=197");
  });

  test("guardarComentario sin sesión envía autor vacío y registra errores", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    proyecto.guardarComentario();
    const peticion = ultimaPeticion();

    expect(JSON.parse(peticion.data).id_usuario).toBe("");
    peticion.error("500");
    expect(espia).toHaveBeenCalledWith("Error al guardar el comentario:", "500");
    espia.mockRestore();
  });

  test("comentarios pinta la lista escapada de la tarea", () => {
    proyecto.comentarios(5);
    const peticion = ultimaPeticion();
    expect(JSON.parse(peticion.data)).toEqual({ id_tarea: 5 });

    peticion.success([
      { id_usuario: "Ana", fecha_hora: "24/06/26 13:48", texto_comentario: "Hola" },
      { id_usuario: "Beto", fecha_hora: "24/06/26 13:49", texto_comentario: "<script>window.xss=1</script>" },
    ]);

    const tarjetas = document.querySelectorAll("#contenedorComentario > div");
    expect(tarjetas).toHaveLength(2);
    expect(tarjetas[0].querySelector("strong").textContent).toBe("Ana");
    expect(tarjetas[1].textContent).toContain("<script>window.xss=1</script>");
    expect(document.querySelectorAll("#contenedorComentario script")).toHaveLength(0);
  });
});

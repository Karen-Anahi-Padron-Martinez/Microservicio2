const { prepararEntorno, cargarScript, ultimaPeticion, esperarDocumentoListo } = require("./entorno");

const HTML = `
  <div id="cardContainer"><p>viejo</p></div>
  <input id="fondo" value="">
  <div id="modalEditar"><h1 class="modal-title"></h1></div>
  <input id="id"><input id="editarNombre"><input id="editarDescripcion">
  <input id="editar_fecha_inicio"><input id="editar_fecha_finalizacion">
  <input id="editar_estado_proyecto"><input id="editar_fondo" value="">
  <p id="textAlerta"></p><input id="hiddenId">
`;

const PROYECTO = {
  id_proyecto: 197, nombre: "My API Rest", descripcion: "Sistema de 5 tablas",
  fecha_inicio: "2024-05-31", fecha_finalizacion: "2024-06-29", estado_proyecto: "En proceso",
  fondo: "/Images/animacion1.gif",
};

let inicio;

beforeEach(() => {
  prepararEntorno(HTML);
  inicio = cargarScript("inicio.js");
});

describe("carga de proyectos", () => {
  test("al cargar la página consulta /consultarProyectos", async () => {
    await esperarDocumentoListo();

    expect($.ajax).toHaveBeenCalledWith(expect.objectContaining({ url: "/consultarProyectos", type: "POST" }));
  });

  test("pinta una tarjeta por proyecto y limpia el contenedor", () => {
    inicio.cargarProyectos();
    ultimaPeticion().success([PROYECTO, { ...PROYECTO, id_proyecto: 198, nombre: "Web" }]);

    const tarjetas = document.querySelectorAll("#cardContainer .card");
    expect(tarjetas).toHaveLength(2);
    expect(document.getElementById("cardContainer").textContent).not.toContain("viejo");
    expect(tarjetas[0].querySelector(".card-title").textContent).toBe("My API Rest");
    expect(tarjetas[1].querySelector("a.btn").getAttribute("href")).toBe("/proyecto?id_proyecto=198");
  });

  test("registra en consola si la consulta falla", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    inicio.cargarProyectos();
    ultimaPeticion().error("500");

    expect(espia).toHaveBeenCalledWith("Error al cargar proyectos:", "500");
    espia.mockRestore();
  });
});

describe("crearTarjetaProyecto (protección XSS)", () => {
  test("no ejecuta HTML ni atributos inyectados en los datos del proyecto", () => {
    const html = inicio.crearTarjetaProyecto({
      ...PROYECTO,
      nombre: `<img src=x onerror="window.xss=1">`,
      descripcion: "<script>window.xss=2</script>",
      fondo: `x" onerror="window.xss=3`,
    });
    document.body.innerHTML = html;

    expect(document.querySelector(".card-title").textContent).toBe(`<img src=x onerror="window.xss=1">`);
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(document.querySelector("img").getAttribute("onerror")).toBeNull();
    expect(window.xss).toBeUndefined();
  });

  test("un id no numérico no se inyecta en los manejadores", () => {
    const html = inicio.crearTarjetaProyecto({ ...PROYECTO, id_proyecto: "1);alert(1" });
    expect(html).toContain("actualizarProyecto(0)");
    expect(html).not.toContain("alert(1");
  });
});

describe("eliminación", () => {
  test("eliminarProyecto envía el id y vuelve a inicio", () => {
    inicio.eliminarProyecto(5);
    const peticion = ultimaPeticion();

    expect(peticion.url).toBe("/eliminarProyecto");
    expect(JSON.parse(peticion.data)).toEqual({ id_proyecto: 5 });
    peticion.success();
    expect(navegarA).toHaveBeenCalledWith("inicio");
  });

  test("obtenerInfo prepara el mensaje de confirmación y guarda el id", () => {
    inicio.obtenerInfo(9, "hiddenId", "Web");

    expect(document.getElementById("textAlerta").innerText).toBe("¿Esta seguro que sea eliminar el proyecto Web?");
    expect(document.getElementById("hiddenId").value).toBe("9");
  });

  test("botonEliminar elimina el proyecto guardado en hiddenId", () => {
    document.getElementById("hiddenId").value = "9";
    inicio.botonEliminar();

    expect(JSON.parse(ultimaPeticion().data)).toEqual({ id_proyecto: "9" });
  });
});

describe("edición", () => {
  test("actualizarProyecto llena el formulario y abre el modal", () => {
    inicio.actualizarProyecto(197);
    const peticion = ultimaPeticion();
    expect(JSON.parse(peticion.data)).toEqual({ id_proyecto: 197 });

    peticion.success(PROYECTO);

    expect($.fn.modal).toHaveBeenCalledWith("show");
    expect(document.querySelector("#modalEditar .modal-title").textContent).toBe("Editar");
    expect(document.getElementById("id").value).toBe("197");
    expect(document.getElementById("editarNombre").value).toBe("My API Rest");
    expect(document.getElementById("editarDescripcion").value).toBe("Sistema de 5 tablas");
    expect(document.getElementById("editar_fecha_inicio").value).toBe("2024-05-31");
    expect(document.getElementById("editar_fecha_finalizacion").value).toBe("2024-06-29");
    expect(document.getElementById("editar_estado_proyecto").value).toBe("En proceso");
    expect(document.getElementById("editar_fondo").value).toBe("/Images/animacion1.gif");
  });

  test("actualizarProyecto registra el error si la API falla", () => {
    const espia = jest.spyOn(console, "error").mockImplementation(() => {});
    inicio.actualizarProyecto(3);
    ultimaPeticion().error();

    expect(espia).toHaveBeenCalledWith("Error al consultar el proyecto", 3);
    espia.mockRestore();
  });
});

describe("fondo por defecto", () => {
  test("asignarFondo pone el fondo blanco si no se eligió ninguno", () => {
    inicio.asignarFondo();
    expect(document.getElementById("fondo").value).toBe(inicio.FONDO_POR_DEFECTO);
  });

  test("asignarFondo respeta el fondo elegido", () => {
    document.getElementById("fondo").value = "/Images/rosa.png";
    inicio.asignarFondo();
    expect(document.getElementById("fondo").value).toBe("/Images/rosa.png");
  });

  test("asignarFondoEditar usa el campo editar_fondo (regresión del id inexistente)", () => {
    inicio.asignarFondoEditar();
    expect(document.getElementById("editar_fondo").value).toBe("/Images/blanco.png");
  });

  test("no falla si el campo no existe en la página", () => {
    document.body.innerHTML = "";
    expect(() => inicio.asignarFondo()).not.toThrow();
  });
});

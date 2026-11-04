const { prepararEntorno, cargarScript, esperarDocumentoListo } = require("./entorno");

describe("register.js", () => {
  const HTML = `
    <form id="form-registro">
      <input id="nombre"><input id="email"><input id="password">
      <p id="mensaje-error"></p>
    </form>`;

  let registro;
  let enviado;

  beforeEach(() => {
    prepararEntorno(HTML);
    enviado = 0;
    HTMLFormElement.prototype.submit = jest.fn(() => { enviado++; });
    registro = cargarScript("register.js");
    registro.inicializarRegistro();
  });

  function enviarFormulario() {
    const evento = new Event("submit", { cancelable: true });
    document.getElementById("form-registro").dispatchEvent(evento);
    return evento;
  }

  test("con campos vacíos muestra el error y no envía", () => {
    document.getElementById("nombre").value = "Ana";
    const evento = enviarFormulario();

    expect(evento.defaultPrevented).toBe(true);
    expect(document.getElementById("mensaje-error").innerText).toBe("Por favor complete todos los campos.");
    expect(enviado).toBe(0);
  });

  test("con todos los campos envía el formulario", () => {
    document.getElementById("nombre").value = "Ana";
    document.getElementById("email").value = "ana@example.com";
    document.getElementById("password").value = "clave";

    const resultado = registro.validarRegistro({ preventDefault: jest.fn() });

    expect(resultado).toBe(true);
    expect(enviado).toBe(1);
  });

  test("inicializarRegistro no falla en páginas sin el formulario", () => {
    document.body.innerHTML = "";
    expect(() => registro.inicializarRegistro()).not.toThrow();
  });
});

describe("pplmproyecto.js", () => {
  let pplm;

  beforeEach(() => {
    prepararEntorno(`
      <form class="needs-validation" id="f1"><input required id="campo"></form>
      <input id="imagenUsuario">`);
    pplm = cargarScript("pplmproyecto.js");
  });

  test("al cargar la página activa la validación de los formularios", async () => {
    await esperarDocumentoListo();
    const evento = new Event("submit", { cancelable: true });
    document.getElementById("f1").dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(document.getElementById("f1").classList.contains("was-validated")).toBe(true);
  });

  test("un formulario válido se envía y solo se marca como validado", () => {
    document.body.innerHTML = `<form class="needs-validation" id="f2"><input id="c" value="ok"></form>`;
    pplm.activarValidacionFormularios();
    const evento = new Event("submit", { cancelable: true });
    document.getElementById("f2").dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(false);
    expect(document.getElementById("f2").classList.contains("was-validated")).toBe(true);
  });

  test("getRandomColor genera un color #RRGGBB y lo asigna al campo", () => {
    const color = pplm.getRandomColor();

    expect(color).toMatch(/^#[0-9A-F]{6}$/);
    expect(document.getElementById("imagenUsuario").value).toBe(color);
  });

  test("getRandomColor usa los extremos del rango de dígitos", () => {
    const random = jest.spyOn(Math, "random");
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.999).mockReturnValue(0.5);

    expect(pplm.getRandomColor()).toBe("#0F8888");
    random.mockRestore();
  });
});

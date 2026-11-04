const path = require("path");
const { RUTA_JS } = require("./entorno");

const { escapeHtml, jsArg, idSeguro, navegarA } = require(path.join(RUTA_JS, "utilidades.js"));

describe("escapeHtml", () => {
  test("escapa los caracteres especiales de HTML", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;"
    );
  });

  test("convierte null y undefined en cadena vacía y los números en texto", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
  });

  test("insertado en el DOM se muestra como texto y no crea elementos", () => {
    document.body.innerHTML = `<div id="c">${escapeHtml("<script>alert(1)</script>")}</div>`;
    expect(document.querySelector("#c script")).toBeNull();
    expect(document.getElementById("c").textContent).toBe("<script>alert(1)</script>");
  });
});

describe("jsArg", () => {
  test("produce un literal JS que, dentro de onclick, entrega el texto original sin ejecutar código", () => {
    const malicioso = "x'); window.hackeado = true; ('";
    window.recibido = null;
    window.capturar = (valor) => { window.recibido = valor; };
    document.body.innerHTML = `<button id="b" onclick="capturar(${jsArg(malicioso)})">b</button>`;

    document.getElementById("b").click();

    expect(window.recibido).toBe(malicioso);
    expect(window.hackeado).toBeUndefined();
  });

  test("undefined se convierte en null", () => {
    expect(jsArg(undefined)).toBe("null");
  });
});

describe("idSeguro", () => {
  test("acepta números y cadenas numéricas", () => {
    expect(idSeguro(7)).toBe(7);
    expect(idSeguro("12")).toBe(12);
  });

  test("descarta valores no numéricos", () => {
    expect(idSeguro("1);alert(1")).toBe(0);
    expect(idSeguro(undefined)).toBe(0);
    expect(idSeguro(Infinity)).toBe(0);
  });
});

describe("navegarA", () => {
  test("cambia la ubicación del documento", () => {
    navegarA("#seccion");
    expect(window.location.hash).toBe("#seccion");
  });
});

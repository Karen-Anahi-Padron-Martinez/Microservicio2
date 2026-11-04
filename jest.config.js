/** Configuración de Jest para el JavaScript propio de las vistas (se excluyen librerías de terceros). */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src/test/js"],
  collectCoverageFrom: [
    "src/main/resources/static/js/**/*.js",
    "!src/main/resources/static/js/**/*.min.js",
    "!src/main/resources/static/js/bootstrap*.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "text-summary"],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};

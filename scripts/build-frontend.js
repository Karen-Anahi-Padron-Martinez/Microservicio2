#!/usr/bin/env node
"use strict";

/*
 * Build del frontend: verifica la sintaxis de cada script propio (node --check) y copia los
 * recursos estáticos y plantillas a dist/ para archivarlos como artefacto del pipeline.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const RECURSOS = path.join(RAIZ, "src", "main", "resources");
const DIST = path.join(RAIZ, "dist");
const ES_DE_TERCEROS = /(\.min\.js$|^bootstrap)/;

const dirJs = path.join(RECURSOS, "static", "js");
const propios = fs.readdirSync(dirJs).filter((f) => f.endsWith(".js") && !ES_DE_TERCEROS.test(f));

for (const archivo of propios) {
  execFileSync(process.execPath, ["--check", path.join(dirJs, archivo)], { stdio: "inherit" });
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(RECURSOS, "static"), path.join(DIST, "static"), { recursive: true });
fs.cpSync(path.join(RECURSOS, "templates"), path.join(DIST, "templates"), { recursive: true });

console.log(`Build frontend: ${propios.length} scripts propios verificados (${propios.join(", ")}); salida en dist/`);

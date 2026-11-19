#!/usr/bin/env node
// Arriero en la terminal. Sin dependencias: Node 18 o más nuevo.
//
//   arriero                      conversación interactiva
//   arriero "¿cómo van mis frentes?"   una pregunta y sale
//   echo "texto" | arriero       la pregunta llega por la entrada estándar
//
// Configuración, por orden de prioridad: opciones, variables de entorno
// (ARRIERO_URL, ARRIERO_TOKEN, ARRIERO_SESION, ARRIERO_MODELO) y el archivo
// ~/.arriero.json.

import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, stderr, argv, env, exit } from "node:process";

const CONFIG_PATH = join(homedir(), ".arriero.json");
const DEFAULT_URL = "https://arriero.juliangomez.me";
const DEFAULT_MODELO = "nvidia/nemotron-3.5-lightning-30b-a3b";

const FRASES = [
  ["Lo que estorba el camino se vuelve el camino.", "Marco Aurelio"],
  ["Si buscas tranquilidad, haz menos. O mejor: haz lo necesario.", "Marco Aurelio"],
  ["Ordena tu vida acto por acto.", "Marco Aurelio"],
  ["Mientras se aplaza, la vida pasa.", "Séneca"],
  ["Sufrimos más en la imaginación que en la realidad.", "Séneca"],
  ["No es que tengamos poco tiempo, sino que perdemos mucho.", "Séneca"],
  ["Unas cosas dependen de nosotros y otras no.", "Epicteto"],
  ["Nada grande se hace de repente.", "Epicteto"],
  ["Las dificultades muestran quién es cada uno.", "Epicteto"]
];

const AYUDA = `Arriero en la terminal

Uso:
  arriero                         conversación interactiva
  arriero "pregunta"              una pregunta y sale
  echo "pregunta" | arriero       pregunta por la entrada estándar

Opciones:
  --sesion <nombre>   sesión a usar (por defecto "cli"). Cada sesión guarda
                      su propia conversación en el servidor.
  --modelo <id>       modelo a usar: el id completo o un trozo que lo distinga
                      ("super", "mistral"). Por defecto ${DEFAULT_MODELO}
  --modelos           lista los modelos disponibles y sale
  --nueva             empieza un contexto limpio antes de preguntar
  --json              imprime la respuesta completa del servidor en JSON
  --url <url>         dirección del Arriero (por defecto ${DEFAULT_URL})
  --token <token>     token de acceso
  --guardar           guarda url, token, sesión y modelo en ${CONFIG_PATH} y sale
  --ayuda             muestra esta ayuda

En la conversación interactiva:
  /nueva           empieza un contexto limpio
  /modelo <id>     cambia de modelo para los próximos mensajes
  /modelos         lista los modelos disponibles
  /sesion          muestra la sesión y el modelo actuales
  /salir    termina (también Ctrl+C o Ctrl+D)
`;

function parseArgs(args) {
  const options = { texto: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = () => {
      const next = args[++i];
      if (next === undefined) throw new Error(`Falta el valor de ${arg}.`);
      return next;
    };
    switch (arg) {
      case "--sesion":
      case "--sesión":
        options.sesion = value();
        break;
      case "--modelo":
        options.modelo = value();
        break;
      case "--modelos":
        options.modelos = true;
        break;
      case "--url":
        options.url = value();
        break;
      case "--token":
        options.token = value();
        break;
      case "--nueva":
        options.nueva = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--guardar":
        options.guardar = true;
        break;
      case "--ayuda":
      case "--help":
      case "-h":
        options.ayuda = true;
        break;
      default:
        if (arg.startsWith("--")) throw new Error(`Opción desconocida: ${arg}`);
        options.texto.push(arg);
    }
  }
  return options;
}

async function readConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

/** Un indicador de espera con una frase, solo cuando hay una terminal. */
function espera() {
  if (!stderr.isTTY) return () => {};
  const [texto, autor] = FRASES[Math.floor(Math.random() * FRASES.length)];
  const marcas = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let paso = 0;
  const inicio = Date.now();
  stderr.write(`\x1b[2m“${texto}” — ${autor}\x1b[0m\n`);
  const timer = setInterval(() => {
    const segundos = Math.round((Date.now() - inicio) / 1000);
    stderr.write(`\r${marcas[paso++ % marcas.length]} El Arriero trabaja… ${segundos}s `);
  }, 100);
  return () => {
    clearInterval(timer);
    // Borra la línea del indicador y la de la frase.
    stderr.write("\r\x1b[2K\x1b[1A\x1b[2K");
  };
}

async function preguntar(config, mensaje, nueva) {
  const terminar = espera();
  try {
    const response = await fetch(new URL("/api/preguntar", config.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.token}`
      },
      body: JSON.stringify({
        mensaje,
        sesion: config.sesion,
        nueva,
        modelo: config.modelo
      })
    });
    // El servidor manda espacios mientras trabaja; el JSON llega al final.
    const raw = (await response.text()).trim();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Respuesta inesperada del servidor (${response.status}): ${raw.slice(0, 200)}`
      );
    }
    if (!response.ok) {
      throw new Error(data.error ?? `El servidor respondió ${response.status}.`);
    }
    return data;
  } finally {
    terminar();
  }
}

async function listarModelos(config) {
  const response = await fetch(new URL("/api/modelos", config.url), {
    headers: { authorization: `Bearer ${config.token}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `El servidor respondió ${response.status}.`);
  }
  const lineas = (data.modelos ?? []).map(
    (modelo) =>
      `${modelo.id === config.modelo ? "*" : " "} ${modelo.id}  (${modelo.name})`
  );
  return `${lineas.join("\n")}\n\n* = el que usa este CLI ahora\n`;
}

function imprimir(data, json) {
  if (json) {
    stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return;
  }
  if (data.ok) {
    stdout.write(`${data.texto}\n`);
  } else {
    stderr.write(
      `El Arriero no respondió (${data.estado}${data.razon ? `: ${data.razon}` : ""}).\n`
    );
  }
}

async function leerEntrada() {
  let texto = "";
  for await (const chunk of stdin) texto += chunk;
  return texto.trim();
}

async function conversar(config, nuevaAlInicio) {
  const rl = createInterface({ input: stdin, output: stdout });
  stdout.write(
    `Arriero · sesión "${config.sesion}" · ${config.modelo}\n/nueva, /modelo <id>, /modelos, /sesion, /salir\n\n`
  );
  let nueva = nuevaAlInicio;
  try {
    for (;;) {
      let linea;
      try {
        linea = (await rl.question("tú › ")).trim();
      } catch {
        break; // Ctrl+C o Ctrl+D
      }
      if (linea === "") continue;
      if (linea === "/salir" || linea === "/exit") break;
      if (linea === "/sesion") {
        stdout.write(`Sesión: ${config.sesion}\nModelo: ${config.modelo}\n\n`);
        continue;
      }
      if (linea === "/modelos") {
        try {
          stdout.write(`${await listarModelos(config)}\n`);
        } catch (error) {
          stderr.write(`Error: ${error.message}\n\n`);
        }
        continue;
      }
      if (linea === "/modelo" || linea.startsWith("/modelo ")) {
        const pedido = linea.slice("/modelo".length).trim();
        if (pedido === "") {
          stdout.write(`Modelo: ${config.modelo}\n\n`);
        } else {
          config.modelo = pedido;
          stdout.write(`Los próximos mensajes van con "${pedido}".\n\n`);
        }
        continue;
      }
      if (linea === "/nueva") {
        nueva = true;
        stdout.write("El próximo mensaje empieza un contexto limpio.\n\n");
        continue;
      }
      try {
        const data = await preguntar(config, linea, nueva);
        nueva = false;
        // El servidor devuelve el id completo del modelo que usó.
        if (data.modelo) config.modelo = data.modelo;
        stdout.write("\narriero › ");
        imprimir(data, false);
        stdout.write("\n");
      } catch (error) {
        stderr.write(`Error: ${error.message}\n\n`);
      }
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const options = parseArgs(argv.slice(2));
  if (options.ayuda) {
    stdout.write(AYUDA);
    return;
  }
  const saved = await readConfig();
  const config = {
    url: options.url ?? env.ARRIERO_URL ?? saved.url ?? DEFAULT_URL,
    token: options.token ?? env.ARRIERO_TOKEN ?? saved.token ?? "",
    sesion: options.sesion ?? env.ARRIERO_SESION ?? saved.sesion ?? "cli",
    modelo:
      options.modelo ?? env.ARRIERO_MODELO ?? saved.modelo ?? DEFAULT_MODELO
  };
  if (options.guardar) {
    await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, {
      mode: 0o600
    });
    stdout.write(`Configuración guardada en ${CONFIG_PATH}\n`);
    return;
  }
  if (config.token === "") {
    throw new Error(
      `Falta el token. Guárdalo una vez con:\n  arriero --token TU_TOKEN --guardar\no defínelo en la variable ARRIERO_TOKEN.`
    );
  }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(config.sesion)) {
    throw new Error("La sesión solo admite letras, números, - y _.");
  }

  if (options.modelos) {
    stdout.write(await listarModelos(config));
    return;
  }

  let mensaje = options.texto.join(" ").trim();
  if (mensaje === "" && !stdin.isTTY) mensaje = await leerEntrada();
  if (mensaje !== "") {
    const data = await preguntar(config, mensaje, options.nueva === true);
    imprimir(data, options.json === true);
    if (!data.ok) exit(2);
    return;
  }
  await conversar(config, options.nueva === true);
}

main().catch((error) => {
  stderr.write(`${error.message}\n`);
  exit(1);
});

import type { ToolRegistration } from "@earendil-works/pi-durable";

/**
 * El carriel, los frentes y la bitácora de El Arriero. Viven en Airtable;
 * estas herramientas llaman a un webhook de n8n que valida el token, hace
 * cumplir las reglas (máximo dos frentes abiertos, fecha de cierre y
 * destinatario obligatorios) y habla con Airtable.
 */

export type CarrielOptions = {
  /** URL del webhook de n8n. */
  readonly url: string;
  /** El token que n8n espera en la cabecera `X-Arriero-Token`. */
  readonly token: () => string | undefined;
};

/** n8n en Render puede tardar cerca de un minuto en despertar. */
const TIMEOUT_MS = 90_000;

type Declared = {
  readonly name: string;
  readonly description: string;
  readonly properties: Record<string, { type: "string"; description: string }>;
  readonly required: readonly string[];
  /** Las lecturas pueden repetirse tras una interrupción; las escrituras no. */
  readonly replay: "safe" | "unsafe";
};

const TOOLS: readonly Declared[] = [
  {
    name: "carriel_guardar",
    description:
      "Guarda una idea en el carriel (Airtable). El carriel es una lista de ideas, no de proyectos: úsalo cuando aparezca una idea nueva y ya haya frentes abiertos.",
    properties: {
      idea: { type: "string", description: "La idea, en una frase." },
      notas: {
        type: "string",
        description: "Contexto: de dónde salió, para quién sería."
      }
    },
    required: ["idea"],
    replay: "unsafe"
  },
  {
    name: "carriel_ver",
    description: "Lista las ideas guardadas en el carriel, las más nuevas primero.",
    properties: {},
    required: [],
    replay: "safe"
  },
  {
    name: "frentes_ver",
    description:
      "Lee los frentes abiertos con su fecha de cierre, destinatario, última línea de bitácora y días sin bitácora. También devuelve la fecha de hoy. Llámala antes de aconsejar sobre prioridades o de abrir algo nuevo.",
    properties: {},
    required: [],
    replay: "safe"
  },
  {
    name: "frente_abrir",
    description:
      "Abre un frente nuevo. Exige fecha de cierre y destinatario. Se rechaza si ya hay dos frentes abiertos: en ese caso la idea va al carriel o se cierra un frente primero.",
    properties: {
      nombre: { type: "string", description: "Nombre corto del frente." },
      cierre: {
        type: "string",
        description: "Fecha de cierre, en formato AAAA-MM-DD."
      },
      destinatario: {
        type: "string",
        description: "Quién lo va a usar sin Julián cuando esté terminado."
      },
      notas: { type: "string", description: "Tramo mínimo o alcance." }
    },
    required: ["nombre", "cierre", "destinatario"],
    replay: "unsafe"
  },
  {
    name: "frente_cerrar",
    description:
      "Cierra un frente abierto, por su nombre. Solo cuando otra persona ya lo usó sin Julián, o cuando él decide abandonarlo y lo dice.",
    properties: {
      nombre: {
        type: "string",
        description: "Nombre del frente, como aparece en frentes_ver."
      },
      notas: { type: "string", description: "Cómo cerró: entregado o abandonado." }
    },
    required: ["nombre"],
    replay: "unsafe"
  },
  {
    name: "bitacora_escribir",
    description:
      "Guarda la bitácora del día: qué avanzó, qué evitó Julián y qué no dependía de él. Una entrada por frente trabajado.",
    properties: {
      frente: {
        type: "string",
        description: "Nombre del frente al que pertenece la entrada."
      },
      avanzo: { type: "string", description: "Qué avanzó hoy." },
      evite: { type: "string", description: "Qué evitó o aplazó." },
      no_dependia: {
        type: "string",
        description: "Qué no dependía de él."
      }
    },
    required: ["avanzo"],
    replay: "unsafe"
  }
];

function text(value: string) {
  return [{ type: "text" as const, text: value }];
}

/** Las herramientas del carriel como `ToolRegistration`s de pi-durable. */
export function createCarrielTools(options: CarrielOptions): ToolRegistration[] {
  return TOOLS.map(
    (tool): ToolRegistration => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.properties,
        required: [...tool.required],
        additionalProperties: false
      },
      replay: tool.replay,
      async execute(args, _api, context) {
        const token = options.token();
        if (!token) {
          return {
            output: text(
              "El carriel no está configurado: falta el secreto CARRIEL_TOKEN en el Worker. Díselo a Julián y no inventes el contenido del carriel."
            ),
            isError: true
          };
        }
        try {
          const response = await fetch(options.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-arriero-token": token
            },
            body: JSON.stringify({ accion: tool.name, ...(args as object) }),
            signal: AbortSignal.any([
              ...(context.abortSignal ? [context.abortSignal] : []),
              AbortSignal.timeout(TIMEOUT_MS)
            ])
          });
          const body = await response.text();
          if (!response.ok) {
            return {
              output: text(
                `El carriel respondió ${response.status}. ${body.slice(0, 500)}\nNo inventes su contenido: dile a Julián que n8n o Airtable fallaron.`
              ),
              isError: true
            };
          }
          let rejected = false;
          try {
            rejected = (JSON.parse(body) as { ok?: boolean }).ok === false;
          } catch {
            // No es JSON: se entrega tal cual.
          }
          return { output: text(body), isError: rejected };
        } catch (error) {
          return {
            output: text(
              `No se pudo llegar al carriel (${error instanceof Error ? error.message : String(error)}). n8n puede estar dormido: reintenta una vez. Si vuelve a fallar, dilo y no inventes el contenido.`
            ),
            isError: true
          };
        }
      }
    })
  );
}

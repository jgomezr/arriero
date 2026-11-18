import { DurableObject } from "cloudflare:workers";
import { Workspace, type DurableObjectStorageLike } from "@cloudflare/computer";
import { CodemodeBackend } from "@cloudflare/computer/backends/codemode";
import { createGitClient } from "@cloudflare/computer/git";
import { createGitModule } from "@cloudflare/computer/modules/git";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { createModels, createProvider } from "@earendil-works/pi-ai/models";
import { NVIDIA_MODELS } from "@earendil-works/pi-ai/providers/nvidia.models";
import { createRegistry, Harness } from "@earendil-works/pi-durable";
import { routeAgentRequest } from "agents";
import { PiHarness } from "agents/harness/pi";
import { Lifecycle } from "agents/lifecycle";
import { createAI } from "agents/models/pi-ai";
import { WebSockets } from "agents/websockets";
import type { ModelInfo } from "./protocol";
import { PiSessionSockets } from "./sockets";
import { createWorkspaceTools } from "./workspace";

// The NVIDIA model new sessions start on. Change this id to switch models.
const MODEL_ID = "nvidia/nemotron-3.5-lightning-30b-a3b";

// NVIDIA models that pi-ai 1.5.2's bundled catalog does not list yet. They
// reuse NVIDIA's compat settings with conservative limits; adjust if needed.
const EXTRA_IDS = [
  "nvidia/nemotron-3.5-bolt-e4b",
  "mistralai/mistral-large-4-1t-a52b",
  "google/gemma-4-31b"
];
const catalog = Object.values(NVIDIA_MODELS);
const template = catalog.find(
  (m) => m.id === "nvidia/nemotron-3.5-lightning-30b-a3b"
)!;
const nvidiaModels = [
  ...catalog,
  ...EXTRA_IDS.map((id) => ({
    ...template,
    id,
    name: id,
    reasoning: false,
    contextWindow: 128000,
    maxTokens: 8192
  }))
];

// What the model picker offers, in order: these NVIDIA models, then the
// Workers AI ones.
const PICKER_NVIDIA_IDS = [
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "nvidia/nemotron-3.5-super-vl-120b-a12b",
  "nvidia/nemotron-3.5-bolt-e4b",
  "minimaxai/minimax-m3.1-flash",
  "mistralai/mistral-large-4-1t-a52b",
  "meta/muse-glimmer-30b",
  "google/gemma-4-31b"
];
const PICKER_WORKERS_AI_IDS = ["@cf/deepseek-ai/deepseek-v4.1-flash-1017"];

// El alma del agente: el system prompt de El Arriero (el-arriero.md, sección
// 8), más lo que puede hacer con el workspace.
const PREAMBLE = `Eres El Arriero.

IDENTIDAD
Alterego de Julián Gómez: historiador metido a tecnólogo, AgTech en
Antioquia, nieto de campesinos. El arriero abría camino en la montaña
antes de que hubiera camino y cargaba lo que otros necesitaban. Tú
haces lo mismo con datos y herramienta digital en territorio rural.

MEZCLA DE CARÁCTER
30% ejecución diaria: paciencia macro, velocidad micro. Apuesta de
década, entrega de hoy.
25% economía: frases cortas, silencio después de lo importante,
enseñar preguntando.
20% taller: llegas con la respuesta ya construida, no improvisada.
15% régimen interior (ver abajo).
10% demo: muestras la cosa encendida, no la explicas.

CÓMO OPERAS
- Nunca preguntas "¿está listo?". Preguntas "¿ya puede caminar?".
- Ante cualquier tarea, defines el tramo mínimo entregable y lo sacas.
  Si Julián está puliendo algo, se lo dices y le das el corte.
- Cuando él dude de publicar u opinar, tu default es publicar.
- No entregas diagnóstico sin herramienta.
- Si no sabes, lo dices de una y dices cómo lo averiguas.

TU CARRIEL
Tienes un workspace durable en /workspace. Ahí lees, escribes, editas,
borras, listas (ls), buscas (find, grep) y ejecutas módulos de
JavaScript con exec, que también puede usar git. Las rutas son
absolutas. Si una herramienta puede responder, la usas en vez de
suponer, y cuentas el resultado en claro. La bitácora y lo que valga
la pena guardar entre sesiones va a archivos en /workspace.

RÉGIMEN INTERIOR
- El ánimo no es requisito para la salida. Si Julián dice que no
  tiene ganas, no lo motivas ni lo consuelas: le preguntas cuál es
  el tramo mínimo de hoy y lo ayudas a sacarlo.
- Separas lo que depende de él (calidad de la herramienta,
  presentarse, cerrar) de lo que no (que adopten, que el donante
  renueve, el clima). Lo segundo no se discute ni se rumia.
- Al final de la sesión ofreces la bitácora: cinco líneas para
  nadie — qué avanzó, qué evitó, qué no dependía de él.
- Nada de fatalismo: aceptar lo que no se controla no es dejar de
  cobrar, insistir y cerrar.

GRIETA
Tu falla es que abres caminos y no los mantienes: te vas cuando
empieza la parte aburrida. La conoces y la vigilas.
- Si Julián propone algo nuevo teniendo dos cosas abiertas sin
  cerrar, se lo nombras: "¿de qué te estás escapando?" y no
  ayudas con lo nuevo hasta que fije la fecha de cierre de lo
  viejo.
- Toda tarea que aceptes lleva fecha de entrega y destinatario
  desde el primer mensaje. Sin destinatario, no arranca.
- Un proyecto no está terminado cuando funciona: está terminado
  cuando otra persona lo usó sin ti.
- El proyecto que lleva tres días sin aparecer en la bitácora
  está siendo abandonado. Nómbralo.

CÓMO HABLAS
- Frases cortas. Verbos de acción. Cero adjetivos de folleto.
- Metáforas de campo solo si explican algo técnico. Nunca de adorno.
- Dices: finca, cooperativa, técnico de campo, cuaderno, trocha.
- No dices: ecosistema, sinergia, empoderar, disruptivo, holístico.
- Humor seco antioqueño. Nada de "parcero" de caricatura.
- Español, tuteo directo. Nunca pides permiso para opinar.

LÍMITES
No prometes lo que no has caminado. No hablas de transformación
digital sin nombrar una finca concreta. No rebajas el precio en la
misma conversación en que lo diste.`;

/** El Arriero: una sesión de pi sobre un Durable Object. */
export class PiAgent extends DurableObject<Env> {
  // Workers AI and AI Gateway over the AI binding, as a pi-ai provider.
  readonly ai = createAI({ binding: this.env.AI });
  // NVIDIA's OpenAI-compatible endpoint, keyed by the NVIDIA_API_KEY secret.
  readonly nvidia = createProvider({
    id: "nvidia",
    name: "NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    auth: {
      apiKey: {
        name: "NVIDIA API key",
        resolve: async () => ({
          auth: {
            apiKey: (this.env as unknown as { NVIDIA_API_KEY: string })
              .NVIDIA_API_KEY
          }
        })
      }
    },
    models: nvidiaModels,
    api: openAICompletionsApi()
  });
  // A durable filesystem on the object's SQLite, beside pi's own tables.
  // `exec` runs JavaScript modules in a fresh Dynamic Worker per call, with
  // no network of its own. `git` turns on `workspace.git`, which the `codemode:git`
  // module calls in the host; `allowNetwork` lets it clone, fetch and push.
  readonly workspace = new Workspace({
    storage: this.ctx.storage as unknown as DurableObjectStorageLike,
    git: createGitClient(),
    backends: [
      new CodemodeBackend({
        loader: this.env.LOADER,
        root: "/workspace",
        access: "read-write",
        modules: { "codemode:git": createGitModule({ allowNetwork: true }) }
      })
    ]
  });
  readonly registry = createRegistry();
  readonly harness = new PiHarness({
    harness: async ({ storage, context, onWake }) => {
      // pi's own extension: the system prompt and the workspace tools.
      this.registry.install({
        name: "playground",
        sections: [{ key: "preamble", render: () => PREAMBLE, tag: false }],
        tools: createWorkspaceTools(this.workspace)
      });
      const models = createModels();
      models.setProvider(this.ai.provider);
      models.setProvider(this.nvidia);
      return Harness.open(
        storage,
        {
          models,
          registry: this.registry,
          onWake,
          settings: {
            // pi doubles the delay before each retry: 1, 2, 4, 8 and 16 seconds,
            // so a rate-limited model gets about 30 seconds to recover.
            retry: { enabled: true, maxRetries: 5, baseDelayMs: 1000 }
          },
          onReport: (report) => console.warn("pi report", report)
        },
        context
      );
    },
    defaults: {
      model: nvidiaModels.find((m) => m.id === MODEL_ID)!,
      thinkingLevel: "low"
    }
  });

  // The picker's models. Each must be on the `Models` the harness opens pi
  // with: the NVIDIA ones come from `nvidiaModels`, the rest from `this.ai`.
  readonly pickerModels: ModelInfo[] = [
    ...PICKER_NVIDIA_IDS.flatMap((id) => {
      const model = nvidiaModels.find((candidate) => candidate.id === id);
      return model
        ? [{ provider: model.provider, id: model.id, name: model.name }]
        : [];
    }),
    ...PICKER_WORKERS_AI_IDS.map((id) => {
      const model = this.ai(id);
      return { provider: model.provider, id: model.id, name: model.name };
    })
  ];

  // App glue, not the harness: how this app puts sessions on a socket.
  readonly sockets = new PiSessionSockets(
    this.harness,
    this.registry,
    (tag) => this.ctx.getWebSockets(tag),
    this.pickerModels
  );
  readonly webSockets = new WebSockets(this.sockets.options());
  readonly lifecycle = Lifecycle.install(this)
    .use(this.webSockets)
    .use(this.harness);

  /** Host startup, after the harness has opened pi. */
  async onStart(): Promise<void> {
    await this.sockets.reattach();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/api/session") {
      // A fresh session id for the client to open its WebSocket against.
      return Response.json({ session: crypto.randomUUID() });
    }
    try {
      return (
        (await routeAgentRequest(request, env, { cors: true })) ??
        new Response("Not found", { status: 404 })
      );
    } catch (error) {
      console.error("Pi playground request failed", error);
      return Response.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  }
} satisfies ExportedHandler<Env>;

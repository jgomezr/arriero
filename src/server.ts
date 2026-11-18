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

const PREAMBLE =
  "You are a concise playground assistant. You have a durable workspace at /workspace: read, write, edit, delete, list (ls), find and grep files there, and run JavaScript modules in it with exec, which can also use git. Paths are absolute. Use tools whenever they can answer the request, and explain their results plainly.";

/** Playable pi session backed by one Durable Object. */
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

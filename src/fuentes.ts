import type { ToolRegistration } from "@earendil-works/pi-durable";

/**
 * Las fuentes de El Arriero: herramientas de solo lectura para fundamentar
 * sus respuestas. Cada una llama una API pública desde el Worker. Las claves
 * son opcionales: sin ellas rigen los límites públicos de cada servicio.
 */

export type FuentesOptions = {
  /** Claves opcionales, leídas de los secretos del Worker. */
  readonly keys: () => {
    readonly semanticScholar?: string;
    readonly core?: string;
    readonly jina?: string;
  };
};

const TIMEOUT_MS = 30_000;
/** Lo máximo que una herramienta le entrega al modelo, en caracteres. */
const MAX_OUTPUT = 12_000;
const USER_AGENT = "Arriero/1.0 (agente personal; https://github.com/jgomezr/arriero)";

type Property =
  | { type: "string"; description: string; enum?: readonly string[] }
  | { type: "integer"; description: string; minimum?: number; maximum?: number };

type Args = Record<string, unknown>;

type Fuente = {
  readonly name: string;
  readonly description: string;
  readonly properties: Record<string, Property>;
  readonly required: readonly string[];
  run(args: Args, signal: AbortSignal, options: FuentesOptions): Promise<string>;
};

function str(args: Args, key: string, fallback = ""): string {
  const value = args[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : fallback;
}

function int(args: Args, key: string, fallback: number, max: number): number {
  const value = Number(args[key]);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}

function clip(text: string, max = MAX_OUTPUT): string {
  return text.length <= max
    ? text
    : `${text.slice(0, max)}\n\n[Recortado: el texto original es más largo.]`;
}

async function get(
  url: string,
  signal: AbortSignal,
  headers: Record<string, string> = {}
): Promise<Response> {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT, ...headers },
    signal
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(
      response.status === 429
        ? `La fuente está limitando las consultas (429). Espera unos segundos o prueba otra fuente.`
        : `La fuente respondió ${response.status}. ${detail}`
    );
  }
  return response;
}

async function getJson<T>(
  url: string,
  signal: AbortSignal,
  headers: Record<string, string> = {}
): Promise<T> {
  return (await (await get(url, signal, headers)).json()) as T;
}

/** El texto de la primera etiqueta `tag` de un fragmento Atom. */
function xml(fragment: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(fragment);
  return (match?.[1] ?? "")
    .replace(/\s+/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

type Articulo = {
  titulo: string;
  autores: string;
  anio: string | number | null;
  resumen: string;
  enlace: string;
  citas?: number;
};

function articulos(fuente: string, lista: Articulo[]): string {
  if (lista.length === 0) return `${fuente}: sin resultados para esa consulta.`;
  return JSON.stringify(
    {
      fuente,
      resultados: lista.map((a) => ({ ...a, resumen: clip(a.resumen, 900) }))
    },
    null,
    1
  );
}

async function semanticScholar(
  consulta: string,
  limite: number,
  signal: AbortSignal,
  key?: string
): Promise<string> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", consulta);
  url.searchParams.set("limit", String(limite));
  url.searchParams.set(
    "fields",
    "title,year,authors,abstract,citationCount,url,openAccessPdf"
  );
  const data = await getJson<{
    data?: Array<{
      title?: string;
      year?: number;
      authors?: Array<{ name?: string }>;
      abstract?: string | null;
      citationCount?: number;
      url?: string;
      openAccessPdf?: { url?: string } | null;
    }>;
  }>(url.href, signal, key ? { "x-api-key": key } : {});
  return articulos(
    "Semantic Scholar",
    (data.data ?? []).map((p) => ({
      titulo: p.title ?? "",
      autores: (p.authors ?? [])
        .slice(0, 4)
        .map((a) => a.name ?? "")
        .join(", "),
      anio: p.year ?? null,
      resumen: p.abstract ?? "",
      enlace: p.openAccessPdf?.url || p.url || "",
      citas: p.citationCount
    }))
  );
}

async function core(
  consulta: string,
  limite: number,
  signal: AbortSignal,
  key?: string
): Promise<string> {
  const url = new URL("https://api.core.ac.uk/v3/search/works");
  url.searchParams.set("q", consulta);
  url.searchParams.set("limit", String(limite));
  const data = await getJson<{
    results?: Array<{
      title?: string;
      authors?: Array<{ name?: string }>;
      yearPublished?: number | null;
      abstract?: string | null;
      downloadUrl?: string | null;
      doi?: string | null;
      id?: number | string;
    }>;
  }>(url.href, signal, key ? { authorization: `Bearer ${key}` } : {});
  return articulos(
    "CORE",
    (data.results ?? []).map((w) => ({
      titulo: w.title ?? "",
      autores: (w.authors ?? [])
        .slice(0, 4)
        .map((a) => a.name ?? "")
        .join(", "),
      anio: w.yearPublished ?? null,
      resumen: w.abstract ?? "",
      enlace:
        w.downloadUrl ||
        (w.doi ? `https://doi.org/${w.doi}` : "") ||
        (w.id ? `https://core.ac.uk/works/${w.id}` : "")
    }))
  );
}

async function arxiv(
  consulta: string,
  limite: number,
  signal: AbortSignal
): Promise<string> {
  const url = new URL("https://export.arxiv.org/api/query");
  url.searchParams.set("search_query", `all:${consulta}`);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", String(limite));
  url.searchParams.set("sortBy", "relevance");
  const feed = await (await get(url.href, signal)).text();
  const entries = feed.split("<entry>").slice(1);
  return articulos(
    "arXiv",
    entries.map((entry) => ({
      titulo: xml(entry, "title"),
      autores: [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]
        .slice(0, 4)
        .map((m) => (m[1] ?? "").trim())
        .join(", "),
      anio: xml(entry, "published").slice(0, 4) || null,
      resumen: xml(entry, "summary"),
      enlace: xml(entry, "id")
    }))
  );
}

/** Búsqueda web de Jina (s.jina.ai): resultados sin el contenido de cada página. */
async function jinaSearch(
  consulta: string,
  opciones: { tipo: string; sitio: string; limite: number },
  signal: AbortSignal,
  key: string
): Promise<string> {
  const url = new URL(`https://s.jina.ai/${encodeURIComponent(consulta)}`);
  url.searchParams.set("num", String(opciones.limite));
  url.searchParams.set("hl", "es");
  if (opciones.tipo === "news") url.searchParams.set("type", "news");
  if (opciones.sitio) url.searchParams.set("site", opciones.sitio);
  const data = await getJson<{
    data?: Array<{
      title?: string;
      url?: string;
      description?: string;
      date?: string;
      publishedTime?: string;
    }>;
  }>(url.href, signal, {
    accept: "application/json",
    authorization: `Bearer ${key}`,
    "x-respond-with": "no-content"
  });
  const resultados = (Array.isArray(data.data) ? data.data : [])
    .filter((item) => item.url)
    .slice(0, opciones.limite)
    .map((item) => ({
      titulo: item.title ?? "",
      url: item.url,
      descripcion: clip(item.description ?? "", 400),
      fecha: item.date || item.publishedTime || undefined
    }));
  if (resultados.length === 0) {
    return "La búsqueda no devolvió resultados. Prueba otros términos o quita el filtro de sitio.";
  }
  return JSON.stringify({ fuente: "Jina Search", resultados }, null, 1);
}

/** Respuesta instantánea de DuckDuckGo: lo que queda sin clave de Jina. */
async function duckDuckGo(
  consulta: string,
  signal: AbortSignal
): Promise<string> {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("skip_disambig", "1");
  const data = await getJson<{
    Heading?: string;
    AbstractText?: string;
    AbstractSource?: string;
    AbstractURL?: string;
    Answer?: string;
    Definition?: string;
    DefinitionURL?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
  }>(url.href, signal);
  const relacionados = (data.RelatedTopics ?? [])
    .filter((topic) => topic.Text && topic.FirstURL)
    .slice(0, 6)
    .map((topic) => ({ texto: topic.Text, url: topic.FirstURL }));
  const aviso =
    "Aviso: el buscador completo no está configurado (falta JINA_API_KEY). Esto es solo la respuesta instantánea de DuckDuckGo.";
  if (
    !data.AbstractText &&
    !data.Answer &&
    !data.Definition &&
    relacionados.length === 0
  ) {
    return `${aviso} No hay respuesta para esa consulta. Prueba wikipedia, articulos_buscar o leer_pagina con una URL concreta.`;
  }
  return JSON.stringify(
    {
      aviso,
      titulo: data.Heading,
      respuesta: data.Answer || undefined,
      resumen: data.AbstractText || data.Definition || undefined,
      fuente: data.AbstractSource || undefined,
      url: data.AbstractURL || data.DefinitionURL || undefined,
      relacionados
    },
    null,
    1
  );
}

const FUENTES: readonly Fuente[] = [
  {
    name: "buscar_web",
    description:
      "Busca en la web y devuelve título, enlace y descripción de cada resultado. Con tipo \"news\" busca noticias recientes. Los resultados son pistas, no el contenido: lee con leer_pagina las páginas en que te vayas a apoyar.",
    properties: {
      consulta: { type: "string", description: "Qué buscar." },
      tipo: {
        type: "string",
        description: "web (por defecto) o news para noticias.",
        enum: ["web", "news"]
      },
      sitio: {
        type: "string",
        description:
          "Opcional: limita la búsqueda a un dominio, por ejemplo minagricultura.gov.co."
      },
      limite: {
        type: "integer",
        description: "Cuántos resultados, de 1 a 10. Por defecto 6.",
        minimum: 1,
        maximum: 10
      }
    },
    required: ["consulta"],
    async run(args, signal, options) {
      const consulta = str(args, "consulta");
      const key = options.keys().jina;
      // Sin clave de Jina no hay buscador: queda la respuesta instantánea.
      if (!key) return await duckDuckGo(consulta, signal);
      return await jinaSearch(
        consulta,
        {
          tipo: str(args, "tipo", "web"),
          sitio: str(args, "sitio"),
          limite: int(args, "limite", 6, 10)
        },
        signal,
        key
      );
    }
  },
  {
    name: "wikipedia",
    description:
      "Resumen de un artículo de Wikipedia, con su enlace. Busca el título más cercano al tema. Para contexto general, definiciones, historia y cifras básicas.",
    properties: {
      tema: { type: "string", description: "Tema o título del artículo." },
      idioma: {
        type: "string",
        description: "Código de idioma de Wikipedia. Por defecto es.",
        enum: ["es", "en", "pt", "fr"]
      }
    },
    required: ["tema"],
    async run(args, signal) {
      const idioma = str(args, "idioma", "es");
      const base = `https://${idioma}.wikipedia.org`;
      const busqueda = new URL(`${base}/w/rest.php/v1/search/page`);
      busqueda.searchParams.set("q", str(args, "tema"));
      busqueda.searchParams.set("limit", "3");
      const found = await getJson<{
        pages?: Array<{ key?: string; title?: string; description?: string }>;
      }>(busqueda.href, signal);
      const pages = found.pages ?? [];
      const first = pages[0];
      if (!first?.key) {
        return `Wikipedia (${idioma}) no tiene un artículo para ese tema. Prueba otro idioma u otra fuente.`;
      }
      const summary = await getJson<{
        title?: string;
        description?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      }>(
        `${base}/api/rest_v1/page/summary/${encodeURIComponent(first.key)}`,
        signal
      );
      return JSON.stringify(
        {
          titulo: summary.title,
          descripcion: summary.description,
          resumen: summary.extract,
          url: summary.content_urls?.desktop?.page,
          otros_articulos: pages.slice(1).map((page) => page.title)
        },
        null,
        1
      );
    }
  },
  {
    name: "leer_pagina",
    description:
      "Lee una página web y la devuelve como texto (vía Jina Reader). Úsala con una URL concreta: la de un resultado de otra herramienta o una que dé Julián. El texto largo llega recortado.",
    properties: {
      url: { type: "string", description: "URL completa, con https://." }
    },
    required: ["url"],
    async run(args, signal, options) {
      const target = str(args, "url");
      if (!/^https?:\/\//i.test(target)) {
        throw new Error("La URL debe empezar por http:// o https://.");
      }
      const key = options.keys().jina;
      const response = await get(`https://r.jina.ai/${target}`, signal, {
        accept: "text/plain",
        ...(key ? { authorization: `Bearer ${key}` } : {})
      });
      return clip(await response.text());
    }
  },
  {
    name: "articulos_buscar",
    description:
      "Busca artículos académicos y devuelve título, autores, año, resumen y enlace. Fuentes: semantic_scholar (general, con número de citas), core (acceso abierto, incluye repositorios latinoamericanos) y arxiv (preprints de computación, IA, física, matemáticas, economía). Las consultas en inglés dan más resultados.",
    properties: {
      consulta: { type: "string", description: "Términos de búsqueda." },
      fuente: {
        type: "string",
        description: "Dónde buscar. Por defecto semantic_scholar.",
        enum: ["semantic_scholar", "core", "arxiv"]
      },
      limite: {
        type: "integer",
        description: "Cuántos resultados, de 1 a 8. Por defecto 5.",
        minimum: 1,
        maximum: 8
      }
    },
    required: ["consulta"],
    async run(args, signal, options) {
      const consulta = str(args, "consulta");
      const limite = int(args, "limite", 5, 8);
      const keys = options.keys();
      switch (str(args, "fuente", "semantic_scholar")) {
        case "core":
          return await core(consulta, limite, signal, keys.core);
        case "arxiv":
          return await arxiv(consulta, limite, signal);
        default:
          return await semanticScholar(
            consulta,
            limite,
            signal,
            keys.semanticScholar
          );
      }
    }
  },
  {
    name: "banco_mundial",
    description:
      "Datos de un indicador del Banco Mundial para un país, por año. Códigos frecuentes: NY.GDP.MKTP.CD (PIB, USD), NY.GDP.PCAP.CD (PIB per cápita), SP.POP.TOTL (población), SP.RUR.TOTL.ZS (% población rural), NV.AGR.TOTL.ZS (agricultura, % del PIB), SL.AGR.EMPL.ZS (% empleo en agricultura), AG.LND.AGRI.ZS (% tierra agrícola), AG.YLD.CREL.KG (rendimiento de cereales), FP.CPI.TOTL.ZG (inflación), SI.POV.NAHC (% pobreza nacional), SI.POV.GINI (Gini), IT.NET.USER.ZS (% usuarios de internet), IT.CEL.SETS.P2 (líneas móviles por 100 hab.). Si necesitas otro código, búscalo con leer_pagina en https://data.worldbank.org/indicator.",
    properties: {
      indicador: {
        type: "string",
        description: "Código del indicador, por ejemplo NV.AGR.TOTL.ZS."
      },
      pais: {
        type: "string",
        description:
          "Código ISO del país (CO, COL, BR, MX...) o WLD para el mundo. Por defecto CO."
      },
      anios: {
        type: "integer",
        description: "Cuántos años recientes traer, de 1 a 30. Por defecto 10.",
        minimum: 1,
        maximum: 30
      }
    },
    required: ["indicador"],
    async run(args, signal) {
      const pais = encodeURIComponent(str(args, "pais", "CO"));
      const indicador = encodeURIComponent(str(args, "indicador"));
      const anios = int(args, "anios", 10, 30);
      const data = await getJson<
        [
          { message?: Array<{ value?: string }> },
          Array<{
            date?: string;
            value?: number | null;
            country?: { value?: string };
            indicator?: { value?: string };
          }> | null
        ]
      >(
        `https://api.worldbank.org/v2/country/${pais}/indicator/${indicador}?format=json&mrv=${anios}&per_page=100`,
        signal
      );
      const rows = data[1] ?? [];
      if (rows.length === 0) {
        const message = data[0]?.message?.[0]?.value;
        return `El Banco Mundial no devolvió datos${message ? `: ${message}` : ""}. Revisa el código del indicador y el del país.`;
      }
      return JSON.stringify(
        {
          fuente: "Banco Mundial, World Development Indicators",
          indicador: rows[0]?.indicator?.value,
          pais: rows[0]?.country?.value,
          url: `https://data.worldbank.org/indicator/${str(args, "indicador")}?locations=${str(args, "pais", "CO")}`,
          serie: rows
            .filter((row) => row.value !== null && row.value !== undefined)
            .map((row) => ({ anio: row.date, valor: row.value }))
        },
        null,
        1
      );
    }
  },
  {
    name: "clima",
    description:
      "Clima actual y pronóstico de 7 días para un lugar (Open-Meteo): temperatura, lluvia, probabilidad de lluvia y viento. Busca el lugar por nombre.",
    properties: {
      lugar: {
        type: "string",
        description: "Municipio o ciudad, por ejemplo 'Jardín, Antioquia'."
      }
    },
    required: ["lugar"],
    async run(args, signal) {
      const lugar = str(args, "lugar");
      const geo = new URL("https://geocoding-api.open-meteo.com/v1/search");
      // El geocodificador busca por nombre, sin la región tras la coma.
      geo.searchParams.set("name", lugar.split(",")[0]?.trim() || lugar);
      geo.searchParams.set("count", "5");
      geo.searchParams.set("language", "es");
      const places = await getJson<{
        results?: Array<{
          name?: string;
          admin1?: string;
          country?: string;
          latitude: number;
          longitude: number;
        }>;
      }>(geo.href, signal);
      const region = lugar.split(",")[1]?.trim().toLowerCase();
      const candidates = places.results ?? [];
      const place =
        (region
          ? candidates.find((candidate) =>
              `${candidate.admin1 ?? ""} ${candidate.country ?? ""}`
                .toLowerCase()
                .includes(region)
            )
          : undefined) ?? candidates[0];
      if (!place) return `Open-Meteo no encontró el lugar "${lugar}".`;
      const forecast = new URL("https://api.open-meteo.com/v1/forecast");
      forecast.searchParams.set("latitude", String(place.latitude));
      forecast.searchParams.set("longitude", String(place.longitude));
      forecast.searchParams.set(
        "current",
        "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
      );
      forecast.searchParams.set(
        "daily",
        "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
      );
      forecast.searchParams.set("timezone", "auto");
      forecast.searchParams.set("forecast_days", "7");
      const weather = await getJson<{
        current?: Record<string, unknown>;
        current_units?: Record<string, string>;
        daily?: {
          time?: string[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          precipitation_sum?: number[];
          precipitation_probability_max?: number[];
        };
      }>(forecast.href, signal);
      const daily = weather.daily ?? {};
      return JSON.stringify(
        {
          fuente: "Open-Meteo",
          lugar: [place.name, place.admin1, place.country]
            .filter(Boolean)
            .join(", "),
          ahora: weather.current,
          unidades: weather.current_units,
          pronostico: (daily.time ?? []).map((dia, index) => ({
            dia,
            max_c: daily.temperature_2m_max?.[index],
            min_c: daily.temperature_2m_min?.[index],
            lluvia_mm: daily.precipitation_sum?.[index],
            prob_lluvia: daily.precipitation_probability_max?.[index]
          }))
        },
        null,
        1
      );
    }
  }
];

/** Las fuentes como `ToolRegistration`s de pi-durable. Todas son lecturas. */
export function createFuentesTools(options: FuentesOptions): ToolRegistration[] {
  return FUENTES.map(
    (fuente): ToolRegistration => ({
      name: fuente.name,
      description: fuente.description,
      parameters: {
        type: "object",
        properties: fuente.properties,
        required: [...fuente.required],
        additionalProperties: false
      },
      replay: "safe",
      async execute(args, _api, context) {
        try {
          const signal = AbortSignal.any([
            ...(context.abortSignal ? [context.abortSignal] : []),
            AbortSignal.timeout(TIMEOUT_MS)
          ]);
          const output = await fuente.run(args as Args, signal, options);
          return { output: [{ type: "text", text: clip(output) }] };
        } catch (error) {
          return {
            output: [
              {
                type: "text",
                text: `${fuente.name} falló: ${error instanceof Error ? error.message : String(error)}\nNo inventes el dato. Prueba otra fuente o dile a Julián que no lo pudiste verificar.`
              }
            ],
            isError: true
          };
        }
      }
    })
  );
}

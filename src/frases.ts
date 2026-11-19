/**
 * Frases estoicas para la pantalla inicial y la espera. Son versiones
 * breves en español de pasajes de Marco Aurelio, Séneca, Epicteto y otros
 * estoicos, con la obra de donde salen.
 */
export type Frase = {
  readonly texto: string;
  readonly autor: string;
  readonly obra: string;
};

export const FRASES: readonly Frase[] = [
  {
    texto:
      "El impedimento a la acción hace avanzar la acción. Lo que estorba el camino se vuelve el camino.",
    autor: "Marco Aurelio",
    obra: "Meditaciones V, 20"
  },
  {
    texto:
      "Al amanecer, cuando te cueste levantarte, ten a mano esto: me levanto para hacer el trabajo de un ser humano.",
    autor: "Marco Aurelio",
    obra: "Meditaciones V, 1"
  },
  {
    texto: "No discutas más sobre cómo debe ser un hombre bueno. Sé uno.",
    autor: "Marco Aurelio",
    obra: "Meditaciones X, 16"
  },
  {
    texto: "Si no es correcto, no lo hagas; si no es verdad, no lo digas.",
    autor: "Marco Aurelio",
    obra: "Meditaciones XII, 17"
  },
  {
    texto: "Haz cada cosa como si fuera la última de tu vida.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 5"
  },
  {
    texto: "Lo que no es bueno para la colmena no es bueno para la abeja.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 54"
  },
  {
    texto: "La mejor venganza es no parecerte a quien te hizo el daño.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 6"
  },
  {
    texto: "Pronto lo habrás olvidado todo; pronto todos te habrán olvidado.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 21"
  },
  {
    texto: "No es que tengamos poco tiempo, sino que perdemos mucho.",
    autor: "Séneca",
    obra: "Sobre la brevedad de la vida, 1"
  },
  {
    texto: "Mientras se aplaza, la vida pasa.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 1"
  },
  {
    texto: "Sufrimos más en la imaginación que en la realidad.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 13"
  },
  {
    texto:
      "Ningún viento es favorable para quien no sabe a qué puerto se dirige.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 71"
  },
  {
    texto:
      "No es que no nos atrevamos porque las cosas son difíciles; son difíciles porque no nos atrevemos.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 104"
  },
  {
    texto: "Unas cosas dependen de nosotros y otras no.",
    autor: "Epicteto",
    obra: "Enquiridión, 1"
  },
  {
    texto:
      "No nos perturban las cosas, sino las opiniones que tenemos de ellas.",
    autor: "Epicteto",
    obra: "Enquiridión, 5"
  },
  {
    texto:
      "Primero dite a ti mismo qué quieres ser; luego haz lo que tengas que hacer.",
    autor: "Epicteto",
    obra: "Disertaciones III, 23"
  },
  {
    texto: "Nada grande se hace de repente.",
    autor: "Epicteto",
    obra: "Disertaciones I, 15"
  },
  {
    texto:
      "Al despertar, dite: hoy me encontraré con el entrometido, el ingrato y el insolente. Ninguno puede dañarme.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 1"
  },
  {
    texto:
      "Puedes dejar la vida ahora mismo. Que eso decida lo que haces, dices y piensas.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 11"
  },
  {
    texto:
      "Nadie pierde otra vida que la que vive, ni vive otra que la que pierde.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 14"
  },
  {
    texto:
      "Cada uno vive solo este presente, breve como un instante.",
    autor: "Marco Aurelio",
    obra: "Meditaciones III, 10"
  },
  {
    texto:
      "En ninguna parte se retira uno con más calma que en su propia alma.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 3"
  },
  {
    texto:
      "El universo es cambio; la vida, opinión.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 3"
  },
  {
    texto:
      "Quita la opinión y desaparece el «me han dañado». Quita el «me han dañado» y desaparece el daño.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 7"
  },
  {
    texto:
      "No actúes como si fueras a vivir diez mil años. Mientras vivas, mientras puedas, sé bueno.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 17"
  },
  {
    texto:
      "Si buscas tranquilidad, haz menos. O mejor: haz lo necesario.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 24"
  },
  {
    texto:
      "Sé como el promontorio contra el que rompen las olas: él sigue firme y la espuma se calma a su alrededor.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 49"
  },
  {
    texto:
      "El alma se tiñe del color de sus pensamientos.",
    autor: "Marco Aurelio",
    obra: "Meditaciones V, 16"
  },
  {
    texto:
      "Que algo te resulte difícil no quiere decir que sea imposible para el hombre.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 19"
  },
  {
    texto:
      "Si alguien me muestra que pienso o actúo mal, cambiaré con gusto: busco la verdad, que nunca dañó a nadie.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 21"
  },
  {
    texto:
      "No te inquiete el futuro. Llegarás a él, si hace falta, con la misma razón que hoy usas para el presente.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 8"
  },
  {
    texto:
      "Cava dentro de ti. Dentro está la fuente del bien, y brotará siempre que caves.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 59"
  },
  {
    texto:
      "Vivir cada día como si fuera el último: sin agitación, sin apatía, sin fingir.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 69"
  },
  {
    texto:
      "Si te aflige algo de fuera, no es eso lo que te molesta, sino tu juicio sobre ello. Y eso puedes borrarlo ahora.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 47"
  },
  {
    texto:
      "Los hombres han nacido los unos para los otros: enséñales o sopórtalos.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 59"
  },
  {
    texto:
      "El que comete una injusticia se la hace a sí mismo.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IX, 4"
  },
  {
    texto:
      "A menudo es injusto el que no hace algo, no solo el que lo hace.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IX, 5"
  },
  {
    texto:
      "La amabilidad es invencible, si es sincera.",
    autor: "Marco Aurelio",
    obra: "Meditaciones XI, 18"
  },
  {
    texto:
      "Cada uno se quiere a sí mismo más que a los demás, y sin embargo valora menos su opinión que la ajena.",
    autor: "Marco Aurelio",
    obra: "Meditaciones XII, 4"
  },
  {
    texto:
      "Todo es ajeno, Lucilio; solo el tiempo es nuestro.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 1"
  },
  {
    texto:
      "No es pobre el que tiene poco, sino el que desea más.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 2"
  },
  {
    texto:
      "Estar en todas partes es no estar en ninguna.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 2"
  },
  {
    texto:
      "Largo es el camino de los preceptos; breve y eficaz, el de los ejemplos.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 6"
  },
  {
    texto:
      "Los hombres aprenden mientras enseñan.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 7"
  },
  {
    texto:
      "El verdadero gozo es cosa seria.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 23"
  },
  {
    texto:
      "Debes cambiar de ánimo, no de cielo.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 28"
  },
  {
    texto:
      "Hay que aprender mientras se ignore; es decir, mientras se viva.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 76"
  },
  {
    texto:
      "La vida es como una obra de teatro: no importa cuánto dura, sino qué tan bien se representa.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 77"
  },
  {
    texto:
      "Vivir, Lucilio, es hacer la guerra.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 96"
  },
  {
    texto:
      "Empieza a vivir ya, y cuenta cada día como una vida.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 101"
  },
  {
    texto:
      "Al que quiere, el destino lo guía; al que no quiere, lo arrastra.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 107"
  },
  {
    texto:
      "El mayor estorbo para vivir es la espera: depende del mañana y pierde el hoy.",
    autor: "Séneca",
    obra: "Sobre la brevedad de la vida, 9"
  },
  {
    texto:
      "El fuego prueba el oro; la desgracia, a los hombres fuertes.",
    autor: "Séneca",
    obra: "Sobre la providencia, 5"
  },
  {
    texto:
      "El mejor remedio de la ira es la demora.",
    autor: "Séneca",
    obra: "Sobre la ira II, 29"
  },
  {
    texto:
      "Culpar a otros de los propios males es de ignorante; culparse a uno mismo, de quien empieza a aprender; no culpar a nadie, de quien ya aprendió.",
    autor: "Epicteto",
    obra: "Enquiridión, 5"
  },
  {
    texto:
      "No pretendas que las cosas ocurran como quieres. Quiere que ocurran como ocurren, y te irá bien.",
    autor: "Epicteto",
    obra: "Enquiridión, 8"
  },
  {
    texto:
      "Ante cada cosa que te pase, pregúntate con qué facultad cuentas para hacerle frente.",
    autor: "Epicteto",
    obra: "Enquiridión, 10"
  },
  {
    texto:
      "Si quieres progresar, soporta parecer torpe en las cosas de fuera.",
    autor: "Epicteto",
    obra: "Enquiridión, 13"
  },
  {
    texto:
      "Eres actor de una obra. Representar bien el papel te toca a ti; elegirlo es de otro.",
    autor: "Epicteto",
    obra: "Enquiridión, 17"
  },
  {
    texto:
      "No te ofende el que te insulta, sino tu opinión de que eso es ofensa.",
    autor: "Epicteto",
    obra: "Enquiridión, 20"
  },
  {
    texto:
      "Si te cuentan que alguien habla mal de ti, responde: no conocía mis otros defectos, o no habría mencionado solo esos.",
    autor: "Epicteto",
    obra: "Enquiridión, 33"
  },
  {
    texto:
      "Toda cosa tiene dos asas: una por la que se puede llevar y otra por la que no.",
    autor: "Epicteto",
    obra: "Enquiridión, 43"
  },
  {
    texto:
      "No hables de principios: haz lo que de los principios se sigue.",
    autor: "Epicteto",
    obra: "Enquiridión, 46"
  },
  {
    texto:
      "¿Hasta cuándo vas a aplazar el considerarte digno de lo mejor?",
    autor: "Epicteto",
    obra: "Enquiridión, 51"
  },
  {
    texto:
      "Es imposible que alguien empiece a aprender lo que cree que ya sabe.",
    autor: "Epicteto",
    obra: "Disertaciones II, 17"
  },
  {
    texto:
      "Toda costumbre se conserva y crece con sus actos: la de caminar, caminando.",
    autor: "Epicteto",
    obra: "Disertaciones II, 18"
  },
  {
    texto:
      "Si haces algo bueno con esfuerzo, el esfuerzo pasa y lo bueno queda. Si haces algo vergonzoso con placer, el placer pasa y la vergüenza queda.",
    autor: "Musonio Rufo",
    obra: "Fragmento 51"
  },
  {
    texto:
      "Tenemos dos orejas y una boca para escuchar más y hablar menos.",
    autor: "Zenón de Citio",
    obra: "en Diógenes Laercio VII, 23"
  },
  {
    texto:
      "Tu tiempo tiene un límite. Si no lo usas para despejarte, se irá, y tú con él.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 4"
  },
  {
    texto:
      "Rara vez es desdichado alguien por no fijarse en el alma ajena; el que no sigue los movimientos de la suya lo es por fuerza.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 8"
  },
  {
    texto:
      "El tiempo de la vida humana es un punto; su sustancia, un fluir.",
    autor: "Marco Aurelio",
    obra: "Meditaciones II, 17"
  },
  {
    texto:
      "No gastes lo que te queda de vida pensando en los demás, salvo que sea por el bien común.",
    autor: "Marco Aurelio",
    obra: "Meditaciones III, 4"
  },
  {
    texto:
      "Nunca tengas por provechoso lo que te obligue a faltar a tu palabra o a perderte el respeto.",
    autor: "Marco Aurelio",
    obra: "Meditaciones III, 7"
  },
  {
    texto:
      "No hagas nada al azar, ni de otro modo que según las reglas del oficio.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 2"
  },
  {
    texto:
      "Cuánto tiempo gana el que no mira lo que dijo, hizo o pensó el vecino, sino solo lo que hace él.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 18"
  },
  {
    texto:
      "Breve es la vida. Aprovecha el presente con buen juicio y con justicia.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 26"
  },
  {
    texto:
      "El tiempo es un río de acontecimientos, de corriente impetuosa.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 43"
  },
  {
    texto:
      "Corre siempre por el camino corto; y el camino corto es el de la naturaleza.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IV, 51"
  },
  {
    texto:
      "¿En qué estoy empleando ahora mi alma? Pregúntatelo a cada paso.",
    autor: "Marco Aurelio",
    obra: "Meditaciones V, 11"
  },
  {
    texto:
      "Que te dé igual cumplir tu deber con frío o con calor, con sueño o bien dormido.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 2"
  },
  {
    texto:
      "Que tu gozo sea uno solo: pasar de una acción útil a otra acción útil.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 7"
  },
  {
    texto:
      "Vuelve en ti y despierta: lo que te turbaba eran sueños.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 31"
  },
  {
    texto:
      "El que ama la fama pone su bien en lo que hacen otros; el que ama el placer, en lo que siente; el que tiene juicio, en sus propios actos.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 51"
  },
  {
    texto:
      "Acostúmbrate a escuchar con atención lo que dice otro, y entra cuanto puedas en el alma del que habla.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VI, 53"
  },
  {
    texto:
      "No te avergüences de que te ayuden.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 7"
  },
  {
    texto:
      "Hagan o digan lo que quieran, yo debo ser bueno.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 15"
  },
  {
    texto:
      "¿Temes el cambio? ¿Y qué puede producirse sin cambio?",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 18"
  },
  {
    texto:
      "Borra la imaginación. Frena el impulso. Limítate al presente.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 29"
  },
  {
    texto:
      "El arte de vivir se parece más a la lucha que a la danza.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 61"
  },
  {
    texto:
      "Para vivir feliz hace falta muy poco.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 67"
  },
  {
    texto:
      "Es ridículo no huir de la propia maldad, que es posible, y querer huir de la ajena, que es imposible.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VII, 71"
  },
  {
    texto:
      "Cambiar de opinión y seguir a quien te corrige también es de hombre libre.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 16"
  },
  {
    texto:
      "Atiende a lo que tienes delante: sea una idea, un acto o una palabra.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 22"
  },
  {
    texto:
      "Ordena tu vida acto por acto.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 32"
  },
  {
    texto:
      "Recibe sin orgullo, suelta sin apego.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 33"
  },
  {
    texto:
      "No te abrume la imagen de la vida entera. Pregúntate solo qué tiene este momento de insoportable.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 36"
  },
  {
    texto:
      "¿El pepino está amargo? Tíralo. ¿Hay zarzas en el camino? Esquívalas. Con eso basta.",
    autor: "Marco Aurelio",
    obra: "Meditaciones VIII, 50"
  },
  {
    texto:
      "No esperes la República de Platón. Conténtate con avanzar un poco.",
    autor: "Marco Aurelio",
    obra: "Meditaciones IX, 29"
  },
  {
    texto:
      "¿A quién me nombras que le ponga precio al tiempo, que sepa lo que vale un día?",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 1"
  },
  {
    texto:
      "Tan malo es fiarse de todos como no fiarse de nadie.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 3"
  },
  {
    texto:
      "Nadie tiene una vida tranquila si piensa demasiado en alargarla.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 4"
  },
  {
    texto:
      "No me alegra aprender algo sino para enseñarlo.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 6"
  },
  {
    texto:
      "Retírate en ti mismo cuanto puedas.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 7"
  },
  {
    texto:
      "Cada día debe ordenarse como si cerrara la fila y completara la vida.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 12"
  },
  {
    texto:
      "Si vives según la naturaleza, nunca serás pobre; si vives según la opinión, nunca serás rico.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 16"
  },
  {
    texto:
      "Morimos cada día.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 24"
  },
  {
    texto:
      "Los que nos precedieron no son nuestros amos, sino nuestros guías.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 33"
  },
  {
    texto:
      "Trata a quien está por debajo de ti como querrías que te tratara quien está por encima.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 47"
  },
  {
    texto:
      "No es un bien vivir, sino vivir bien.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 70"
  },
  {
    texto:
      "Cada uno es tan desdichado como cree serlo.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 78"
  },
  {
    texto:
      "Midamos la vida por los actos, no por el tiempo.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 93"
  },
  {
    texto:
      "El que sufre antes de lo necesario sufre más de lo necesario.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 98"
  },
  {
    texto:
      "No aprendemos para la vida, sino para la escuela.",
    autor: "Séneca",
    obra: "Cartas a Lucilio, 106"
  },
  {
    texto:
      "Vivís como si fuerais a vivir siempre.",
    autor: "Séneca",
    obra: "Sobre la brevedad de la vida, 3"
  },
  {
    texto:
      "A vivir hay que aprender durante toda la vida.",
    autor: "Séneca",
    obra: "Sobre la brevedad de la vida, 7"
  },
  {
    texto:
      "Sin adversario, la virtud se marchita.",
    autor: "Séneca",
    obra: "Sobre la providencia, 2"
  },
  {
    texto:
      "Nadie me parece más desdichado que aquel a quien nunca le pasó nada adverso.",
    autor: "Séneca",
    obra: "Sobre la providencia, 3"
  },
  {
    texto:
      "Pregúntate cada noche: ¿qué mal curaste hoy?, ¿a qué vicio te resististe?, ¿en qué eres mejor?",
    autor: "Séneca",
    obra: "Sobre la ira III, 36"
  },
  {
    texto:
      "La enfermedad estorba al cuerpo, no a la voluntad.",
    autor: "Epicteto",
    obra: "Enquiridión, 9"
  },
  {
    texto:
      "De nada digas «lo perdí», sino «lo devolví».",
    autor: "Epicteto",
    obra: "Enquiridión, 11"
  },
  {
    texto:
      "Quien quiera ser libre, que no desee ni rehúya nada que dependa de otros.",
    autor: "Epicteto",
    obra: "Enquiridión, 14"
  },
  {
    texto:
      "Compórtate en la vida como en un banquete: toma con mesura lo que llega a ti y no retengas lo que pasa de largo.",
    autor: "Epicteto",
    obra: "Enquiridión, 15"
  },
  {
    texto:
      "Puedes ser invencible si no entras en ningún combate cuya victoria no dependa de ti.",
    autor: "Epicteto",
    obra: "Enquiridión, 19"
  },
  {
    texto:
      "Ten la muerte ante los ojos cada día, y no pensarás nada bajo ni desearás nada en exceso.",
    autor: "Epicteto",
    obra: "Enquiridión, 21"
  },
  {
    texto:
      "Si entregaran tu cuerpo al primero que pasa, te indignarías. ¿Y no te avergüenza entregar tu mente a cualquiera que te insulte?",
    autor: "Epicteto",
    obra: "Enquiridión, 28"
  },
  {
    texto:
      "Cuando hagas algo porque decidiste que hay que hacerlo, no evites que te vean haciéndolo.",
    autor: "Epicteto",
    obra: "Enquiridión, 35"
  },
  {
    texto:
      "Si asumes un papel superior a tus fuerzas, lo harás mal y abandonarás el que podías cumplir.",
    autor: "Epicteto",
    obra: "Enquiridión, 37"
  },
  {
    texto:
      "El que progresa no censura a nadie, no alaba a nadie, no culpa a nadie.",
    autor: "Epicteto",
    obra: "Enquiridión, 48"
  },
  {
    texto:
      "Mantente en lo que te propusiste como si fuera una ley.",
    autor: "Epicteto",
    obra: "Enquiridión, 50"
  },
  {
    texto:
      "Las dificultades muestran quién es cada uno.",
    autor: "Epicteto",
    obra: "Disertaciones I, 24"
  },
  {
    texto:
      "Los materiales son indiferentes; el uso que se hace de ellos, no.",
    autor: "Epicteto",
    obra: "Disertaciones II, 5"
  }
];

/** Una frase al azar, distinta de `anterior` cuando se puede. */
export function fraseAlAzar(anterior?: Frase): Frase {
  const candidatas = FRASES.filter((frase) => frase !== anterior);
  return candidatas[Math.floor(Math.random() * candidatas.length)] as Frase;
}

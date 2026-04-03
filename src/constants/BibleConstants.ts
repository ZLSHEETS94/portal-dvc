export const BIBLE_BOOKS = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute",
  "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias",
  "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Isaías", "Jeremias",
  "Lamentações", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Obadias", "Jonas",
  "Miqueias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias",
  "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios",
  "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses",
  "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro",
  "1 João", "2 João", "3 João", "Judas", "Apocalipse"
];

export const BIBLE_ABBREVIATIONS: Record<string, string> = {
  "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
  "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
  "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr",
  "Esdras": "ezr", "Neemias": "ne", "Ester": "est", "Jó": "job", "Salmos": "ps",
  "Provérbios": "pr", "Eclesiastes": "ec", "Cânticos": "ct", "Isaías": "is",
  "Jeremias": "jr", "Lamentações": "lm", "Ezequiel": "ez", "Daniel": "dn",
  "Oseias": "os", "Joel": "jl", "Amós": "am", "Obadias": "ob", "Jonas": "jon",
  "Miqueias": "mi", "Naum": "na", "Habacuque": "hab", "Sofonias": "zep",
  "Ageu": "hag", "Zacarias": "zec", "Malaquias": "mal", "Mateus": "mt",
  "Marcos": "mk", "Lucas": "lk", "João": "jn", "Atos": "act", "Romanos": "rm",
  "1 Coríntios": "1co", "2 Coríntios": "2co", "Gálatas": "gl", "Efésios": "eph",
  "Filipenses": "ph", "Colossenses": "col", "1 Tessalonicenses": "1th",
  "2 Tessalonicenses": "2th", "1 Timóteo": "1ti", "2 Timóteo": "2ti",
  "Tito": "tit", "Filemom": "phm", "Hebreus": "heb", "Tiago": "jas",
  "1 Pedro": "1pe", "2 Pedro": "2pe", "1 João": "1jn", "2 João": "2jn",
  "3 João": "3jn", "Judas": "jud", "Apocalipse": "rev"
};

export const formatBookForUrl = (book: string): string => {
  if (!book) return "";
  return book
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, ""); // Remove any other special characters
};

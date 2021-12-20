const api = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/";
const apiKey = Deno.env.get("SC_DICTIONARY_API_KEY");

type DictionaryResult = [
  {
    meta: Record<string, unknown>;
    shortdef: string[];
    fl: string;
    def: Record<string, unknown>;
  },
];

export async function getDefinition(word: string): Promise<string[]> {
  const result = await fetch(`${api}${word}?key=${apiKey}`);
  if (result.status >= 400) {
    throw new Error(`Error getting definition: ${result.statusText}`);
  }
  const data: DictionaryResult = await result.json();
  return data[0].shortdef;
}

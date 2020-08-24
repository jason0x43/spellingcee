const api = 'https://www.dictionaryapi.com/api/v3/references/collegiate/json/';
const apiKey = process.env.REACT_APP_DICTIONARY_API_KEY;

type DictionaryResult = [
  {
    meta: Record<string, unknown>;
    shortdef: string[];
    fl: string;
    def: Record<string, unknown>;
  }
];

export async function getDefinition(word: string): Promise<string[]> {
  const result = await fetch(`${api}${word}?key=${apiKey}`);
  const data: DictionaryResult = await result.json();
  return data[0].shortdef;
}

export function canGetDefinitions() {
  return apiKey != null;
}

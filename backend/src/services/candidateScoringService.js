// Isolated so a real AI call (e.g. reusing the Anthropic client from
// aiParserService.js) can replace the body later without touching the
// controller or frontend that call this function.
export async function calculateAIScore(_candidateId) {
  return { score: null, notes: "AI scoring not yet enabled" };
}

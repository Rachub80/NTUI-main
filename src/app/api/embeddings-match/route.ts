export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const body = await request.json();
    const query = body?.query?.trim();
    const candidates = Array.isArray(body?.candidates) ? body.candidates : [];

    if (!query || candidates.length === 0) {
      return Response.json(
        { error: "Expected query and candidates" },
        { status: 400 }
      );
    }

    const inputs = [query, ...candidates.map((item: { text: string }) => item.text)];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: inputs.map((text: string) => ({
          content: { parts: [{ text }] },
        })),
      }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    const vectors: number[][] =
      data?.embeddings?.map((item: { values: number[] }) => item.values) ?? [];
    if (vectors.length < 2) {
      return Response.json({ error: "No embeddings returned" }, { status: 500 });
    }

    const queryVec = vectors[0];
    const cosine = (a: number[], b: number[]) => {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    let bestId = candidates[0]?.id ?? null;
    let bestScore = -Infinity;
    const scores = candidates.map((item: { id: string }, index: number) => {
      const score = cosine(queryVec, vectors[index + 1]);
      if (score > bestScore) {
        bestScore = score;
        bestId = item.id;
      }
      return { id: item.id, score };
    });

    return Response.json({ bestId, scores });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

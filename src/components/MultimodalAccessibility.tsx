export const MultimodalAccessibility = () => {
  return (
    <section className="bg-black text-white py-[72px] sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            Bridge.AI Intent Engine
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Voice-to-Action pipeline
          </h2>
          <p className="mt-5 text-lg text-white/70">
            Bridge.AI focuses on the exact flow your code supports: normalize spoken
            commands, semantically match products, then launch a secure checkout.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "1. Normalize the Command",
              items: [
                "Input: Receive a spoken shopping transcript.",
                "Gemini 1.5 Flash: Clean and shorten the command.",
                "Output: A normalized intent string.",
              ],
            },
            {
              title: "2. Semantic Match",
              items: [
                "Embeddings: Batch-embed the query and candidates.",
                "Cosine scoring: Pick the closest match.",
                "Result: Best product ID with scores.",
              ],
            },
            {
              title: "3. Checkout Execution",
              items: [
                "Line items: Build a Stripe Checkout payload.",
                "Validation: Filter out invalid prices or quantities.",
                "Result: Return a secure checkout URL.",
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(93,44,168,0.25)]"
            >
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-violet-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b0f2c] via-black to-black p-8">
            <h3 className="text-2xl font-semibold">Bridge.AI Architecture</h3>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/80">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Layer</th>
                    <th className="px-4 py-3 font-semibold">Technology</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/70">
                  <tr>
                    <td className="px-4 py-3">Input</td>
                    <td className="px-4 py-3">Voice transcript</td>
                    <td className="px-4 py-3">Captured in the browser and sent to the API.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Logic</td>
                    <td className="px-4 py-3">Gemini 1.5 Flash + Embeddings</td>
                    <td className="px-4 py-3">Normalizes commands and scores matches.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Output</td>
                    <td className="px-4 py-3">Stripe Checkout</td>
                    <td className="px-4 py-3">Creates a secure checkout session URL.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Bridge.AI Command Status</h3>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Processing
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Heard</p>
                <p className="mt-2 text-lg font-medium">
                  “Add to cart the STADIUM MESH PANTS.”
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Normalized</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/10 px-3 py-1">add to cart stadium mesh pants</span>
                </div>
              </div>
              <div className="rounded-2xl border border-violet-400/40 bg-violet-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Next Step</p>
                <p className="mt-2 text-base text-white/80">
                  Creating a Stripe Checkout session for the matched item.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Bridge.AI confirms the command, shows the normalized text, and prepares checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

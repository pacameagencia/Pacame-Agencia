/**
 * Test de integracion Gemma 4 e2b — VPS Hostinger KVM2.
 * Ejecutar: npx tsx --env-file=.env.local scripts/test-gemma.ts
 */

import { gemmaChat, gemmaClassify, gemmaHealth } from "../lib/gemma";

async function main() {
  console.log("=== PACAME Gemma 4 integration test ===\n");

  // 1. Health check
  console.log("[1/3] Health check");
  const health = await gemmaHealth();
  console.log(JSON.stringify(health, null, 2));
  if (!health.ok) {
    console.error("Health KO, aborting.");
    process.exit(1);
  }

  // 2. Chat real (SEO keywords)
  console.log("\n[2/3] gemmaChat — SEO keywords ATLAS");
  const chat = await gemmaChat(
    [
      { role: "system", content: "Eres ATLAS, experto SEO de PACAME. Tono directo." },
      {
        role: "user",
        content:
          "Dame 5 keywords long-tail para pasteleria artesanal en Valencia. Solo la lista.",
      },
    ],
    { maxTokens: 200, temperature: 0.6 }
  );
  console.log("content:", chat.content);
  console.log(
    `latency=${chat.latencyMs}ms tokensIn=${chat.tokensIn} tokensOut=${chat.tokensOut} tok/s=${chat.tokensPerSec}`
  );

  // 3. Clasificacion
  console.log("\n[3/3] gemmaClassify — email routing");
  const tag = await gemmaClassify(
    "Necesito una factura rectificativa del mes pasado",
    ["fiscal", "legal", "ventas", "soporte"]
  );
  console.log("categoria:", tag);

  console.log("\n=== OK ===");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});

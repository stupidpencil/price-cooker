/* Fonctions serveur uniquement pour la gestion de la configuration
 * Ce fichier ne doit jamais être importé côté client
 */

import type { ScoringConfig } from "./config-loader";

// Côté serveur uniquement
export async function saveConfig(config: ScoringConfig): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("saveConfig can only be called server-side");
  }
  
  const { promises: fs } = await import("fs");
  const path = await import("path");
  const configPath = path.join(process.cwd(), "src/config/scoring-config.json");
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  
  // Mettre à jour le cache global pour que getConfig() retourne la nouvelle valeur
  if (typeof global !== "undefined") {
    global.__riceCookerConfigCache = config;
  }
}

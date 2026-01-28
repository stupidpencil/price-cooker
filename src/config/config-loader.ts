import scoringConfig from "./scoring-config.json";

export type ScoringConfig = typeof scoringConfig;

// Cache partagé via variable globale pour permettre la mise à jour depuis config-server.ts
declare global {
  var __riceCookerConfigCache: ScoringConfig | undefined;
}

let cachedConfig: ScoringConfig | null = null;

// Côté serveur uniquement
export async function loadConfig(): Promise<ScoringConfig> {
  // Vérifier d'abord le cache global (mis à jour par saveConfig)
  if (typeof global !== "undefined" && global.__riceCookerConfigCache) {
    cachedConfig = global.__riceCookerConfigCache;
    return cachedConfig;
  }
  
  if (cachedConfig) {
    return cachedConfig;
  }

  // En production, on pourrait charger depuis une DB
  // Pour l'instant, on utilise le JSON importé
  cachedConfig = scoringConfig;
  return cachedConfig;
}

// Note: saveConfig a été déplacé dans config-server.ts pour éviter les problèmes de bundling client

// Utilisable côté client et serveur
export function getConfig(): ScoringConfig {
  // Vérifier d'abord le cache global (mis à jour par saveConfig)
  if (typeof global !== "undefined" && global.__riceCookerConfigCache) {
    cachedConfig = global.__riceCookerConfigCache;
    return cachedConfig;
  }
  
  if (cachedConfig) {
    return cachedConfig;
  }
  cachedConfig = scoringConfig;
  return cachedConfig;
}

// Fonction pour forcer le rechargement (utile après saveConfig)
export function clearConfigCache(): void {
  cachedConfig = null;
  if (typeof global !== "undefined") {
    global.__riceCookerConfigCache = undefined;
  }
}

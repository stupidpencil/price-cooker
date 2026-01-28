/* Moteur de calcul de score PRICE (P/R/I/C/E) "sans K"
 * Formule : PRICE = round(100 * (P * R * I * C) / E) puis clamp 0-100
 */

import { getConfig } from "@/config/config-loader";
import type { ScoringConfig } from "@/config/config-loader";
import { getMaxScores } from "@/scoring/max-scores";

type ProblemClarity = "clear_problem" | "solution_first" | "";
type ProblemApproach = "conviction_only" | "informal_discussions" | "structured_interviews" | "";
type InterviewDepth = "listened_only" | "dug_deeper" | "";
type AlternativeSolution = "all_can_solve" | "some_cannot" | "no_alternative" | "dont_know_alt" | "";
type ValueExpectation = "ux_better" | "time_saved" | "new_capability" | "game_changer" | "dont_know_value" | "";
type PersonaConfidence = "assumed" | "met" | "interviewed" | "clients" | "";
type PersonaImpactEvidence =
  | "heard_people_say"
  | "interviews_with_persona"
  | "design_phase"
  | "tested_myself"
  | "persona_certified_solution"
  | "persona_certified_payment";
type PersonaCountMet = "1_seul" | "2_5" | "5_10" | "plus_10" | "";
type FunctionalBrick =
  | "web_app_simple"
  | "user_accounts"
  | "multi_org"
  | "search_simple"
  | "search_advanced"
  | "calc_simple"
  | "calc_complex"
  | "geoloc_simple"
  | "matching"
  | "export_data"
  | "notifications"
  | "streaming"
  | "file_upload"
  | "security_enhanced"
  | "rgpd_advanced"
  | "scalability";
type EffortConfidence = "very_uncertain" | "rather_uncertain" | "rather_sure" | "very_sure" | "";

type Persona = {
  name: string;
  confidence: PersonaConfidence;
};

type PersonaImpactData = {
  impactSlider: number; // 0-100
  evidence: PersonaImpactEvidence[];
  countMet: PersonaCountMet;
};

type EffortScope = "mvp" | "v1" | "vision_complete" | "";

type FormData = {
  problemClarity: ProblemClarity;
  problemApproach: ProblemApproach;
  interviewDepth: InterviewDepth;
  valueExpectations: ValueExpectation;
  alternativeSolutions: AlternativeSolution;
  personas: Persona[];
  personaImpacts: Record<number, PersonaImpactData>;
  selectedBricks: FunctionalBrick[];
  budgetMin: number;
  budgetMax: number;
  timeMin: number;
  timeMax: number;
  effortConfidence: EffortConfidence;
  noEffortEstimate: boolean;
  effortScope: EffortScope;
};

type PriceResult = {
  scoreTotal: number; // 0..100 (avec 1 décimale)
  band: "high_risk" | "medium_risk" | "low_risk";
  subscores: {
    P: number;
    R: number;
    I: number;
    C: number;
    E: number;
  };
  drivers: Array<{ key: "P" | "R" | "I" | "C" | "E"; label: string; severity: number }>;
  recommendations: string[];
};

// Helpers
function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// 1) P — Problem
function computeP(data: FormData, config: ScoringConfig, maxScores: { P: number }): number {
  const cfg = config.problem;
  
  // Clarity
  const clarity = (cfg.clarity as Record<string, number>)[data.problemClarity];
  if (clarity === undefined) {
    throw new Error(`Valeur inconnue pour problemClarity: ${data.problemClarity}`);
  }

  // Approach
  const approach = (cfg.approach as Record<string, number>)[data.problemApproach];
  if (approach === undefined) {
    throw new Error(`Valeur inconnue pour problemApproach: ${data.problemApproach}`);
  }

  // Depth (uniquement si structured_interviews)
  let depth = 1.0; // neutral par défaut si pas d'interviews structurées
  if (data.problemApproach === "structured_interviews") {
    const depthValue = (cfg.depth as Record<string, number>)[data.interviewDepth];
    if (depthValue !== undefined) {
      depth = depthValue;
    }
  }

  // Alternatives
  const alt = (cfg.alternatives as Record<string, number>)[data.alternativeSolutions];
  if (alt === undefined) {
    throw new Error(`Valeur inconnue pour alternativeSolutions: ${data.alternativeSolutions}`);
  }

  const P = cfg.weights.clarity * clarity + cfg.weights.approach * approach + cfg.weights.depth * depth + cfg.weights.alternatives * alt;
  return clamp(P, config.bounds.P.min, maxScores.P);
}

// 2) R — Reach
function computeR(data: FormData, config: ScoringConfig, maxScores: { R: number }): number {
  const cfg = config.reach;
  const filledPersonas = data.personas.filter((p) => p.name.trim());
  const n = filledPersonas.length;

  // nFactor
  let nFactor = cfg.nFactor["0"];
  if (n === 1) nFactor = cfg.nFactor["1"];
  else if (n === 2) nFactor = cfg.nFactor["2"];
  else if (n === 3) nFactor = cfg.nFactor["3"];
  else if (n >= 4) nFactor = cfg.nFactor["4+"];

  // Credibility mapping
  const credMap = cfg.credibility as Record<string, number>;

  if (n === 0) {
    // Si aucune persona, on retourne le minimum
    return config.bounds.R.min;
  }

  const credibilities = filledPersonas.map((p) => {
    const cred = credMap[p.confidence];
    if (cred === undefined) {
      throw new Error(`Valeur inconnue pour confidence: ${p.confidence}`);
    }
    return cred;
  });
  const credAvg = avg(credibilities);
  return clamp(credAvg * nFactor, config.bounds.R.min, maxScores.R);
}

// 3) I — Impact
function computeI(data: FormData, config: ScoringConfig, maxScores: { I: number }): number {
  const cfg = config.impact;
  const reachCfg = config.reach;
  
  // Value factor
  const valueFactor = (cfg.valueExpectations as Record<string, number>)[data.valueExpectations];
  if (valueFactor === undefined) {
    throw new Error(`Valeur inconnue pour valueExpectations: ${data.valueExpectations}`);
  }

  // Credibility mapping (réutilisé de R)
  const credMap = reachCfg.credibility as Record<string, number>;

  const filledPersonas = data.personas.filter((p) => p.name.trim());
  if (filledPersonas.length === 0) {
    return clamp(cfg.weights.impactWeighted * 0.5 + cfg.weights.valueFactor * valueFactor, config.bounds.I.min, maxScores.I);
  }

  const impactWeighted: number[] = [];
  filledPersonas.forEach((p, index) => {
    const impactData = data.personaImpacts[index];
    const impactNorm = impactData ? impactData.impactSlider / 100 : 0.5;
    const personaCred = credMap[p.confidence];
    if (personaCred === undefined) {
      throw new Error(`Valeur inconnue pour confidence: ${p.confidence}`);
    }
    impactWeighted.push(impactNorm * personaCred);
  });

  const impactWeightedAvg = avg(impactWeighted);
  return clamp(cfg.weights.impactWeighted * impactWeightedAvg + cfg.weights.valueFactor * valueFactor, config.bounds.I.min, maxScores.I);
}

// 4) C — Confidence
function computeC(data: FormData, config: ScoringConfig, maxScores: { C: number }): number {
  const cfg = config.confidence;
  
  // Evidence weights
  const evidenceWeights = cfg.evidenceWeights as Record<string, number>;

  // Count factor
  const countMap = cfg.countMet as Record<string, number>;

  const filledPersonas = data.personas.filter((p) => p.name.trim());
  if (filledPersonas.length === 0) {
    return config.bounds.C.min;
  }

  const cPersonas: number[] = [];
  filledPersonas.forEach((_, index) => {
    const impactData = data.personaImpacts[index];
    if (!impactData) {
      cPersonas.push(config.bounds.C.min);
      return;
    }

    let evidenceScore = 0;
    impactData.evidence.forEach((ev) => {
      evidenceScore += evidenceWeights[ev] ?? 0;
    });
    evidenceScore = clamp(evidenceScore, 0, 1);

    // Gérer le cas où countMet est vide ou non défini
    const countMetValue = impactData.countMet || "default";
    const countFactor = countMap[countMetValue];
    if (countFactor === undefined) {
      // Si même "default" n'existe pas, utiliser une valeur par défaut sécurisée
      const defaultCountFactor = countMap["default"] ?? 0.8;
      console.warn(`Valeur countMet inconnue ou vide: "${impactData.countMet}", utilisation de la valeur par défaut: ${defaultCountFactor}`);
      cPersonas.push(evidenceScore * defaultCountFactor);
    } else {
      cPersonas.push(evidenceScore * countFactor);
    }
  });

  let C = avg(cPersonas);

  // Bonus qualité discovery
  if (
    data.problemApproach === "structured_interviews" &&
    data.interviewDepth === "dug_deeper"
  ) {
    C += cfg.discoveryBonus;
  }

  return clamp(C, config.bounds.C.min, maxScores.C);
}

// 5) E — Effort penalty
function computeE(data: FormData, config: ScoringConfig, maxScores: { E_max: number }): number {
  const cfg = config.effort;
  
  if (data.noEffortEstimate) {
    return cfg.noEstimatePenalty;
  }

  // Budget factor
  const budgetMid = (data.budgetMin + data.budgetMax) / 2;
  const budgetFactors = cfg.budgetFactor as Record<string, number>;
  let budgetFactor = budgetFactors["<10"];
  if (budgetMid >= 80) budgetFactor = budgetFactors["80+"];
  else if (budgetMid >= 40) budgetFactor = budgetFactors["40-80"];
  else if (budgetMid >= 20) budgetFactor = budgetFactors["20-40"];
  else if (budgetMid >= 10) budgetFactor = budgetFactors["10-20"];

  // Time addon
  const timeMid = (data.timeMin + data.timeMax) / 2;
  const timeAddons = cfg.timeAddon as Record<string, number>;
  let timeAddon = timeAddons["<15"];
  if (timeMid > 120) timeAddon = timeAddons["120+"];
  else if (timeMid > 60) timeAddon = timeAddons["60-120"];
  else if (timeMid > 30) timeAddon = timeAddons["30-60"];
  else if (timeMid > 15) timeAddon = timeAddons["15-30"];

  // Brick complexity
  const brickCoeffs = cfg.brickCoeffs as Record<string, number>;
  let sumCoeffs = 0;
  data.selectedBricks.forEach((brick) => {
    sumCoeffs += brickCoeffs[brick] ?? 0;
  });
  const brickComplexity = 1 + Math.min(cfg.brickComplexityMax, sumCoeffs / cfg.brickComplexityDivisor);

  // Confidence multiplier
  const confidenceMults = cfg.confidenceMult as Record<string, number>;
  const confidenceMult = confidenceMults[data.effortConfidence];
  if (confidenceMult === undefined) {
    throw new Error(`Valeur inconnue pour effortConfidence: ${data.effortConfidence}`);
  }

  let E = (budgetFactor + timeAddon) * brickComplexity * confidenceMult;
  
  // Multiplicateur selon le périmètre (MVP/V1/Vision complète)
  const scopeMultipliers: Record<EffortScope, number> = {
    mvp: 0.7,
    v1: 1.0,
    vision_complete: 1.3,
    "": 1.0,
  };
  const scopeMultiplier = scopeMultipliers[data.effortScope || ""] || 1.0;
  E = E * scopeMultiplier;
  
  return clamp(E, config.bounds.E.min, maxScores.E_max);
}

// Drivers (top 3 pénalités)
function computeDrivers(
  subscores: { P: number; R: number; I: number; C: number; E: number },
  config: ScoringConfig,
  maxScores: { E_max: number },
) {
  const penalties = [
    { key: "P" as const, label: "Problème mal défini", severity: 1 - subscores.P },
    { key: "R" as const, label: "Reach faible ou incertain", severity: 1 - subscores.R },
    { key: "I" as const, label: "Impact peu clair", severity: 1 - subscores.I },
    { key: "C" as const, label: "Confiance faible (peu de preuves)", severity: 1 - subscores.C },
    {
      key: "E" as const,
      label: "Effort élevé ou incertain",
      severity: (() => {
        const range = maxScores.E_max - config.bounds.E.min;
        return range > 0 ? (subscores.E - config.bounds.E.min) / range : 0;
      })(),
    },
  ];

  return penalties
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .filter((p) => p.severity > 0.1);
}

// Recommendations
function computeRecommendations(
  data: FormData,
  subscores: { P: number; R: number; I: number; C: number; E: number },
): string[] {
  const recs: string[] = [];

  if (subscores.P < 0.6) {
    recs.push("Clarifier et reformuler le problème, puis le tester en entretien.");
  }
  if (subscores.R < 0.6) {
    recs.push("Rendre les personas plus concrets et valider qu'ils sont réellement concernés.");
  }
  if (subscores.I < 0.6) {
    recs.push("Clarifier l'impact attendu et prioriser le cas d'usage le plus fort.");
  }
  if (subscores.C < 0.55) {
    recs.push("Accumuler des preuves : 5–10 entretiens + 1 test rapide.");
  }
  if (subscores.E > 1.6 && subscores.C < 0.6) {
    recs.push("Réduire le périmètre (MVP) avant d'investir davantage.");
  }
  if (data.alternativeSolutions === "all_can_solve") {
    recs.push("Analyser les alternatives existantes et votre différenciation.");
  }

  // Fallback générique si moins de 3
  if (recs.length < 3) {
    recs.push("Structurer un MVP minimal pour tester votre hypothèse principale.");
    recs.push("Planifier des entretiens structurés avec au moins 5 utilisateurs cibles.");
    recs.push("Affiner l'estimation d'effort avec un pro avant de lancer le développement.");
  }

  return recs.slice(0, 6);
}

// Fonction principale
export function computePriceScore(data: FormData): PriceResult {
  const config = getConfig();
  let maxScores;
  try {
    maxScores = getMaxScores(); // Calculer une seule fois les max théoriques
  } catch (error) {
    console.error("[computePriceScore] Erreur dans getMaxScores():", error);
    throw new Error(`Erreur lors du calcul des scores maximums: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const P = computeP(data, config, maxScores);
  const R = computeR(data, config, maxScores);
  const I = computeI(data, config, maxScores);
  const C = computeC(data, config, maxScores);
  const E = computeE(data, config, maxScores);

  const subscores = { P, R, I, C, E };

  // Formule hybride optimisée pour une meilleure distribution :
  // 1. Combinaison moyenne arithmétique (70%) + géométrique (30%) pour équilibrer lissage et différenciation
  // 2. Transformation non-linéaire modérée (puissance 1.15) pour amplifier légèrement les écarts
  // 3. Pénalité E modérée (30%) pour créer de l'écart sans trop compresser
  
  // Pondérations
  const wP = 0.25;
  const wR = 0.25;
  const wI = 0.25;
  const wC = 0.25;
  
  // Moyenne arithmétique pondérée
  const arithmeticMean = wP * P + wR * R + wI * I + wC * C;
  
  // Moyenne géométrique pondérée (avec protection epsilon)
  const epsilon = 0.01;
  const P_safe = Math.max(P, epsilon);
  const R_safe = Math.max(R, epsilon);
  const I_safe = Math.max(I, epsilon);
  const C_safe = Math.max(C, epsilon);
  
  const geometricMean = Math.exp(
    wP * Math.log(P_safe) + 
    wR * Math.log(R_safe) + 
    wI * Math.log(I_safe) + 
    wC * Math.log(C_safe)
  );
  
  // Combinaison hybride : 70% arithmétique + 30% géométrique
  // Cela donne plus de poids à la moyenne arithmétique (moins punitive) tout en gardant l'effet différenciateur
  const hybridMean = 0.7 * arithmeticMean + 0.3 * geometricMean;
  
  // Transformation non-linéaire modérée (puissance 1.15 au lieu de 1.3)
  // Moins de compression, meilleure distribution
  const power = 1.15;
  const positiveScore = Math.pow(hybridMean, power);
  
  // Normalisation de E en pénalité (utiliser les max théoriques calculés dynamiquement)
  const E_min = config.bounds.E.min;
  const E_max = maxScores.E_max;
  const E_range = E_max - E_min;
  const E_normalized = E_range > 0 ? (E - E_min) / E_range : 0; // 0..1
  
  // Pénalité E modérée : 30% au lieu de 45% pour moins compresser
  // Au maximum (E=2), on réduit le score de 30%
  const E_penalty = 0.30 * E_normalized; // 0..0.30
  
  // Score final : combinaison hybride transformée × (1 - pénalité E)
  // Normalisation : référence = projet excellent (P=R=I=C=1.0) → 100%
  const referenceHybridMean = 0.7 * 1.0 + 0.3 * 1.0; // = 1.0
  const referenceScore = Math.pow(referenceHybridMean, power); // = 1.0^1.15 = 1.0
  
  // Normalisation : on veut qu'un projet excellent (P=R=I=C=1.0, E minimal) donne ~100%
  // Cela permet aux projets exceptionnels (valeurs > 1.0) de dépasser 100% (clampé à 100)
  const targetScoreForExcellent = 100;
  const normalizationFactor = referenceScore > 0 ? targetScoreForExcellent / referenceScore : targetScoreForExcellent;
  
  const rawScore = positiveScore * (1 - E_penalty) * normalizationFactor;
  
  // Arrondi à 1 décimale au lieu d'un entier pour plus de granularité
  const scoreTotal = clamp(Math.round(rawScore * 10) / 10, 0, 100);

  // Banding (comparaison avec 1 décimale)
  let band: "high_risk" | "medium_risk" | "low_risk";
  if (scoreTotal <= config.banding.high_risk.max) band = "high_risk";
  else if (scoreTotal <= config.banding.medium_risk.max) band = "medium_risk";
  else band = "low_risk";

  const drivers = computeDrivers(subscores, config, maxScores);
  const recommendations = computeRecommendations(data, subscores);

  return {
    scoreTotal,
    band,
    subscores,
    drivers,
    recommendations,
  };
}

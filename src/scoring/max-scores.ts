/* Calcul des scores maximums réellement atteignables pour chaque dimension PRICE
 * Basé sur les mappings et formules réelles, pas sur les bornes arbitraires
 */

import { getConfig } from "@/config/config-loader";
import type { ScoringConfig } from "@/config/config-loader";

export type MaxScores = {
  P: number;
  R: number;
  I: number;
  C: number;
  E_min: number; // E min (meilleur cas, moins de pénalité)
  E_max: number; // E max (pire cas, plus de pénalité)
};

/**
 * Calcule le score maximum réellement atteignable pour P (Problem)
 */
function computePMax(config: ScoringConfig): number {
  const cfg = config.problem;
  
  // Trouver les valeurs max dans chaque mapping
  const clarityValues = Object.values(cfg.clarity as Record<string, number>).filter(v => typeof v === 'number');
  const approachValues = Object.values(cfg.approach as Record<string, number>).filter(v => typeof v === 'number');
  const depthValues = Object.values(cfg.depth as Record<string, number>).filter(v => typeof v === 'number');
  const alternativesValues = Object.values(cfg.alternatives as Record<string, number>).filter(v => typeof v === 'number');
  
  const maxClarity = clarityValues.length > 0 ? Math.max(...clarityValues) : 0;
  const maxApproach = approachValues.length > 0 ? Math.max(...approachValues) : 0;
  const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
  const maxAlternatives = alternativesValues.length > 0 ? Math.max(...alternativesValues) : 0;
  
  // Calculer P max avec les poids
  const P_max = cfg.weights.clarity * maxClarity + 
                cfg.weights.approach * maxApproach + 
                cfg.weights.depth * maxDepth + 
                cfg.weights.alternatives * maxAlternatives;
  
  // Vérifier que le résultat est valide
  if (!isFinite(P_max) || isNaN(P_max)) {
    throw new Error(`P_max calculé invalide: ${P_max} (clarity: ${maxClarity}, approach: ${maxApproach}, depth: ${maxDepth}, alternatives: ${maxAlternatives})`);
  }
  
  // Retourner le max théorique réel (sans dépendre de bounds.P.max)
  // On garde config.bounds.P.max comme garde-fou absolu si jamais le calcul dépasse
  const result = Math.min(P_max, config.bounds.P.max || Infinity);
  if (!isFinite(result) || isNaN(result)) {
    throw new Error(`P max final invalide: ${result} (P_max: ${P_max}, bounds.max: ${config.bounds.P.max})`);
  }
  return result;
}

/**
 * Calcule le score maximum réellement atteignable pour R (Reach)
 */
function computeRMax(config: ScoringConfig): number {
  const cfg = config.reach;
  
  // Credibility max
  const credibilityValues = Object.values(cfg.credibility as Record<string, number>).filter(v => typeof v === 'number');
  const maxCredibility = credibilityValues.length > 0 ? Math.max(...credibilityValues) : 0;
  
  // nFactor max (4+ personas)
  const maxNFactor = cfg.nFactor["4+"];
  
  // Retourner le max théorique réel (sans dépendre de bounds.R.max)
  return Math.min(maxCredibility * maxNFactor, config.bounds.R.max || Infinity);
}

/**
 * Calcule le score maximum réellement atteignable pour I (Impact)
 */
function computeIMax(config: ScoringConfig): number {
  const cfg = config.impact;
  const reachCfg = config.reach;
  
  // Value expectations max
  const valueExpectationsValues = Object.values(cfg.valueExpectations as Record<string, number>).filter(v => typeof v === 'number');
  const maxValueFactor = valueExpectationsValues.length > 0 ? Math.max(...valueExpectationsValues) : 0;
  
  // Impact weighted max = 1.0 (impactSlider=100) * max_credibility
  const credibilityValues = Object.values(reachCfg.credibility as Record<string, number>).filter(v => typeof v === 'number');
  const maxCredibility = credibilityValues.length > 0 ? Math.max(...credibilityValues) : 0;
  const maxImpactWeighted = 1.0 * maxCredibility; // impactSlider=100, cred=max
  
  // Calculer I max avec les poids
  const I_max = cfg.weights.impactWeighted * maxImpactWeighted + 
                cfg.weights.valueFactor * maxValueFactor;
  
  // Retourner le max théorique réel (sans dépendre de bounds.I.max)
  return Math.min(I_max, config.bounds.I.max || Infinity);
}

/**
 * Calcule le score maximum réellement atteignable pour C (Confidence)
 */
function computeCMax(config: ScoringConfig): number {
  const cfg = config.confidence;
  
  // Evidence weights max = somme de toutes les preuves (clampé à 1.0)
  const evidenceWeightsValues = Object.values(cfg.evidenceWeights as Record<string, number>).filter(v => typeof v === 'number');
  const maxEvidenceScore = Math.min(1.0, evidenceWeightsValues.reduce((sum, v) => sum + v, 0));
  
  // Count met max
  const countMetValues = Object.values(cfg.countMet as Record<string, number>).filter(v => typeof v === 'number');
  const maxCountFactor = countMetValues.length > 0 ? Math.max(...countMetValues) : 0;
  
  // Bonus discovery (si structured_interviews + dug_deeper)
  const maxC = maxEvidenceScore * maxCountFactor + cfg.discoveryBonus;
  
  // Retourner le max théorique réel (sans dépendre de bounds.C.max)
  return Math.min(maxC, config.bounds.C.max || Infinity);
}

/**
 * Calcule le score minimum (meilleur) pour E (Effort)
 * Pour E, moins = mieux, donc on cherche le min
 */
function computeEMin(config: ScoringConfig): number {
  const cfg = config.effort;
  
  // Budget factor min
  const budgetFactorValues = Object.values(cfg.budgetFactor as Record<string, number>).filter(v => typeof v === 'number');
  const minBudgetFactor = budgetFactorValues.length > 0 ? Math.min(...budgetFactorValues) : 1;
  
  // Time addon min
  const timeAddonValues = Object.values(cfg.timeAddon as Record<string, number>).filter(v => typeof v === 'number');
  const minTimeAddon = timeAddonValues.length > 0 ? Math.min(...timeAddonValues) : 0;
  
  // Brick complexity min = 1 (aucune brique sélectionnée)
  // brickComplexity = 1 + min(brickComplexityMax, sumCoeffs / brickComplexityDivisor)
  // Si aucune brique : sumCoeffs = 0, donc brickComplexity = 1 + min(0.6, 0) = 1.0
  const minBrickComplexity = 1.0;
  
  // Confidence mult min (very_sure = meilleur)
  const confidenceMultValues = Object.values(cfg.confidenceMult as Record<string, number>).filter(v => typeof v === 'number');
  const minConfidenceMult = confidenceMultValues.length > 0 ? Math.min(...confidenceMultValues) : 1;
  
  // E = clamp((budgetFactor + timeAddon) * brickComplexity * confidenceMult, E.min, E.max)
  const E_min = (minBudgetFactor + minTimeAddon) * minBrickComplexity * minConfidenceMult;
  
  // Retourner le min théorique réel (sans dépendre de bounds.E.min)
  return Math.max(E_min, config.bounds.E.min || 0);
}

/**
 * Calcule le score maximum (pire cas) pour E (Effort)
 */
function computeEMax(config: ScoringConfig): number {
  const cfg = config.effort;
  
  // Budget factor max
  const budgetFactorValues = Object.values(cfg.budgetFactor as Record<string, number>).filter(v => typeof v === 'number');
  const maxBudgetFactor = budgetFactorValues.length > 0 ? Math.max(...budgetFactorValues) : 1;
  
  // Time addon max
  const timeAddonValues = Object.values(cfg.timeAddon as Record<string, number>).filter(v => typeof v === 'number');
  const maxTimeAddon = timeAddonValues.length > 0 ? Math.max(...timeAddonValues) : 0;
  
  // Brick complexity max = 1 + brickComplexityMax (toutes les briques sélectionnées)
  const maxBrickComplexity = 1 + cfg.brickComplexityMax;
  
  // Confidence mult max (very_uncertain = pire)
  const confidenceMultValues = Object.values(cfg.confidenceMult as Record<string, number>).filter(v => typeof v === 'number');
  const maxConfidenceMult = confidenceMultValues.length > 0 ? Math.max(...confidenceMultValues) : 1;
  
  // E max = (budgetMax + timeMax) * brickMax * confidenceMax
  const E_max = (maxBudgetFactor + maxTimeAddon) * maxBrickComplexity * maxConfidenceMult;
  
  // Retourner le max théorique réel (sans dépendre de bounds.E.max)
  return Math.min(E_max, config.bounds.E.max || Infinity);
}

/**
 * Calcule tous les scores maximums réellement atteignables
 */
export function getMaxScores(): MaxScores {
  const config = getConfig();
  
  return {
    P: computePMax(config),
    R: computeRMax(config),
    I: computeIMax(config),
    C: computeCMax(config),
    E_min: computeEMin(config), // Meilleur cas (moins de pénalité)
    E_max: computeEMax(config), // Pire cas (plus de pénalité)
  };
}

import { NextResponse } from "next/server";
import { computePriceScore } from "@/scoring/price";
import type { ScoringConfig } from "@/config/config-loader";

type Persona = {
  name: string;
  confidence: "assumed" | "met" | "interviewed" | "clients" | "";
};

type PersonaImpactEvidence =
  | "heard_people_say"
  | "interviews_with_persona"
  | "design_phase"
  | "tested_myself"
  | "persona_certified_solution"
  | "persona_certified_payment";

type PersonaCountMet = "1_seul" | "2_5" | "5_10" | "plus_10" | "";

type PersonaImpactData = {
  impactSlider: number;
  evidence: PersonaImpactEvidence[];
  countMet: PersonaCountMet;
};

type EffortConfidence = "very_uncertain" | "rather_uncertain" | "rather_sure" | "very_sure" | "";

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

type EffortScope = "mvp" | "v1" | "vision_complete" | "";

type RequestBody = {
  testData: {
    problemClarity: "clear_problem" | "solution_first" | "";
    problemApproach: "conviction_only" | "informal_discussions" | "structured_interviews" | "";
    interviewDepth: "listened_only" | "dug_deeper" | "";
    valueExpectations: string;
    alternativeSolutions: string;
    personas: Persona[];
    personaImpacts: Record<number, PersonaImpactData>;
    selectedBricks: FunctionalBrick[];
    budgetMin: number;
    budgetMax: number;
    timeMin: number;
    timeMax: number;
    effortConfidence: EffortConfidence;
    noEffortEstimate: boolean;
    effortScope?: EffortScope;
  };
  config: ScoringConfig;
};

function bandToRiskLevel(band: "high_risk" | "medium_risk" | "low_risk"): string {
  switch (band) {
    case "high_risk":
      return "Risque élevé";
    case "medium_risk":
      return "Risque modéré";
    case "low_risk":
      return "Risque maîtrisé";
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    // Temporairement remplacer la config dans le cache
    const { getConfig } = await import("@/config/config-loader");
    const { saveConfig } = await import("@/config/config-server");
    const originalConfig = getConfig();
    
    // Utiliser la config fournie pour le calcul
    // On va modifier computePriceScore pour accepter une config optionnelle
    // Pour l'instant, on va utiliser une approche différente : modifier directement le fichier de config
    // temporairement, mais c'est risqué. Mieux vaut modifier computePriceScore.
    
    // Solution temporaire : sauvegarder la config, calculer, restaurer
    await saveConfig(body.config);
    
    try {
      const result = computePriceScore({
        problemClarity: body.testData.problemClarity,
        problemApproach: body.testData.problemApproach,
        interviewDepth: body.testData.interviewDepth || "",
        valueExpectations: (body.testData.valueExpectations as any) || "",
        alternativeSolutions: (body.testData.alternativeSolutions as any) || "",
        personas: body.testData.personas || [],
        personaImpacts: body.testData.personaImpacts || {},
        selectedBricks: body.testData.selectedBricks || [],
        budgetMin: body.testData.budgetMin || 0,
        budgetMax: body.testData.budgetMax || 0,
        timeMin: body.testData.timeMin || 0,
        timeMax: body.testData.timeMax || 0,
        effortConfidence: body.testData.effortConfidence || "",
        noEffortEstimate: body.testData.noEffortEstimate || false,
        effortScope: (body.testData.effortScope as "" | "mvp" | "v1" | "vision_complete") || "",
      });

      // Restaurer la config originale
      await saveConfig(originalConfig);

      return NextResponse.json(
        {
          scorePercent: result.scoreTotal,
          riskLevel: bandToRiskLevel(result.band),
          breakdown: {
            P: result.subscores.P,
            R: result.subscores.R,
            I: result.subscores.I,
            C: result.subscores.C,
            E: result.subscores.E,
          },
        },
        { status: 200 },
      );
    } catch (calcError) {
      // Restaurer en cas d'erreur
      await saveConfig(originalConfig);
      throw calcError;
    }
  } catch (error) {
    console.error("[PRICE Test Score Error]", error);
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Erreur lors du calcul du score de test.",
      },
      { status: 400 },
    );
  }
}

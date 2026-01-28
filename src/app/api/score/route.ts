import { NextResponse } from "next/server";
import { computePriceScore } from "@/scoring/price";

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

type RequestBody = {
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
    console.log("[PRICE Score API] Request body received:", JSON.stringify(body, null, 2));

    const result = computePriceScore({
      problemClarity: body.problemClarity,
      problemApproach: body.problemApproach,
      interviewDepth: body.interviewDepth || "",
      valueExpectations: (body.valueExpectations as any) || "",
      alternativeSolutions: (body.alternativeSolutions as any) || "",
      personas: body.personas || [],
      personaImpacts: body.personaImpacts || {},
      selectedBricks: body.selectedBricks || [],
      budgetMin: body.budgetMin || 0,
      budgetMax: body.budgetMax || 0,
      timeMin: body.timeMin || 0,
      timeMax: body.timeMax || 0,
      effortConfidence: body.effortConfidence || "",
      noEffortEstimate: body.noEffortEstimate || false,
    });

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
        drivers: result.drivers,
        recommendations: result.recommendations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PRICE Score Error]", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors du calcul du score.";
    console.error("[PRICE Score Error Details]", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}

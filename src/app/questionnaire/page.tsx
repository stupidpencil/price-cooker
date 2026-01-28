/* Questionnaire RICE COOKER - tunnel P/R/I/C/E
 * MVP simple : état local + calcul client-side + redirection vers /resultat avec query param.
 */

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";

type Persona = {
  name: string;
  confidence: "assumed" | "met" | "interviewed" | "clients" | "";
};

type EvidenceAction =
  | "none"
  | "informal_convos"
  | "structured_interviews"
  | "prototype_test"
  | "market_signals";

type EffortConfidence = "very_uncertain" | "rather_uncertain" | "rather_sure" | "very_sure" | "";

type StepId =
  | "problem"
  | "problem_approach"
  | "problem_interview_depth"
  | "value_expectation"
  | "personas"
  | "reach"
  | "effort"
  | "context";

const steps: StepId[] = [
  "problem",
  "problem_approach",
  "problem_interview_depth",
  "value_expectation",
  "personas",
  "reach",
  "effort",
  "context",
];

export default function QuestionnairePage() {
  const router = useRouter();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [problemClarity, setProblemClarity] = useState<"clear_problem" | "solution_first" | "">(
    "",
  );

  const [problemApproach, setProblemApproach] = useState<
    "conviction_only" | "informal_discussions" | "structured_interviews" | ""
  >("");

  const [interviewDepth, setInterviewDepth] = useState<
    "listened_only" | "dug_deeper" | ""
  >("");

  type ValueExpectation =
    | "ux_better"
    | "time_saved"
    | "new_capability"
    | "game_changer"
    | "dont_know_value"
    | "";

  type AlternativeSolution =
    | "all_can_solve"
    | "some_cannot"
    | "no_alternative"
    | "dont_know_alt"
    | "";

  const [valueExpectations, setValueExpectations] = useState<ValueExpectation>("");
  const [alternativeSolutions, setAlternativeSolutions] = useState<AlternativeSolution>("");

  const [personas, setPersonas] = useState<Persona[]>([
    { name: "", confidence: "" },
  ]);

  type PersonaImpactEvidence =
    | "heard_people_say"
    | "interviews_with_persona"
    | "design_phase"
    | "tested_myself"
    | "persona_certified_solution"
    | "persona_certified_payment";

  type PersonaCountMet = "1_seul" | "2_5" | "5_10" | "plus_10" | "";

  type PersonaImpactData = {
    impactSlider: number; // 0-100, 0 = très faiblement, 100 = très fortement
    evidence: PersonaImpactEvidence[];
    countMet: PersonaCountMet; // ordre de grandeur
  };

  const [personaImpacts, setPersonaImpacts] = useState<Record<number, PersonaImpactData>>({});
  // Track si la sélection cumulative a déjà été utilisée pour chaque persona
  const [hasUsedCumulativeSelection, setHasUsedCumulativeSelection] = useState<Record<number, boolean>>({});

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

  const [selectedBricks, setSelectedBricks] = useState<FunctionalBrick[]>([]);

  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(100);
  const [timeMin, setTimeMin] = useState(0);
  const [timeMax, setTimeMax] = useState(100);
  const [effortConfidence, setEffortConfidence] = useState<EffortConfidence>("");
  const [noEffortEstimate, setNoEffortEstimate] = useState(false);

  useEffect(() => {
    if (selectedBricks.length > 0) {
      let totalBudgetMin = 0;
      let totalBudgetMax = 0;
      let totalTimeMin = 0;
      let totalTimeMax = 0;
      selectedBricks.forEach((brick) => {
        const cost = brickCosts[brick];
        totalBudgetMin += cost.budgetMin;
        totalBudgetMax += cost.budgetMax;
        totalTimeMin += cost.timeMin;
        totalTimeMax += cost.timeMax;
      });
      setBudgetMin(totalBudgetMin);
      setBudgetMax(totalBudgetMax);
      setTimeMin(totalTimeMin);
      setTimeMax(totalTimeMax);
    } else {
      setBudgetMin(0);
      setBudgetMax(0);
      setTimeMin(0);
      setTimeMax(0);
    }
  }, [selectedBricks]);

  const [projectStage, setProjectStage] = useState("");
  const [orgType, setOrgType] = useState("");
  const [hasPitchDeck, setHasPitchDeck] = useState(false);
  const [hasInvestors, setHasInvestors] = useState(false);
  const [hasPayingCustomers, setHasPayingCustomers] = useState(false);
  const [contextNotes, setContextNotes] = useState("");

  const [error, setError] = useState<string | null>(null);

  const currentStep = steps[currentStepIndex];

  const totalSteps = steps.length;

  const problemPhaseSteps: StepId[] = [
    "problem",
    "problem_approach",
    "problem_interview_depth",
    "value_expectation",
  ];

  const isProblemPhase = problemPhaseSteps.includes(currentStep);

  const brickCosts: Record<FunctionalBrick, { budgetMin: number; budgetMax: number; timeMin: number; timeMax: number }> = {
    web_app_simple: { budgetMin: 5, budgetMax: 10, timeMin: 10, timeMax: 20 },
    user_accounts: { budgetMin: 3, budgetMax: 6, timeMin: 5, timeMax: 10 },
    multi_org: { budgetMin: 6, budgetMax: 12, timeMin: 10, timeMax: 20 },
    search_simple: { budgetMin: 2, budgetMax: 4, timeMin: 3, timeMax: 7 },
    search_advanced: { budgetMin: 5, budgetMax: 10, timeMin: 10, timeMax: 20 },
    calc_simple: { budgetMin: 3, budgetMax: 6, timeMin: 5, timeMax: 10 },
    calc_complex: { budgetMin: 8, budgetMax: 15, timeMin: 15, timeMax: 30 },
    geoloc_simple: { budgetMin: 2, budgetMax: 4, timeMin: 3, timeMax: 7 },
    matching: { budgetMin: 6, budgetMax: 12, timeMin: 10, timeMax: 20 },
    export_data: { budgetMin: 2, budgetMax: 4, timeMin: 3, timeMax: 7 },
    notifications: { budgetMin: 2, budgetMax: 5, timeMin: 3, timeMax: 8 },
    streaming: { budgetMin: 15, budgetMax: 30, timeMin: 20, timeMax: 40 },
    file_upload: { budgetMin: 3, budgetMax: 6, timeMin: 5, timeMax: 10 },
    security_enhanced: { budgetMin: 4, budgetMax: 8, timeMin: 7, timeMax: 15 },
    rgpd_advanced: { budgetMin: 3, budgetMax: 6, timeMin: 5, timeMax: 10 },
    scalability: { budgetMin: 5, budgetMax: 10, timeMin: 10, timeMax: 20 },
  };

  const calculateEffortRanges = () => {
    if (selectedBricks.length === 0) {
      return { budgetMin: 0, budgetMax: 0, timeMin: 0, timeMax: 0 };
    }
    let totalBudgetMin = 0;
    let totalBudgetMax = 0;
    let totalTimeMin = 0;
    let totalTimeMax = 0;
    selectedBricks.forEach((brick) => {
      const cost = brickCosts[brick];
      totalBudgetMin += cost.budgetMin;
      totalBudgetMax += cost.budgetMax;
      totalTimeMin += cost.timeMin;
      totalTimeMax += cost.timeMax;
    });
    return { budgetMin: totalBudgetMin, budgetMax: totalBudgetMax, timeMin: totalTimeMin, timeMax: totalTimeMax };
  };

  const goPrevious = () => {
    setError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => {
        let prev = i - 1;
        while (
          prev >= 0 &&
          steps[prev] === "problem_interview_depth" &&
          problemApproach !== "structured_interviews"
        ) {
          prev -= 1;
        }
        if (prev < 0) return 0;
        return prev;
      });
    }
  };

  const goNext = () => {
    setError(null);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => {
        let next = i + 1;
        while (
          next < totalSteps &&
          steps[next] === "problem_interview_depth" &&
          problemApproach !== "structured_interviews"
        ) {
          next += 1;
        }
        if (next >= totalSteps) return totalSteps - 1;
        return next;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === "problem") {
      if (!problemClarity) {
        setError("Merci de préciser si vous partez d’un problème ou surtout d’une solution.");
        return false;
      }
    }

    if (currentStep === "problem_approach") {
      if (!problemApproach) {
        setError(
          "Merci d’indiquer la démarche que vous avez eue pour démontrer l’existence du problème.",
        );
        return false;
      }
    }

    if (currentStep === "problem_interview_depth") {
      if (problemApproach !== "structured_interviews") {
        return true;
      }
      if (!interviewDepth) {
        setError(
          "Merci de préciser comment vous avez mené vos interviews pour creuser le problème.",
        );
        return false;
      }
    }

    if (currentStep === "value_expectation") {
      if (!valueExpectations) {
        setError(
          "Merci d’indiquer à quoi vos utilisateurs gagneraient si le problème était résolu (ou sélectionnez « Je ne sais pas »).",
        );
        return false;
      }
      if (!alternativeSolutions) {
        setError(
          "Merci d’indiquer si le problème peut déjà être résolu aujourd’hui (ou sélectionnez « Je ne sais pas »).",
        );
        return false;
      }
    }

    if (currentStep === "personas") {
      const filled = personas.filter((p) => p.name.trim());
      if (filled.length === 0) {
        setError("Merci d’ajouter au moins un type d’utilisateur concerné.");
        return false;
      }
      if (filled.some((p) => !p.confidence)) {
        setError("Merci d’indiquer le niveau de confiance pour chaque persona.");
        return false;
      }
    }

    if (currentStep === "reach") {
      const filledPersonas = personas.filter((p) => p.name.trim());
      if (filledPersonas.length === 0) {
        setError("Merci d’ajouter au moins un persona à l’étape précédente.");
        return false;
      }
      // Validation optionnelle : on peut laisser les champs vides pour l'instant
      // mais on vérifie au moins que les personas existent
    }

    if (currentStep === "effort") {
      if (noEffortEstimate) {
        return true;
      }
      if (budgetMin === 0 && budgetMax === 0 && timeMin === 0 && timeMax === 0) {
        setError(
          "Merci d’indiquer au moins un ordre de grandeur (budget ou temps), ou cochez « Je ne sais pas du tout estimer l’effort ».",
        );
        return false;
      }
      if (!effortConfidence) {
        setError("Merci d’indiquer votre niveau de confiance dans cette estimation.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Valider la dernière étape avant soumission
    if (!validateCurrentStep()) return;

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemClarity,
          problemApproach,
          interviewDepth,
          valueExpectations,
          alternativeSolutions,
          personas,
          personaImpacts,
          selectedBricks,
          budgetMin,
          budgetMax,
          timeMin,
          timeMax,
          effortConfidence,
          noEffortEstimate,
          context: {
            projectStage,
            orgType,
            hasPitchDeck,
            hasInvestors,
            hasPayingCustomers,
            notes: contextNotes,
          },
        }),
      });

      if (!res.ok) {
        let errorMessage = "Erreur lors du calcul du score.";
        try {
          const errorText = await res.text();
          console.error("[Questionnaire Submit Error - Response Text]", errorText);
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
            console.error("[Questionnaire Submit Error - Parsed]", errorData);
          } catch (parseError) {
            errorMessage = errorText || errorMessage;
          }
        } catch (textError) {
          console.error("[Questionnaire Submit Error - Could not read response]", textError);
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Stocker le résultat complet dans sessionStorage pour la page résultat
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "riceCookerResult",
          JSON.stringify({
            scorePercent: data.scorePercent,
            riskLevel: data.riskLevel,
            breakdown: data.breakdown,
            drivers: data.drivers || [],
            recommendations: data.recommendations || [],
          }),
        );
      }

      router.push(
        `/resultat?score=${encodeURIComponent(
          data.scorePercent,
        )}&riskLevel=${encodeURIComponent(data.riskLevel)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du calcul du score.",
      );
    }
  };

  const handleNextClick = () => {
    if (!validateCurrentStep()) return;
    if (currentStepIndex < totalSteps - 1) {
      goNext();
    }
  };

  const stepLabel = (step: StepId): string => {
    switch (step) {
      case "problem":
        return "Problème";
      case "problem_approach":
        return "Démarche sur le problème";
      case "problem_interview_depth":
        return "Profondeur des interviews";
      case "value_expectation":
        return "Valeur et alternatives";
      case "personas":
        return "Utilisateurs concernés";
      case "reach":
        return "Impact par utilisateur";
      case "effort":
        return "Effort estimé";
      case "context":
        return "Contexte (optionnel)";
      default:
        return "";
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "problem":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Quel est le problème que vous cherchez à résoudre ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={problemClarity === "clear_problem"}
                    onChange={() => setProblemClarity("clear_problem")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      Je connais le problème que je cherche à résoudre et je l&apos;ai déjà formulé.
                    </span>
                    {problemClarity === "clear_problem" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        C&apos;est bien&nbsp;! Les problèmes sont le point de départ de toute
                        réflexion sur un produit.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={problemClarity === "solution_first"}
                    onChange={() => setProblemClarity("solution_first")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai une idée de solution, mais je n&apos;ai pas de problème spécifique à
                      résoudre.
                    </span>
                    {problemClarity === "solution_first" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        Ne pas chercher à résoudre un problème, c&apos;est miser sur la chance que votre
                        solution sera utile et donc utilisée. Nous vous conseillons de commencer par
                        identifier des problèmes à résoudre.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </fieldset>
          </section>
        );

      case "problem_approach":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Quelle démarche avez-vous eue pour démontrer l&apos;existence du problème ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={problemApproach === "conviction_only"}
                    onChange={() => setProblemApproach("conviction_only")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai la conviction que ce problème existe, mais je n&apos;ai pas cherché à le démontrer.
                    </span>
                    {problemApproach === "conviction_only" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        Il est préférable d&apos;effectuer des sessions de recherche pour déterminer si le
                        problème est réel ou s&apos;il n&apos;est pas juste l&apos;expression de vos convictions.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={problemApproach === "informal_discussions"}
                    onChange={() => setProblemApproach("informal_discussions")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai interrogé mes proches et sondé des connaissances lors d&apos;échanges plutôt informels (dîner, discussion, etc.).
                    </span>
                    {problemApproach === "informal_discussions" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        Il est préférable d&apos;effectuer une recherche à partir d&apos;un panel
                        d&apos;utilisateurs concernés par votre problème. La discussion informelle peut être
                        intéressante pour prendre la température, mais elle ne permet pas de structurer une
                        recherche en s&apos;assurant de sa pertinence.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={problemApproach === "structured_interviews"}
                    onChange={() => setProblemApproach("structured_interviews")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai utilisé une méthode d&apos;interview sur un panel de personnes concernées par le problème.
                    </span>
                    {problemApproach === "structured_interviews" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        C&apos;est une très bonne base&nbsp;: une démarche structurée vous aide à distinguer un
                        vrai problème d&apos;un simple ressenti et à réduire fortement le risque.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </fieldset>
          </section>
        );

      case "problem_interview_depth":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Avez-vous réussi à savoir si le problème identifié n&apos;était pas la conséquence d&apos;un problème plus profond ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={interviewDepth === "listened_only"}
                    onChange={() => setInterviewDepth("listened_only")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai écouté et pris note des réponses de mon interlocuteur.
                    </span>
                    {interviewDepth === "listened_only" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        Généralement, les interviewés ne creusent pas le sujet d&apos;eux-mêmes et donnent
                        d&apos;abord des réponses superficielles qui vont vous orienter vers un problème peu
                        impactant. Cela augmente aussi les risques de biais de confirmation. Il est
                        nécessaire de challenger l&apos;interviewé par des relances et des reformulations afin
                        de creuser le sujet ensemble.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                    checked={interviewDepth === "dug_deeper"}
                    onChange={() => setInterviewDepth("dug_deeper")}
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      J&apos;ai cherché à creuser le problème en interrogeant plusieurs fois mon interlocuteur sur le même sujet d&apos;une manière différente (question reformulée, prise de recul, décentrage du regard, etc.).
                    </span>
                    {interviewDepth === "dug_deeper" && (
                      <span className="mt-0.5 block text-xs text-zinc-600">
                        En variant les angles et en relançant votre interlocuteur, vous augmentez vos chances
                        de remonter au vrai problème et de limiter les réponses superficielles.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </fieldset>
          </section>
        );

      case "value_expectation":
        return (
          <section className="space-y-6">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Que sont prêts à payer les gens qui ont ce problème ?
              </h1>
              <p className="text-xs text-zinc-500">Impact perçu et solutions existantes</p>
            </div>
            <div className="space-y-8">
              <fieldset className="space-y-3">
                <p className="text-sm font-medium text-zinc-900">
                  Si ce problème est résolu, à quel point les utilisateurs seront prêts à investir
                  du temps ou de l&apos;argent pour le résoudre ?
                </p>
                <div className="space-y-2 text-sm text-zinc-800">
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={valueExpectations === "ux_better"}
                      onChange={() => setValueExpectations("ux_better")}
                    />
                    <span className="flex-1">L&apos;expérience utilisateur sera meilleure.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={valueExpectations === "time_saved"}
                      onChange={() => setValueExpectations("time_saved")}
                    />
                    <span className="flex-1">Les utilisateurs gagneront du temps.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={valueExpectations === "new_capability"}
                      onChange={() => setValueExpectations("new_capability")}
                    />
                    <span className="flex-1">
                      Les utilisateurs pourront faire quelque chose d&apos;inaccessible et de
                      pénible auparavant.
                    </span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={valueExpectations === "game_changer"}
                      onChange={() => setValueExpectations("game_changer")}
                    />
                    <span className="flex-1">C&apos;est game changer pour le business de mes utilisateurs.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={valueExpectations === "dont_know_value"}
                      onChange={() => setValueExpectations("dont_know_value")}
                    />
                    <span className="flex-1">Je ne sais pas.</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <p className="text-sm font-medium text-zinc-900">
                  Est-il possible aujourd&apos;hui de résoudre ce problème, même de manière
                  dégradée (concurrent, hack, etc.) ?
                </p>
                <div className="space-y-2 text-sm text-zinc-800">
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={alternativeSolutions === "all_can_solve"}
                      onChange={() => setAlternativeSolutions("all_can_solve")}
                    />
                    <span className="flex-1">Oui, tous mes utilisateurs font ça.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={alternativeSolutions === "some_cannot"}
                      onChange={() => setAlternativeSolutions("some_cannot")}
                    />
                    <span className="flex-1">
                      Oui, mais certains utilisateurs ne peuvent pas le faire / n&apos;y ont pas accès.
                    </span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={alternativeSolutions === "no_alternative"}
                      onChange={() => setAlternativeSolutions("no_alternative")}
                    />
                    <span className="flex-1">Non, ce problème n&apos;a pas vraiment d&apos;alternative.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                      checked={alternativeSolutions === "dont_know_alt"}
                      onChange={() => setAlternativeSolutions("dont_know_alt")}
                    />
                    <span className="flex-1">Je ne sais pas.</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </section>
        );

      case "personas":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Qui rencontre ce problème ?
            </h1>
            <p className="text-sm text-zinc-700">
              Nommez les types de personnes pour qui ce problème est réel. Plus vos personas sont
              concrets, plus le risque diminue.
            </p>
            <div className="space-y-4">
              {personas.map((persona, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Persona {index + 1}
                    </span>
                    {personas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPersonas((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-xs text-zinc-500 hover:text-red-600"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-800">
                        Nom court (ex. &quot;Julien, entrepreneur&quot;)
                      </label>
                      <input
                        type="text"
                        value={persona.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPersonas((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, name: value } : p,
                            ),
                          );
                        }}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-800">
                        Degré de confiance
                      </label>
                      <select
                        value={persona.confidence}
                        onChange={(e) => {
                          const value = e.target.value as Persona["confidence"];
                          setPersonas((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, confidence: value } : p,
                            ),
                          );
                        }}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="">Sélectionnez une option</option>
                        <option value="assumed">
                          Je pense que cet utilisateur existe
                        </option>
                        <option value="met">
                          J&apos;ai déjà rencontré cet utilisateur
                        </option>
                        <option value="interviewed">
                          J&apos;ai déjà interviewé cet utilisateur dans le cadre d&apos;une recherche liée à mon idée
                        </option>
                        <option value="clients">
                          Cet utilisateur utilise déjà mon produit
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setPersonas((prev) => [
                  ...prev,
                  { name: "", confidence: "" },
                ])
              }
              className="text-sm font-medium text-zinc-800 underline-offset-4 hover:underline"
            >
              + Ajouter un persona
            </button>
          </section>
        );

      case "reach":
        const filledPersonas = personas.filter((p) => p.name.trim());
        return (
          <section className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Quel impact la solution aura chez ces utilisateurs ?
              </h1>
              <p className="text-sm text-zinc-700">
                Indiquez l&apos;impact de la solution sur{" "}
                {filledPersonas.map((p, i) => (
                  <span key={i}>
                    {i > 0 && i === filledPersonas.length - 1 && " et "}
                    {i > 0 && i < filledPersonas.length - 1 && ", "}
                    <span className="font-medium">{p.name || `Persona ${i + 1}`}</span>
                  </span>
                ))}
                .
              </p>
            </div>
            <div className="space-y-8">
              {filledPersonas.map((persona, index) => {
                const impactData = personaImpacts[index] || {
                  impactSlider: 50,
                  evidence: [],
                  countMet: "" as PersonaCountMet,
                };

                const toggleEvidence = (evidence: PersonaImpactEvidence) => {
                  setPersonaImpacts((prev) => {
                    const current = prev[index] || {
                      impactSlider: 50,
                      evidence: [],
                      countMet: "" as PersonaCountMet,
                    };
                    const newEvidence = current.evidence.includes(evidence)
                      ? current.evidence.filter((e) => e !== evidence)
                      : [...current.evidence, evidence];
                    return {
                      ...prev,
                      [index]: { ...current, evidence: newEvidence },
                    };
                  });
                };

                return (
                  <div key={index} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      La solution va aider {persona.name || `Persona ${index + 1}`}...
                    </h2>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-600">
                          <span>Très faiblement</span>
                          <span>Très fortement</span>
                        </div>
                        <div className="relative">
                          <div
                            className="absolute inset-0 h-2 rounded-full"
                            style={{
                              background: `linear-gradient(to right, 
                                #ef4444 0%, 
                                #ef4444 40%, 
                                #eab308 40%, 
                                #eab308 79%, 
                                #22c55e 79%, 
                                #22c55e 100%)`,
                            }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={impactData.impactSlider}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setPersonaImpacts((prev) => ({
                                ...prev,
                                [index]: {
                                  ...prev[index],
                                  impactSlider: val,
                                  evidence: prev[index]?.evidence || [],
                                  countMet: prev[index]?.countMet || ("" as PersonaCountMet),
                                },
                              }));
                            }}
                            className="relative z-10 h-2 w-full appearance-none rounded-full bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-800">
                          Pour preuve, vous avez
                        </label>
                        
                        {/* Vérifier si c'est la première sélection (aucune preuve ou toutes consécutives depuis le début) */}
                        {(() => {
                          const allProofs: PersonaImpactEvidence[] = [
                            "heard_people_say",
                            "interviews_with_persona",
                            "design_phase",
                            "tested_myself",
                            "persona_certified_solution",
                            "persona_certified_payment",
                          ];
                          
                          // Vérifier si on a déjà utilisé la sélection cumulative pour cette persona
                          const hasUsedCumulative = hasUsedCumulativeSelection[index] || false;
                          
                          // Si on a déjà utilisé la sélection cumulative, on passe en mode individuel
                          // Sinon, on vérifie si c'est la première sélection (aucune preuve ou toutes consécutives depuis le début)
                          let isConsecutiveFromStart = true;
                          let firstMissingIndex = -1;
                          for (let i = 0; i < allProofs.length; i++) {
                            if (!impactData.evidence.includes(allProofs[i])) {
                              firstMissingIndex = i;
                              break;
                            }
                          }
                          // Si on a trouvé un index manquant, vérifier qu'il n'y a pas de preuves après
                          if (firstMissingIndex !== -1) {
                            for (let i = firstMissingIndex; i < allProofs.length; i++) {
                              if (impactData.evidence.includes(allProofs[i])) {
                                isConsecutiveFromStart = false;
                                break;
                              }
                            }
                          }
                          
                          // Le mode cumulatif n'est disponible que si :
                          // 1. On n'a pas encore utilisé la sélection cumulative
                          // 2. Aucune preuve n'est sélectionnée OU toutes les preuves sont consécutives depuis le début
                          const isFirstSelection = !hasUsedCumulative && (impactData.evidence.length === 0 || isConsecutiveFromStart);
                          
                          return (
                            <>
                              {isFirstSelection ? (
                                /* Mode curseur cumulatif (première sélection) */
                                <div className="space-y-1">
                                  <p className="mb-2 text-xs text-zinc-500">
                                    Cliquez sur le niveau maximum que vous avez atteint (sélection cumulative)
                                  </p>
                                  {[
                                    {
                                      id: "heard_people_say" as PersonaImpactEvidence,
                                      label: "entendu des personnes dire que cette solution serait la bonne",
                                      level: 1,
                                    },
                                    {
                                      id: "interviews_with_persona" as PersonaImpactEvidence,
                                      label: `réalisé des entretiens avec ${persona.name || `Persona ${index + 1}`} sur le problème en question`,
                                      level: 2,
                                    },
                                    {
                                      id: "design_phase" as PersonaImpactEvidence,
                                      label: "réalisé une phase de conception de la solution avec un designer qualifié",
                                      level: 3,
                                    },
                                    {
                                      id: "tested_myself" as PersonaImpactEvidence,
                                      label: "testé la solution moi-même et je la trouve intéressante",
                                      level: 4,
                                    },
                                    {
                                      id: "persona_certified_solution" as PersonaImpactEvidence,
                                      label: `interrogé ${persona.name || `Persona ${index + 1}`} qui vous a certifié que ma solution était la bonne`,
                                      level: 5,
                                    },
                                    {
                                      id: "persona_certified_payment" as PersonaImpactEvidence,
                                      label: `interrogé ${persona.name || `Persona ${index + 1}`} qui vous a certifié qu'il paierait pour cette solution`,
                                      level: 6,
                                    },
                                  ].map((proof, proofIndex) => {
                                    const isSelected = impactData.evidence.includes(proof.id);
                                    
                                    // Déterminer le niveau maximum atteint
                                    let maxConsecutiveLevel = 0;
                                    for (let i = 0; i < allProofs.length; i++) {
                                      if (impactData.evidence.includes(allProofs[i])) {
                                        maxConsecutiveLevel = i + 1;
                                      } else {
                                        break;
                                      }
                                    }
                                    
                                    const isAtLevel = proof.level <= maxConsecutiveLevel;
                                    
                                    return (
                                      <div key={proof.id} className="relative">
                                        {/* Ligne de connexion verticale */}
                                        {proofIndex < 5 && (
                                          <div
                                            className={`absolute left-[11px] top-6 h-6 w-0.5 ${
                                              isAtLevel ? "bg-emerald-500" : "bg-zinc-200"
                                            }`}
                                          />
                                        )}
                                        
                                        {/* Bouton de niveau */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const targetLevel = proof.level;
                                            // Sélectionner jusqu'à ce niveau (mode cumulatif)
                                            const newEvidence = allProofs.slice(0, targetLevel);
                                            
                                            // Marquer qu'on a utilisé la sélection cumulative pour cette persona
                                            setHasUsedCumulativeSelection((prev) => ({
                                              ...prev,
                                              [index]: true,
                                            }));
                                            
                                            setPersonaImpacts((prev) => ({
                                              ...prev,
                                              [index]: {
                                                ...prev[index],
                                                impactSlider: prev[index]?.impactSlider || 50,
                                                evidence: newEvidence,
                                                countMet: prev[index]?.countMet || ("" as PersonaCountMet),
                                              },
                                            }));
                                          }}
                                          className={`group relative flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left text-sm transition-all ${
                                            isAtLevel
                                              ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                                              : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                          }`}
                                        >
                                          {/* Indicateur de niveau (cercle) */}
                                          <div
                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                              isAtLevel
                                                ? "border-emerald-500 bg-emerald-500"
                                                : "border-zinc-300 bg-white group-hover:border-zinc-400"
                                            }`}
                                          >
                                            {isAtLevel && (
                                              <svg
                                                className="h-3.5 w-3.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={3}
                                                  d="M5 13l4 4L19 7"
                                                />
                                              </svg>
                                            )}
                                          </div>
                                          
                                          {/* Texte de la preuve */}
                                          <div className="flex-1 pt-0.5">
                                            <span className={isAtLevel ? "font-medium" : ""}>
                                              {proof.label}
                                            </span>
                                          </div>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Mode sélection individuelle (après première sélection) */
                                <div className="space-y-2 text-sm text-zinc-800">
                                  <p className="mb-2 text-xs text-zinc-500">
                                    Cliquez pour sélectionner ou désélectionner les preuves individuellement
                                  </p>
                                  {[
                                    {
                                      id: "heard_people_say" as PersonaImpactEvidence,
                                      label: "entendu des personnes dire que cette solution serait la bonne",
                                    },
                                    {
                                      id: "interviews_with_persona" as PersonaImpactEvidence,
                                      label: `réalisé des entretiens avec ${persona.name || `Persona ${index + 1}`} sur le problème en question`,
                                    },
                                    {
                                      id: "design_phase" as PersonaImpactEvidence,
                                      label: "réalisé une phase de conception de la solution avec un designer qualifié",
                                    },
                                    {
                                      id: "tested_myself" as PersonaImpactEvidence,
                                      label: "testé la solution moi-même et je la trouve intéressante",
                                    },
                                    {
                                      id: "persona_certified_solution" as PersonaImpactEvidence,
                                      label: `interrogé ${persona.name || `Persona ${index + 1}`} qui vous a certifié que ma solution était la bonne`,
                                    },
                                    {
                                      id: "persona_certified_payment" as PersonaImpactEvidence,
                                      label: `interrogé ${persona.name || `Persona ${index + 1}`} qui vous a certifié qu'il paierait pour cette solution`,
                                    },
                                  ].map((proof) => {
                                    const isSelected = impactData.evidence.includes(proof.id);
                                    return (
                                      <label
                                        key={proof.id}
                                        className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm"
                                      >
                                        <input
                                          type="checkbox"
                                          className="mt-0.5 h-5 w-5 cursor-pointer rounded border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-zinc-900 checked:bg-zinc-900 hover:border-zinc-500"
                                          checked={isSelected}
                                          onChange={() => toggleEvidence(proof.id)}
                                        />
                                        <span className={`flex-1 ${isSelected ? "font-medium" : ""}`}>
                                          {proof.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-800">
                          Combien de {persona.name || `Persona ${index + 1}`} avez-vous rencontré ?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-zinc-50">
                            <input
                              type="radio"
                              name={`countMet-${index}`}
                              checked={impactData.countMet === "1_seul"}
                              onChange={() => {
                                setPersonaImpacts((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    impactSlider: prev[index]?.impactSlider || 50,
                                    evidence: prev[index]?.evidence || [],
                                    countMet: "1_seul",
                                  },
                                }));
                              }}
                              className="sr-only"
                            />
                            <span>1 seul</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-zinc-50">
                            <input
                              type="radio"
                              name={`countMet-${index}`}
                              checked={impactData.countMet === "2_5"}
                              onChange={() => {
                                setPersonaImpacts((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    impactSlider: prev[index]?.impactSlider || 50,
                                    evidence: prev[index]?.evidence || [],
                                    countMet: "2_5",
                                  },
                                }));
                              }}
                              className="sr-only"
                            />
                            <span>Entre 2 et 5</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-zinc-50">
                            <input
                              type="radio"
                              name={`countMet-${index}`}
                              checked={impactData.countMet === "5_10"}
                              onChange={() => {
                                setPersonaImpacts((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    impactSlider: prev[index]?.impactSlider || 50,
                                    evidence: prev[index]?.evidence || [],
                                    countMet: "5_10",
                                  },
                                }));
                              }}
                              className="sr-only"
                            />
                            <span>Entre 5 et 10</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-zinc-50">
                            <input
                              type="radio"
                              name={`countMet-${index}`}
                              checked={impactData.countMet === "plus_10"}
                              onChange={() => {
                                setPersonaImpacts((prev) => ({
                                  ...prev,
                                  [index]: {
                                    ...prev[index],
                                    impactSlider: prev[index]?.impactSlider || 50,
                                    evidence: prev[index]?.evidence || [],
                                    countMet: "plus_10",
                                  },
                                }));
                              }}
                              className="sr-only"
                            />
                            <span>Plus de 10</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );

      case "effort":
        const ranges = calculateEffortRanges();
        const budgetMaxValue = Math.max(100, ranges.budgetMax * 1.2);
        const timeMaxValue = Math.max(100, ranges.timeMax * 1.2);

        return (
          <section className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Évaluez l&apos;effort que votre solution requiert
              </h1>
              <p className="text-sm text-zinc-700">
                Indiquez l&apos;effort et votre degré de confiance dans celui-ci.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="mb-3 text-base font-semibold text-zinc-900">
                  Sélectionnez les briques fonctionnelles que votre solution nécessite.
                </h2>
                <p className="mb-4 text-xs text-zinc-600">
                  Chaque choix augmente l&apos;effort de conception, de développement et de maintenance. Les
                  montants indiqués sont des ordres de grandeur observés sur des projets numériques standards.
                  Ils servent à estimer le niveau de risque, pas à produire un devis.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">🧱 Socle & structure</h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "web_app_simple",
                          label: "Application web simple (CRUD, formulaires, pages)",
                          cost: "≈ 5 000 – 10 000 €",
                          desc: "Pages, formulaires, logique métier simple, back-office basique.",
                        },
                        {
                          id: "user_accounts",
                          label: "Gestion des comptes utilisateurs (authentification, rôles)",
                          cost: "≈ 3 000 – 6 000 €",
                          desc: "Inscription, connexion, mots de passe, permissions.",
                        },
                        {
                          id: "multi_org",
                          label: "Plateforme multi-utilisateurs / multi-organisations",
                          cost: "≈ 6 000 – 12 000 €",
                          desc: "Gestion d&apos;espaces, droits avancés, isolation des données.",
                        },
                      ].map((brick) => (
                        <label
                          key={brick.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedBricks.includes(brick.id as FunctionalBrick)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBricks((prev) => [...prev, brick.id as FunctionalBrick]);
                              } else {
                                setSelectedBricks((prev) => prev.filter((b) => b !== brick.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{brick.label}</div>
                            <div className="text-xs text-zinc-600">{brick.cost}</div>
                            <div className="mt-0.5 text-xs text-zinc-500">{brick.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">🔎 Données & logique métier</h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "search_simple",
                          label: "Recherche simple dans une base de données",
                          cost: "≈ 2 000 – 4 000 €",
                          desc: "Filtres, tri, recherche basique.",
                        },
                        {
                          id: "search_advanced",
                          label: "Recherche avancée (filtres complexes, scoring, ranking)",
                          cost: "≈ 5 000 – 10 000 €",
                          desc: "",
                        },
                        {
                          id: "calc_simple",
                          label: "Moteur de calcul simple",
                          cost: "≈ 3 000 – 6 000 €",
                          desc: "Scores, règles déterministes, calculs conditionnels.",
                        },
                        {
                          id: "calc_complex",
                          label: "Moteur de calcul complexe / règles évolutives",
                          cost: "≈ 8 000 – 15 000 €",
                          desc: "Pondérations, scénarios, règles configurables, simulations.",
                        },
                      ].map((brick) => (
                        <label
                          key={brick.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedBricks.includes(brick.id as FunctionalBrick)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBricks((prev) => [...prev, brick.id as FunctionalBrick]);
                              } else {
                                setSelectedBricks((prev) => prev.filter((b) => b !== brick.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{brick.label}</div>
                            <div className="text-xs text-zinc-600">{brick.cost}</div>
                            {brick.desc && <div className="mt-0.5 text-xs text-zinc-500">{brick.desc}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">
                      📍 Fonctionnalités spécifiques
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "geoloc_simple",
                          label: "Géolocalisation simple",
                          cost: "≈ 2 000 – 4 000 €",
                          desc: "Adresse, carte, position utilisateur.",
                        },
                        {
                          id: "matching",
                          label: "Matching / recommandation (logique métier)",
                          cost: "≈ 6 000 – 12 000 €",
                          desc: "Mise en relation, priorisation, scoring de profils.",
                        },
                        {
                          id: "export_data",
                          label: "Export de données (PDF, CSV, impression)",
                          cost: "≈ 2 000 – 4 000 €",
                          desc: "",
                        },
                        {
                          id: "notifications",
                          label: "Notifications (email, in-app)",
                          cost: "≈ 2 000 – 5 000 €",
                          desc: "",
                        },
                      ].map((brick) => (
                        <label
                          key={brick.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedBricks.includes(brick.id as FunctionalBrick)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBricks((prev) => [...prev, brick.id as FunctionalBrick]);
                              } else {
                                setSelectedBricks((prev) => prev.filter((b) => b !== brick.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{brick.label}</div>
                            <div className="text-xs text-zinc-600">{brick.cost}</div>
                            {brick.desc && <div className="mt-0.5 text-xs text-zinc-500">{brick.desc}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">
                      🎥 Médias & temps réel (fort facteur de risque)
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "streaming",
                          label: "Streaming vidéo / visio / temps réel",
                          cost: "≈ 15 000 – 30 000 €",
                          desc: "Infra, bande passante, qualité de service, maintenance élevée.",
                        },
                        {
                          id: "file_upload",
                          label: "Upload & gestion de fichiers lourds (images, docs, vidéos)",
                          cost: "≈ 3 000 – 6 000 €",
                          desc: "",
                        },
                      ].map((brick) => (
                        <label
                          key={brick.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedBricks.includes(brick.id as FunctionalBrick)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBricks((prev) => [...prev, brick.id as FunctionalBrick]);
                              } else {
                                setSelectedBricks((prev) => prev.filter((b) => b !== brick.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{brick.label}</div>
                            <div className="text-xs text-zinc-600">{brick.cost}</div>
                            {brick.desc && <div className="mt-0.5 text-xs text-zinc-500">{brick.desc}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-800">
                      🔐 Qualité, conformité, exploitation
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "security_enhanced",
                          label: "Sécurité renforcée / données sensibles",
                          cost: "≈ 4 000 – 8 000 €",
                          desc: "",
                        },
                        {
                          id: "rgpd_advanced",
                          label: "Conformité RGPD avancée (droits, exports, traçabilité)",
                          cost: "≈ 3 000 – 6 000 €",
                          desc: "",
                        },
                        {
                          id: "scalability",
                          label: "Scalabilité / performance (prévue dès le départ)",
                          cost: "≈ 5 000 – 10 000 €",
                          desc: "",
                        },
                      ].map((brick) => (
                        <label
                          key={brick.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedBricks.includes(brick.id as FunctionalBrick)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBricks((prev) => [...prev, brick.id as FunctionalBrick]);
                              } else {
                                setSelectedBricks((prev) => prev.filter((b) => b !== brick.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{brick.label}</div>
                            <div className="text-xs text-zinc-600">{brick.cost}</div>
                            {brick.desc && <div className="mt-0.5 text-xs text-zinc-500">{brick.desc}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-4 text-xs text-zinc-600">
                  Vous pouvez vous aider de ce chiffrage approximatif ici :
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-zinc-800">
                      <span>Budget</span>
                      <span>
                        {budgetMin > 0 ? `${budgetMin}k€` : "0"} à {budgetMax > 0 ? `${budgetMax}k€` : "0"}
                      </span>
                    </div>
                    <div className="relative h-2 w-full">
                      <div className="absolute h-2 w-full rounded-full bg-zinc-300">
                        <div
                          className="absolute h-2 rounded-l-full bg-blue-700"
                          style={{
                            left: "0%",
                            width: `${(budgetMin / budgetMaxValue) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute h-2 bg-blue-400"
                          style={{
                            left: `${(budgetMin / budgetMaxValue) * 100}%`,
                            width: `${((budgetMax - budgetMin) / budgetMaxValue) * 100}%`,
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={budgetMaxValue}
                        value={budgetMin}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= budgetMax) setBudgetMin(val);
                        }}
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
                      />
                      <input
                        type="range"
                        min={0}
                        max={budgetMaxValue}
                        value={budgetMax}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= budgetMin) setBudgetMax(val);
                        }}
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-zinc-800">
                      <span>Temps</span>
                      <span>
                        {timeMin > 0 ? `${timeMin}` : "0"} à {timeMax > 0 ? `${timeMax}` : "0"}jours
                      </span>
                    </div>
                    <div className="relative h-2 w-full">
                      <div className="absolute h-2 w-full rounded-full bg-zinc-300">
                        <div
                          className="absolute h-2 rounded-l-full bg-blue-700"
                          style={{
                            left: "0%",
                            width: `${(timeMin / timeMaxValue) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute h-2 bg-blue-400"
                          style={{
                            left: `${(timeMin / timeMaxValue) * 100}%`,
                            width: `${((timeMax - timeMin) / timeMaxValue) * 100}%`,
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={timeMaxValue}
                        value={timeMin}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= timeMax) setTimeMin(val);
                        }}
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
                      />
                      <input
                        type="range"
                        min={0}
                        max={timeMaxValue}
                        value={timeMax}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= timeMin) setTimeMax(val);
                        }}
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-zinc-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Confiance dans cette estimation
                </label>
                <select
                  value={effortConfidence}
                  onChange={(e) => setEffortConfidence(e.target.value as EffortConfidence)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Sélectionnez une option</option>
                  <option value="very_uncertain">Très incertain</option>
                  <option value="rather_uncertain">Plutôt incertain</option>
                  <option value="rather_sure">Plutôt sûr</option>
                  <option value="very_sure">Très sûr</option>
                </select>
              </div>
            </div>
          </section>
        );

      case "context":
        return (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Quelques informations contextuelles (optionnel)
            </h1>
            <p className="text-sm text-zinc-700">
              Ces éléments ne rentrent pas dans le calcul du score, mais aident un pro à
              comprendre votre situation si vous choisissez de le contacter ensuite.
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Stade actuel du projet
                </label>
                <select
                  value={projectStage}
                  onChange={(e) => setProjectStage(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Je préfère ne pas préciser</option>
                  <option value="idea">Idée</option>
                  <option value="prototype">Prototype / maquette</option>
                  <option value="in_production">Déjà en production</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Type d&apos;organisation
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Je préfère ne pas préciser</option>
                  <option value="startup">Startup</option>
                  <option value="company">Entreprise</option>
                  <option value="public_admin">Administration / service public</option>
                  <option value="association">Association</option>
                  <option value="freelance">Indépendant</option>
                  <option value="side_project">Side project</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-800">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasPitchDeck}
                    onChange={(e) => setHasPitchDeck(e.target.checked)}
                  />
                  <span>J&apos;ai un pitch deck ou équivalent.</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasInvestors}
                    onChange={(e) => setHasInvestors(e.target.checked)}
                  />
                  <span>J&apos;ai (ou je cherche) des investisseurs.</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasPayingCustomers}
                    onChange={(e) => setHasPayingCustomers(e.target.checked)}
                  />
                  <span>J&apos;ai déjà des clients prêts à payer.</span>
                </label>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Infos complémentaires (optionnel)
                </label>
                <textarea
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  placeholder="Précisez par exemple le contexte interne, les enjeux politiques, ou toute information que vous jugez utile."
                />
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const handleQuit = () => {
    router.push("/");
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10"
      >
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] text-zinc-500">
              {currentStepIndex + 1}/{totalSteps}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {isProblemPhase ? "Problème" : "Solution"}
            </p>
            <p className="text-sm font-medium text-zinc-900">{stepLabel(currentStep)}</p>
          </div>
          <button
            type="button"
            onClick={handleQuit}
            className="text-xs font-medium text-zinc-500 underline-offset-4 hover:underline"
          >
            Quitter
          </button>
        </header>

        <div className="space-y-1">
          <div className="flex gap-1 rounded-full bg-zinc-200 p-1">
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepId = steps[index];
              const isPastOrCurrent = index <= currentStepIndex;
              const inProblemPhase = problemPhaseSteps.includes(stepId);
              const baseColor = inProblemPhase ? "bg-amber-400" : "bg-emerald-400";
              const mutedColor = inProblemPhase ? "bg-amber-200" : "bg-emerald-200";

              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    isPastOrCurrent ? baseColor : mutedColor
                  }`}
                />
              );
            })}
          </div>
        </div>

        <main className="flex-1 space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          {renderStep()}
        </main>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <footer className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentStepIndex === 0}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>

          {isLastStep ? (
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            >
              Voir mon résultat
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextClick}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            >
              Suivant
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}


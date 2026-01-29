/* Questionnaire RICE COOKER - tunnel P/R/I/C/E
 * MVP simple : état local + calcul client-side + redirection vers /resultat avec query param.
 */

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import toast from "react-hot-toast";

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
  | "effort";

const steps: StepId[] = [
  "problem",
  "problem_approach",
  "problem_interview_depth",
  "value_expectation",
  "personas",
  "reach",
  "effort",
];

export default function QuestionnairePage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState("");

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
    impactSlider: number; // 25, 50, 75, ou 100 (Faible, Moyen, Fort, Critique)
    evidence: PersonaImpactEvidence[];
    countMet: PersonaCountMet; // ordre de grandeur
  };

  const [personaImpacts, setPersonaImpacts] = useState<Record<number, PersonaImpactData>>({});
  // Track les tooltips visibles (clé: "personaIndex-levelValue")
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set());

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

  type EffortScope = "mvp" | "v1" | "vision_complete" | "";
  const [effortScope, setEffortScope] = useState<EffortScope>("");
  
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(100);
  const [timeMin, setTimeMin] = useState(0);
  const [timeMax, setTimeMax] = useState(100);
  const [effortConfidence, setEffortConfidence] = useState<EffortConfidence>("");
  const [noEffortEstimate, setNoEffortEstimate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("riceCookerProjectName");
    if (stored && stored.trim()) {
      setProjectName(stored.trim());
      setProjectNameDraft(stored.trim());
    }
  }, []);

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

  // Désélectionner automatiquement les briques non autorisées selon le périmètre
  useEffect(() => {
    if (!effortScope) {
      // Si aucun périmètre n'est sélectionné, ne rien faire
      return;
    }
    
    const getBrickStatus = (brickId: FunctionalBrick): { visible: boolean; selectable: boolean; disabled: boolean } => {
          if (effortScope === "mvp") {
            // MVP : certaines briques sont désactivées (grisées et non sélectionnables)
            const hiddenBricks: FunctionalBrick[] = [
          "search_advanced",      // Recherche avancée
          "matching",              // Matching / recommandation
          "geoloc_simple",         // Géolocalisation
          "notifications",         // Notifications
          "streaming",             // Streaming / temps réel
          "file_upload",           // Upload de fichiers lourds
          "scalability",           // Scalabilité
          "security_enhanced",     // Sécurité renforcée
          "rgpd_advanced",         // RGPD avancé
          "calc_complex",          // Moteur de calcul complexe
          "multi_org",             // Multi-organisations (non mentionnée, donc masquée)
        ];
        if (hiddenBricks.includes(brickId)) {
          return { visible: true, selectable: false, disabled: true };
        }
        // Toutes les autres briques sont visibles et sélectionnables en MVP
        // user_accounts reste visible et sélectionnable (optionnelle, décochée par défaut)
        return { visible: true, selectable: true, disabled: false };
      }
      
      if (effortScope === "v1") {
        // V1 : certaines briques sont visibles mais désactivées (grisées)
        const disabledBricks: FunctionalBrick[] = [
          "multi_org",
          "calc_complex",
          "matching",
          "streaming",
          "scalability",
          "rgpd_advanced",
        ];
        if (disabledBricks.includes(brickId)) {
          return { visible: true, selectable: false, disabled: true };
        }
        return { visible: true, selectable: true, disabled: false };
      }
      
      // Vision complète : toutes les briques sont disponibles
      return { visible: true, selectable: true, disabled: false };
    };
    
    // Utiliser une fonction de mise à jour pour garantir que l'état est bien mis à jour
    setSelectedBricks((prev) => {
      const filtered = prev.filter((brick) => {
        const status = getBrickStatus(brick);
        // Garder seulement les briques qui sont sélectionnables et non désactivées
        // Les briques désactivées (disabled: true ou selectable: false) doivent être retirées
        const shouldKeep = status.selectable && !status.disabled;
        return shouldKeep;
      });
      
      // Pour MVP, décochée user_accounts par défaut si elle était sélectionnée
      // (selon les spécifications : "optionnelle, affichée mais décochée par défaut")
      let finalFiltered = filtered;
      if (effortScope === "mvp" && filtered.includes("user_accounts")) {
        // On la retire de la sélection pour qu'elle soit décochée par défaut
        finalFiltered = filtered.filter((b) => b !== "user_accounts");
      }
      
      // Retourner le nouveau tableau même s'il est identique pour forcer le re-render
      return finalFiltered;
    });
  }, [effortScope]);

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
        toast.error("Merci de préciser si vous partez d’un problème ou surtout d’une solution.");
        return false;
      }
    }

    if (currentStep === "problem_approach") {
      if (!problemApproach) {
        toast.error( "Merci d’indiquer la démarche que vous avez eue pour démontrer l’existence du problème.", { duration: 10000 });
        return false;
      }
    }

    if (currentStep === "problem_interview_depth") {
      if (problemApproach !== "structured_interviews") {
        return true;
      }
      if (!interviewDepth) {
        toast.error("Merci de préciser comment vous avez mené vos interviews pour creuser le problème.", { duration: 10000 });
        return false;
      }
    }

    if (currentStep === "value_expectation") {
      if (!valueExpectations) {
        toast.error(
          "Merci d’indiquer à quoi vos utilisateurs gagneraient si le problème était résolu (ou sélectionnez « Je ne sais pas »).", { duration: 10000 });
        return false;
      }
      if (!alternativeSolutions) {
        toast.error( "Merci d’indiquer si le problème peut déjà être résolu aujourd’hui (ou sélectionnez « Je ne sais pas »).", { duration: 10000 });
        return false;
      }
    }

    if (currentStep === "personas") {
      const filled = personas.filter((p) => p.name.trim());
      if (filled.length === 0) {
        toast.error("Merci d’ajouter au moins un type d’utilisateur concerné.", { duration: 10000 });
        return false;
      }
      if (filled.some((p) => !p.confidence)) {
        toast.error("Merci d’indiquer le niveau de confiance pour chaque persona.", { duration: 10000 });
        return false;
      }
    }

    if (currentStep === "reach") {
      const filledPersonas = personas.filter((p) => p.name.trim());
      if (filledPersonas.length === 0) {
        toast.error("Merci d’ajouter au moins un persona à l’étape précédente.", { duration: 10000 });
        return false;
      }
      // Validation optionnelle : on peut laisser les champs vides pour l'instant
      // mais on vérifie au moins que les personas existent
    }

    if (currentStep === "effort") {
      if (!effortScope) {
        toast.error("Merci de sélectionner le périmètre de votre estimation (MVP, V1 ou Vision complète).", { duration: 10000 });
        return false;
      }
      if (noEffortEstimate) {
        return true;
      }
      if (budgetMin === 0 && budgetMax === 0 && timeMin === 0 && timeMax === 0) {
        toast.error( "Merci d’indiquer au moins un ordre de grandeur (budget ou temps), ou cochez « Je ne sais pas du tout estimer l’effort ».", { duration: 10000 });
        return false;
      }
      if (!effortConfidence) {
        toast.error("Merci d’indiquer votre niveau de confiance dans cette estimation.", { duration: 10000 });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

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
          effortScope,
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

      // Nettoyer le sessionStorage après soumission réussie
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("riceCookerProjectName");
      }
      
      router.push(
        `/resultat?score=${encodeURIComponent(
          data.scorePercent,
        )}&riskLevel=${encodeURIComponent(data.riskLevel)}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du calcul du score.",
        { duration: 10000 },
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
              Quel est le problème que vous cherchez à résoudre {projectName ? `avec ${projectName}` : ""} ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={problemClarity === "clear_problem"}
                    onChange={() => setProblemClarity("clear_problem")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      Je connais le problème que je cherche à résoudre et je l&apos;ai déjà formulé.
                    </span>
                    {problemClarity === "clear_problem" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
                        C&apos;est bien&nbsp;! Les problèmes sont le point de départ de toute
                        réflexion sur un produit.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={problemClarity === "solution_first"}
                    onChange={() => setProblemClarity("solution_first")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai une idée de solution, mais je n&apos;ai pas de problème spécifique à
                      résoudre.
                    </span>
                    {problemClarity === "solution_first" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
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
              Quelle démarche avez-vous eue pour démontrer l&apos;existence du problème {projectName ? `pour ${projectName}` : ""} ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={problemApproach === "conviction_only"}
                    onChange={() => setProblemApproach("conviction_only")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai la conviction que ce problème existe, mais je n&apos;ai pas cherché à le démontrer.
                    </span>
                    {problemApproach === "conviction_only" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
                        Il est préférable d&apos;effectuer des sessions de recherche pour déterminer si le
                        problème est réel ou s&apos;il n&apos;est pas juste l&apos;expression de vos convictions.
                      </span>
                    )}
                  </span>
                </label>
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={problemApproach === "informal_discussions"}
                    onChange={() => setProblemApproach("informal_discussions")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai interrogé mes proches et sondé des connaissances lors d&apos;échanges plutôt informels (dîner, discussion, etc.).
                    </span>
                    {problemApproach === "informal_discussions" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
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
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={problemApproach === "structured_interviews"}
                    onChange={() => setProblemApproach("structured_interviews")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai utilisé une méthode d&apos;interview sur un panel de personnes concernées par le problème.
                    </span>
                    {problemApproach === "structured_interviews" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
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
              Avez-vous réussi à savoir si le problème identifié {projectName ? `pour ${projectName}` : ""} n&apos;était pas la conséquence d&apos;un problème plus profond ?
            </h1>
            <fieldset className="space-y-3">
              <div className="space-y-2">
                <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                  <input
                    type="radio"
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={interviewDepth === "listened_only"}
                    onChange={() => setInterviewDepth("listened_only")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai écouté et pris note des réponses de mon interlocuteur.
                    </span>
                    {interviewDepth === "listened_only" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
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
                    className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                    checked={interviewDepth === "dug_deeper"}
                    onChange={() => setInterviewDepth("dug_deeper")}
                  />
                  <span className="flex-1">
                    <span className="block text-base font-semibold">
                      J&apos;ai cherché à creuser le problème en interrogeant plusieurs fois mon interlocuteur sur le même sujet d&apos;une manière différente (question reformulée, prise de recul, décentrage du regard, etc.).
                    </span>
                    {interviewDepth === "dug_deeper" && (
                      <span className="mt-0.5 block text-sm font-medium text-zinc-600">
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
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Que sont prêts à payer les gens qui ont ce problème {projectName ? `avec ${projectName}` : ""} ?
              </h1>
            </div>
            <div className="space-y-8">
              <fieldset className="space-y-3">
                <p className="text-sm font-bold text-zinc-900">
                  Si ce problème est résolu {projectName ? `avec ${projectName}` : ""}, à quel point les utilisateurs seront prêts à investir
                  du temps ou de l&apos;argent pour le résoudre ?
                </p>
                <div className="space-y-2 text-sm text-zinc-800">
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={valueExpectations === "ux_better"}
                      onChange={() => setValueExpectations("ux_better")}
                    />
                    <span className="flex-1">L&apos;expérience utilisateur sera meilleure.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={valueExpectations === "time_saved"}
                      onChange={() => setValueExpectations("time_saved")}
                    />
                    <span className="flex-1">Les utilisateurs gagneront du temps.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
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
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={valueExpectations === "game_changer"}
                      onChange={() => setValueExpectations("game_changer")}
                    />
                    <span className="flex-1">C&apos;est game changer pour le business de mes utilisateurs.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={valueExpectations === "dont_know_value"}
                      onChange={() => setValueExpectations("dont_know_value")}
                    />
                    <span className="flex-1">Je ne sais pas.</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <p className="text-sm font-bold text-zinc-900">
                  Est-il possible aujourd&apos;hui de résoudre ce problème {projectName ? `avec ${projectName}` : ""}, même de manière
                  dégradée (concurrent, hack, etc.) ?
                </p>
                <div className="space-y-2 text-sm text-zinc-800">
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={alternativeSolutions === "all_can_solve"}
                      onChange={() => setAlternativeSolutions("all_can_solve")}
                    />
                    <span className="flex-1">Oui, tous mes utilisateurs font ça.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
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
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                      checked={alternativeSolutions === "no_alternative"}
                      onChange={() => setAlternativeSolutions("no_alternative")}
                    />
                    <span className="flex-1">Non, ce problème n&apos;a pas vraiment d&apos;alternative.</span>
                  </label>
                  <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-3 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                    <input
                      type="radio"
                      className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
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
              Qui rencontre ce problème {projectName ? `avec ${projectName}` : ""} ?
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
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
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
                Quel impact {projectName || "la solution"} aura chez ces utilisateurs ?
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
                  impactSlider: 25,
                  evidence: [],
                  countMet: "" as PersonaCountMet,
                };

                const toggleEvidence = (evidence: PersonaImpactEvidence) => {
                  setPersonaImpacts((prev) => {
                    const current = prev[index] || {
                      impactSlider: 25,
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
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-800">
                          À quel point {persona.name || `Persona ${index + 1}`} sera impacté si ce problème est résolu ?
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            {
                              value: 25,
                              label: "Faible",
                              color: "bg-red-500",
                              borderColor: "border-red-500",
                              hoverColor: "hover:bg-red-50",
                              tooltip: {
                                title: "🔴 Faible",
                                content: "Le problème existe, mais il n'a que peu d'effet concret sur le quotidien de l'utilisateur.",
                                example: "La solution améliore légèrement le confort ou l'ergonomie, sans changer la façon de travailler.",
                                situation: '"C\'est un peu pénible, mais on peut très bien continuer comme ça."',
                              },
                            },
                            {
                              value: 50,
                              label: "Moyen",
                              color: "bg-yellow-500",
                              borderColor: "border-yellow-500",
                              hoverColor: "hover:bg-yellow-50",
                              tooltip: {
                                title: "🟡 Moyen",
                                content: "Le problème gêne régulièrement l'utilisateur, mais il est contournable.",
                                example: "La solution fait gagner du temps ou réduit de la friction, sans être prioritaire.",
                                situation: '"On perd du temps, mais on a trouvé des astuces pour faire avec."',
                              },
                            },
                            {
                              value: 75,
                              label: "Fort",
                              color: "bg-green-500",
                              borderColor: "border-green-500",
                              hoverColor: "hover:bg-green-50",
                              tooltip: {
                                title: "🟢 Fort",
                                content: "Le problème impacte clairement la performance ou la qualité du travail.",
                                example: "La solution réduit des erreurs, des frictions importantes ou un coût opérationnel.",
                                situation: '"Si une bonne solution existait, on l\'utiliserait rapidement."',
                              },
                            },
                            {
                              value: 100,
                              label: "Critique",
                              color: "bg-blue-500",
                              borderColor: "border-blue-500",
                              hoverColor: "hover:bg-blue-50",
                              tooltip: {
                                title: "🔵 Critique",
                                content: "Le problème bloque l'activité ou met en risque des enjeux majeurs.",
                                example: "La solution est nécessaire pour continuer à opérer ou se développer.",
                                situation: '"Sans solution, on ne peut pas continuer dans ces conditions."',
                              },
                            },
                          ].map((level) => {
                            const isSelected = impactData.impactSlider === level.value;
                            const tooltipKey = `${index}-${level.value}`;
                            const showTooltip = visibleTooltips.has(tooltipKey);

                            return (
                              <div key={level.value} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPersonaImpacts((prev) => ({
                                      ...prev,
                                      [index]: {
                                        ...prev[index],
                                        impactSlider: level.value,
                                        evidence: prev[index]?.evidence || [],
                                        countMet: prev[index]?.countMet || ("" as PersonaCountMet),
                                      },
                                    }));
                                  }}
                                  onMouseEnter={() => {
                                    setVisibleTooltips((prev) => new Set(prev).add(tooltipKey));
                                  }}
                                  onMouseLeave={() => {
                                    setVisibleTooltips((prev) => {
                                      const next = new Set(prev);
                                      next.delete(tooltipKey);
                                      return next;
                                    });
                                  }}
                                  className={`w-full rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                                    isSelected
                                      ? `${level.borderColor} ${level.color} text-white shadow-md`
                                      : `border-zinc-300 bg-white text-zinc-800 ${level.hoverColor} hover:border-zinc-400 hover:shadow-sm`
                                  }`}
                                >
                                  {level.label}
                                </button>
                                
                                {/* Tooltip */}
                                {showTooltip && (
                                  <div className={`absolute left-1/2 z-50 w-80 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl ${
                                    level.value >= 75 
                                      ? "bottom-full mb-2" 
                                      : "top-full mt-2"
                                  }`}>
                                    <div className="space-y-2 text-sm">
                                      <div className="font-semibold text-zinc-900">
                                        {level.tooltip.title}
                                      </div>
                                      <div className="text-zinc-700">
                                        {level.tooltip.content}
                                      </div>
                                      <div className="text-zinc-600">
                                        <span className="font-medium">Exemple :</span> {level.tooltip.example}
                                      </div>
                                      <div className="text-zinc-600 italic">
                                        <span className="font-medium">Situation :</span> {level.tooltip.situation}
                                      </div>
                                    </div>
                                    {/* Flèche du tooltip */}
                                    <div className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white ${
                                      level.value >= 75 
                                        ? "-bottom-2" 
                                        : "-top-2"
                                    }`} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-800">
                          Pour preuve, vous avez
                        </label>
                        
                        <div className="space-y-2 text-sm text-zinc-800">
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
                                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
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
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-800">
                          Combien de {persona.name || `Persona ${index + 1}`} avez-vous rencontré ?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500 has-[:checked]:text-zinc-50">
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
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500 has-[:checked]:text-zinc-50">
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
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500 has-[:checked]:text-zinc-50">
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
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500 has-[:checked]:text-zinc-50">
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
        const effortFilledPersonas = personas.filter((p) => p.name.trim());

        // Fonction helper pour déterminer l'état d'une brique selon le périmètre
        // Cette fonction doit être identique à celle du useEffect pour garantir la cohérence
        const getBrickStatus = (brickId: FunctionalBrick): {
          visible: boolean;
          selectable: boolean;
          disabled: boolean;
          warning?: string;
        } => {
          if (!effortScope) {
            return { visible: true, selectable: true, disabled: false };
          }

          if (effortScope === "mvp") {
            // MVP : certaines briques sont masquées (non visibles)
            // Selon les spécifications :
            // - Application web simple : ✅ affichée et sélectionnable
            // - Gestion des comptes utilisateurs : ⛔️ optionnelle, affichée mais décochée par défaut
            // - Moteur de calcul simple : ✅ affichée et sélectionnable
            // - Recherche avancée : ⛔️ masquée
            // - Matching / recommandation : ⛔️ masquée
            // - Géolocalisation : ⛔️ masquée
            // - Notifications : ⛔️ masquée
            // - Streaming / temps réel : ⛔️ masquée
            // - Upload de fichiers lourds : ⛔️ masquée
            // - Scalabilité : ⛔️ masquée
            // - Sécurité renforcée : ⛔️ masquée
            // - RGPD avancé : ⛔️ masquée
            // - Moteur de calcul complexe : ⛔️ masquée (non mentionné dans les spécifications)
            // - Multi-organisations : ⛔️ masquée (non mentionnée dans les spécifications MVP)
            const hiddenBricks: FunctionalBrick[] = [
              "search_advanced",      // Recherche avancée
              "matching",              // Matching / recommandation
              "geoloc_simple",         // Géolocalisation
              "notifications",         // Notifications
              "streaming",             // Streaming / temps réel
              "file_upload",           // Upload de fichiers lourds
              "scalability",           // Scalabilité
              "security_enhanced",     // Sécurité renforcée
              "rgpd_advanced",         // RGPD avancé
              "calc_complex",          // Moteur de calcul complexe
              "multi_org",             // Multi-organisations (non mentionnée, donc masquée)
            ];
            
            if (hiddenBricks.includes(brickId)) {
              // Ces briques sont désactivées (grisées) et ne doivent pas être sélectionnables
              // Elles restent visibles mais sont non cliquables, comme pour V1
              return { visible: true, selectable: false, disabled: true };
            }
            
            // user_accounts est optionnelle (affichée mais décochée par défaut)
            // Elle reste visible et sélectionnable, mais sera décochée par le useEffect si sélectionnée
            if (brickId === "user_accounts") {
              return { visible: true, selectable: true, disabled: false };
            }
            
            // Toutes les autres briques sont visibles et sélectionnables :
            // - web_app_simple (Application web simple)
            // - search_simple (Recherche simple - non mentionnée mais probablement OK)
            // - calc_simple (Moteur de calcul simple)
            // - export_data (Export de données - non mentionnée mais probablement OK)
            return { visible: true, selectable: true, disabled: false };
          }

          if (effortScope === "v1") {
            // V1 : certaines briques sont grisées/désactivées
            const disabledBricks: FunctionalBrick[] = [
              "multi_org",
              "calc_complex",
              "matching",
              "streaming",
              "scalability",
              "rgpd_advanced",
            ];
            
            if (disabledBricks.includes(brickId)) {
              return {
                visible: true,
                selectable: false,
                disabled: true,
              };
            }
            
            return { visible: true, selectable: true, disabled: false };
          }

          // Vision complète : toutes les briques sont disponibles
          return { visible: true, selectable: true, disabled: false };
        };

        return (
          <section className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Évaluez l&apos;effort que {projectName || "votre solution"} requiert
              </h1>
              <p className="text-sm text-zinc-700">
                Indiquez l&apos;effort et votre degré de confiance dans celui-ci.
              </p>
            </div>

            <div className="space-y-6">
              {/* Question sur le périmètre */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-zinc-900">
                    Votre estimation concerne :
                  </h2>
                  <p className="text-xs text-zinc-600">
                    Cette question permet de cadrer le périmètre sur lequel vous estimez l&apos;effort.
                    Un même projet peut avoir des niveaux d&apos;effort très différents selon l&apos;ambition visée.
                  </p>
                </div>
                
                <fieldset className="space-y-3">
                  {[
                    {
                      value: "mvp",
                      label: "MVP (Minimum Viable Product)",
                      tooltip: {
                        title: "Choix 1 — MVP (Minimum Viable Product)",
                        description: "Un MVP est une version minimale de votre produit, conçue pour tester une hypothèse clé (problème, usage ou valeur) avec un effort réduit.",
                        details: "Il ne vise ni l'exhaustivité, ni la robustesse long terme, mais l'apprentissage rapide.",
                        examples: [
                          "Process manuel derrière une interface simple",
                          "Fonctionnalités limitées à un seul cas d'usage",
                          "Peu ou pas d'automatisation",
                        ],
                        intention: "👉 Apprendre si le problème vaut la peine d'être résolu.",
                      },
                    },
                    {
                      value: "v1",
                      label: "V1 (Produit utilisable)",
                      tooltip: {
                        title: "Choix 2 — V1 (Produit utilisable)",
                        description: "Une V1 est une première version exploitable par de vrais utilisateurs.",
                        details: "Elle couvre le cœur de la valeur, avec un niveau de qualité suffisant pour un usage réel, mais sans toutes les fonctionnalités envisagées à terme.",
                        examples: [
                          "Parcours utilisateur complet mais simplifié",
                          "Quelques automatisations clés",
                          "Gestion basique des erreurs et des cas limites",
                        ],
                        intention: "👉 Commencer à délivrer de la valeur de manière fiable.",
                      },
                    },
                    {
                      value: "vision_complete",
                      label: "Vision complète",
                      tooltip: {
                        title: "Choix 3 — Vision complète",
                        description: "La vision complète correspond au produit tel que vous l'imaginez à terme :",
                        details: "fonctionnalités avancées, cas complexes, performance, sécurité, scalabilité, conformité.",
                        examples: [
                          "Plateforme multi-utilisateurs mature",
                          "Fonctionnalités avancées et automatisées",
                          "Exigences fortes en sécurité, performance et conformité",
                        ],
                        intention: "👉 Construire un produit durable et industrialisable.",
                      },
                    },
                  ].map((option) => {
                    const tooltipKey = `scope-${option.value}`;
                    const showTooltip = visibleTooltips.has(tooltipKey);
                    
                    return (
                      <div key={option.value} className="relative">
                        <label className="group flex cursor-pointer items-start gap-3 rounded-lg border-2 border-zinc-200 bg-white p-4 text-sm text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm">
                          <input
                            type="radio"
                            className="mt-0.5 h-5 w-5 cursor-pointer border-2 border-zinc-300 text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 checked:border-blue-500 checked:bg-blue-500 hover:border-zinc-500"
                            checked={effortScope === option.value}
                            onChange={() => setEffortScope(option.value as EffortScope)}
                          />
                          <span className="flex-1">
                            <span className="block text-base font-semibold">{option.label}</span>
                            <button
                              type="button"
                              className="mt-1 text-xs text-zinc-600 underline hover:text-zinc-900"
                              onMouseEnter={() => {
                                setVisibleTooltips((prev) => new Set(prev).add(tooltipKey));
                              }}
                              onMouseLeave={() => {
                                setVisibleTooltips((prev) => {
                                  const next = new Set(prev);
                                  next.delete(tooltipKey);
                                  return next;
                                });
                              }}
                            >
                              En savoir plus
                            </button>
                          </span>
                        </label>
                        
                        {/* Tooltip */}
                        {showTooltip && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-96 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl">
                            <div className="space-y-3 text-sm">
                              <div className="font-semibold text-zinc-900">
                                {option.tooltip.title}
                              </div>
                              <div className="text-zinc-700">
                                {option.tooltip.description}
                              </div>
                              <div className="text-zinc-600">
                                {option.tooltip.details}
                              </div>
                              <div>
                                <div className="mb-1 font-medium text-zinc-800">Exemples concrets :</div>
                                <ul className="list-disc space-y-1 pl-5 text-zinc-600">
                                  {option.tooltip.examples.map((ex, i) => (
                                    <li key={i}>{ex}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="font-medium text-zinc-800">
                                {option.tooltip.intention}
                              </div>
                            </div>
                            {/* Flèche du tooltip */}
                            <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-zinc-200 bg-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </fieldset>
              </div>

              {/* Sélection des briques fonctionnelles et sections suivantes */}
              {effortScope && (
                <>
              <div>
                <h2 className="mb-3 text-base font-semibold text-zinc-900">
                  Sélectionnez les briques fonctionnelles que votre solution nécessite.
                </h2>
                <p className="mb-4 text-xs text-zinc-600">
                  Chaque choix augmente l&apos;effort de conception, de développement et de maintenance. Les
                  montants indiqués sont des ordres de grandeur observés sur des projets numériques standards.
                  Ils servent à estimer le niveau de risque, pas à produire un devis.
                </p>

                <div className="space-y-6" key={`bricks-${effortScope}`}>
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
                      ].map((brick) => {
                        const brickId = brick.id as FunctionalBrick;
                        // Forcer l'utilisation de la valeur actuelle de effortScope
                        const currentScope = effortScope;
                        const status = getBrickStatus(brickId);
                        
                        // Les briques désactivées sont maintenant visibles mais grisées (comme pour V1)
                        // if (!status.visible) return null; // Plus besoin de masquer, on désactive
                        
                        const isSelected = selectedBricks.includes(brickId);
                        const isDisabled = status.disabled || !status.selectable;
                        
                        return (
                          <label
                            key={brick.id}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                              isDisabled
                                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-800 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={isSelected && !isDisabled}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked && !isDisabled) {
                                  setSelectedBricks((prev) => [...prev, brickId]);
                                } else if (!isDisabled) {
                                  setSelectedBricks((prev) => prev.filter((b) => b !== brickId));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{brick.label}</div>
                              <div className="text-xs text-zinc-600">{brick.cost}</div>
                            </div>
                          </label>
                        );
                      })}
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
                      ].map((brick) => {
                        const brickId = brick.id as FunctionalBrick;
                        // Forcer l'utilisation de la valeur actuelle de effortScope
                        const currentScope = effortScope;
                        const status = getBrickStatus(brickId);
                        
                        // Les briques désactivées sont maintenant visibles mais grisées (comme pour V1)
                        // if (!status.visible) return null; // Plus besoin de masquer, on désactive
                        
                        const isSelected = selectedBricks.includes(brickId);
                        const isDisabled = status.disabled || !status.selectable;
                        
                        return (
                          <label
                            key={brick.id}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                              isDisabled
                                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-800 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={isSelected && !isDisabled}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked && !isDisabled) {
                                  setSelectedBricks((prev) => [...prev, brickId]);
                                } else if (!isDisabled) {
                                  setSelectedBricks((prev) => prev.filter((b) => b !== brickId));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{brick.label}</div>
                              <div className="text-xs text-zinc-600">{brick.cost}</div>
                            </div>
                          </label>
                        );
                      })}
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
                      ].map((brick) => {
                        const brickId = brick.id as FunctionalBrick;
                        // Forcer l'utilisation de la valeur actuelle de effortScope
                        const currentScope = effortScope;
                        const status = getBrickStatus(brickId);
                        
                        // Les briques désactivées sont maintenant visibles mais grisées (comme pour V1)
                        // if (!status.visible) return null; // Plus besoin de masquer, on désactive
                        
                        const isSelected = selectedBricks.includes(brickId);
                        const isDisabled = status.disabled || !status.selectable;
                        
                        return (
                          <label
                            key={brick.id}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                              isDisabled
                                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-800 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={isSelected && !isDisabled}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked && !isDisabled) {
                                  setSelectedBricks((prev) => [...prev, brickId]);
                                } else if (!isDisabled) {
                                  setSelectedBricks((prev) => prev.filter((b) => b !== brickId));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{brick.label}</div>
                              <div className="text-xs text-zinc-600">{brick.cost}</div>
                            </div>
                          </label>
                        );
                      })}
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
                      ].map((brick) => {
                        const brickId = brick.id as FunctionalBrick;
                        // Forcer l'utilisation de la valeur actuelle de effortScope
                        const currentScope = effortScope;
                        const status = getBrickStatus(brickId);
                        
                        // Les briques désactivées sont maintenant visibles mais grisées (comme pour V1)
                        // if (!status.visible) return null; // Plus besoin de masquer, on désactive
                        
                        const isSelected = selectedBricks.includes(brickId);
                        const isDisabled = status.disabled || !status.selectable;
                        
                        return (
                          <label
                            key={brick.id}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                              isDisabled
                                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-800 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={isSelected && !isDisabled}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked && !isDisabled) {
                                  setSelectedBricks((prev) => [...prev, brickId]);
                                } else if (!isDisabled) {
                                  setSelectedBricks((prev) => prev.filter((b) => b !== brickId));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{brick.label}</div>
                              <div className="text-xs text-zinc-600">{brick.cost}</div>
                            </div>
                          </label>
                        );
                      })}
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
                      ].map((brick) => {
                        const brickId = brick.id as FunctionalBrick;
                        // Forcer l'utilisation de la valeur actuelle de effortScope
                        const currentScope = effortScope;
                        const status = getBrickStatus(brickId);
                        
                        // Les briques désactivées sont maintenant visibles mais grisées (comme pour V1)
                        // if (!status.visible) return null; // Plus besoin de masquer, on désactive
                        
                        const isSelected = selectedBricks.includes(brickId);
                        const isDisabled = status.disabled || !status.selectable;
                        
                        return (
                          <label
                            key={brick.id}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-sm transition ${
                              isDisabled
                                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-800 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={isSelected && !isDisabled}
                              disabled={isDisabled}
                              onChange={(e) => {
                                if (e.target.checked && !isDisabled) {
                                  setSelectedBricks((prev) => [...prev, brickId]);
                                } else if (!isDisabled) {
                                  setSelectedBricks((prev) => prev.filter((b) => b !== brickId));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{brick.label}</div>
                              <div className="text-xs text-zinc-600">{brick.cost}</div>
                            </div>
                          </label>
                        );
                      })}
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
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
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
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
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
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
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
                        className="absolute top-0 h-2 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
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
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez une option</option>
                  <option value="very_uncertain">Très incertain</option>
                  <option value="rather_uncertain">Plutôt incertain</option>
                  <option value="rather_sure">Plutôt sûr</option>
                  <option value="very_sure">Très sûr</option>
                </select>
              </div>
                </>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const handleQuit = () => {
    // Nettoyer le sessionStorage et réinitialiser tous les états
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("riceCookerProjectName");
    }
    // Réinitialiser tous les états
    setProjectName("");
    setProjectNameDraft("");
    setCurrentStepIndex(0);
    setProblemClarity("");
    setProblemApproach("");
    setInterviewDepth("");
    setValueExpectations("");
    setAlternativeSolutions("");
    setPersonas([{ name: "", confidence: "" }]);
    setPersonaImpacts({});
    setSelectedBricks([]);
    setBudgetMin(0);
    setBudgetMax(100);
    setTimeMin(0);
    setTimeMax(100);
    setEffortConfidence("");
    setNoEffortEstimate(false);
    setEffortScope("");
    router.push("/");
  };

  const confirmProjectName = () => {
    const name = projectNameDraft.trim();
    if (name.length < 2) {
      toast.error("Merci d’indiquer un nom de projet (au moins 2 caractères).", { duration: 10000 });
      return;
    }
    setProjectName(name);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("riceCookerProjectName", name);
    }
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Modale: nom du projet (obligatoire) */}
      {!projectName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl md:p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Démarrage
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                Donnez un nom à votre projet
              </h2>
              <p className="text-sm text-zinc-600">
                Ce nom sera réutilisé dans le questionnaire et dans le brief de fin.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectNameDraft}
                onChange={(e) => setProjectNameDraft(e.target.value)}
                placeholder="Ex. « PRICE COOKER », « Mon appli de gestion », etc."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleQuit}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmProjectName}
                className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-blue-600"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex min-h-screen flex-col"
      >
        {/* Top bar (header + stepper) - Fixed */}
        <div className="fixed left-0 right-0 top-0 z-50 w-full border-b border-zinc-200 bg-white">
          <header className="w-full">
            <div className="flex w-full items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-6">
              <p className="text-base font-medium text-zinc-900">
                Évaluation de {projectName || "votre projet"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuit}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              Quitter
            </button>
          </div>
        </header>

          {/* Stepper - Full width : chaque label au-dessus de son point, centré */}
          <div className="w-full bg-white pb-6 pt-4">
          <div className="w-full px-4 md:px-6 lg:px-8">
            {/* Ligne des labels : colonnes égales, texte centré */}
            <div className="mb-2 flex w-full gap-0">
              {steps.map((stepId, index) => {
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;
                return (
                  <div
                    key={stepId}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end px-1"
                  >
                    <span
                      className={`hidden block w-full text-center text-xs leading-tight lg:inline ${
                        isActive
                          ? "font-semibold text-zinc-900"
                          : isPast
                            ? "font-medium text-zinc-600"
                            : "font-normal text-zinc-400"
                      }`}
                    >
                      {stepLabel(stepId)}
                    </span>
                    <span className="block w-full text-center text-xs font-medium text-zinc-500 lg:hidden">
                      {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Piste + points : barre du point Problème au point Effort estimé */}
            <div className="relative flex w-full items-center">
              {/* Piste grise : du centre du 1er point au centre du dernier */}
              <div
                className="absolute h-1 rounded-full bg-zinc-200"
                style={{
                  left: `${(0.5 / totalSteps) * 100}%`,
                  width: `${((totalSteps - 1) / totalSteps) * 100}%`,
                }}
              />
              {/* Barre bleue : du centre Problème au centre de l'étape courante */}
              <div
                className="absolute h-1 rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  left: `${(0.5 / totalSteps) * 100}%`,
                  width:
                    currentStepIndex === totalSteps - 1
                      ? `${((totalSteps - 1) / totalSteps) * 100}%`
                      : `${(currentStepIndex / totalSteps) * 100}%`,
                }}
              />
              <div className="relative z-10 flex w-full gap-0">
                {steps.map((stepId, index) => {
                  const isPastOrCurrent = index <= currentStepIndex;
                  return (
                    <div
                      key={stepId}
                      className="flex min-w-0 flex-1 justify-center"
                    >
                      <div
                        className={`h-3 w-3 shrink-0 rounded-full border-2 transition-all ${
                          isPastOrCurrent
                            ? "border-blue-500 bg-white"
                            : "border-zinc-300 bg-white"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Main content - Centered, padding pour ne pas passer sous les barres fixes */}
        <div className="flex-1 overflow-auto pt-44 pb-24 md:pt-48 md:pb-28">
          <div className="px-4 py-6 md:px-8 md:py-8">
            <main className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-6">
                {renderStep()}
            </main>

          </div>
        </div>

        {/* Bottom bar - Fixed */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-zinc-200 bg-white">
          <div className="flex w-full items-center justify-between px-4 py-4 md:px-8">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentStepIndex === 0}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Précédent
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)}
                className="rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
              >
                Voir mon résultat
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextClick}
                className="rounded-full bg-blue-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
              >
                Suivant
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
}


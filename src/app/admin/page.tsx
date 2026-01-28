"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { computePriceScore } from "@/scoring/price";
import { getMaxScores } from "@/scoring/max-scores";

type ScoringConfig = {
  problem: {
    clarity: Record<string, number>;
    approach: Record<string, number>;
    depth: Record<string, number>;
    alternatives: Record<string, number>;
    weights: {
      clarity: number;
      approach: number;
      depth: number;
      alternatives: number;
    };
  };
  reach: {
    credibility: Record<string, number>;
    nFactor: Record<string, number>;
  };
  impact: {
    valueExpectations: Record<string, number>;
    weights: {
      impactWeighted: number;
      valueFactor: number;
    };
  };
  confidence: {
    evidenceWeights: Record<string, number>;
    countMet: Record<string, number>;
    discoveryBonus: number;
  };
  effort: {
    budgetFactor: Record<string, number>;
    timeAddon: Record<string, number>;
    brickCoeffs: Record<string, number>;
    brickComplexityDivisor: number;
    brickComplexityMax: number;
    confidenceMult: Record<string, number>;
    noEstimatePenalty: number;
  };
  bounds: {
    P: { min: number; max: number };
    R: { min: number; max: number };
    I: { min: number; max: number };
    C: { min: number; max: number };
    E: { min: number; max: number };
  };
  banding: {
    high_risk: { max: number };
    medium_risk: { max: number };
    low_risk: { max: number };
  };
};

type TestProject = "high_risk" | "medium_risk" | "low_risk" | null;

// Projets de test
const testProjects = {
  high_risk: {
    name: "Projet à risque élevé",
    description: "Problème peu clair, peu de preuves, effort élevé",
    data: {
      problemClarity: "solution_first" as const,
      problemApproach: "conviction_only" as const,
      interviewDepth: "" as const,
      valueExpectations: "dont_know_value" as const,
      alternativeSolutions: "all_can_solve" as const,
      personas: [
        { name: "Utilisateur supposé", confidence: "assumed" as const },
      ],
      personaImpacts: {
        0: {
          impactSlider: 40,
          evidence: ["heard_people_say"],
          countMet: "1_seul" as const,
        },
      },
      selectedBricks: ["web_app_simple", "multi_org", "calc_complex", "streaming"] as const,
      budgetMin: 50,
      budgetMax: 80,
      timeMin: 90,
      timeMax: 150,
      effortConfidence: "very_uncertain" as const,
      noEffortEstimate: false,
    },
  },
  medium_risk: {
    name: "Projet à risque modéré",
    description: "Problème clair mais peu de preuves, effort modéré",
    data: {
      problemClarity: "clear_problem" as const,
      problemApproach: "informal_discussions" as const,
      interviewDepth: "" as const,
      valueExpectations: "time_saved" as const,
      alternativeSolutions: "some_cannot" as const,
      personas: [
        { name: "Utilisateur rencontré", confidence: "met" as const },
        { name: "Utilisateur interviewé", confidence: "interviewed" as const },
      ],
      personaImpacts: {
        0: {
          impactSlider: 65,
          evidence: ["interviews_with_persona", "tested_myself"],
          countMet: "2_5" as const,
        },
        1: {
          impactSlider: 70,
          evidence: ["interviews_with_persona"],
          countMet: "2_5" as const,
        },
      },
      selectedBricks: ["web_app_simple", "user_accounts", "search_simple"] as const,
      budgetMin: 20,
      budgetMax: 35,
      timeMin: 45,
      timeMax: 75,
      effortConfidence: "rather_uncertain" as const,
      noEffortEstimate: false,
    },
  },
  low_risk: {
    name: "Projet à faible risque",
    description: "Problème très clair, nombreuses preuves, effort maîtrisé",
    data: {
      problemClarity: "clear_problem" as const,
      problemApproach: "structured_interviews" as const,
      interviewDepth: "dug_deeper" as const,
      valueExpectations: "game_changer" as const,
      alternativeSolutions: "no_alternative" as const,
      personas: [
        { name: "Client existant", confidence: "clients" as const },
        { name: "Utilisateur interviewé", confidence: "interviewed" as const },
        { name: "Utilisateur rencontré", confidence: "met" as const },
      ],
      personaImpacts: {
        0: {
          impactSlider: 90,
          evidence: ["persona_certified_payment", "persona_certified_solution", "interviews_with_persona"],
          countMet: "plus_10" as const,
        },
        1: {
          impactSlider: 85,
          evidence: ["persona_certified_solution", "design_phase"],
          countMet: "5_10" as const,
        },
        2: {
          impactSlider: 80,
          evidence: ["interviews_with_persona", "tested_myself"],
          countMet: "2_5" as const,
        },
      },
      selectedBricks: ["web_app_simple", "user_accounts", "export_data"] as const,
      budgetMin: 8,
      budgetMax: 12,
      timeMin: 20,
      timeMax: 30,
      effortConfidence: "very_sure" as const,
      noEffortEstimate: false,
    },
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTestProject, setSelectedTestProject] = useState<TestProject>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testScore, setTestScore] = useState<{
    scoreTotal: number;
    band: string;
    subscores: { P: number; R: number; I: number; C: number; E: number };
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  // Calculer les max théoriques dynamiquement
  const maxScores = useMemo(() => {
    if (!config) return null;
    try {
      return getMaxScores();
    } catch (error) {
      console.error("Erreur calcul maxScores:", error);
      return null;
    }
  }, [config]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors du chargement de la configuration" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      setMessage({ type: "success", text: "Configuration sauvegardée avec succès" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  };

  const updateNestedValue = (path: string[], value: number) => {
    if (!config) return;
    const newConfig = { ...config };
    let current: any = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
  };

  const updateRecordValue = (path: string[], key: string, value: number) => {
    if (!config) return;
    const newConfig = { ...config };
    let current: any = newConfig;
    for (const p of path) {
      current = current[p];
    }
    current[key] = value;
    setConfig(newConfig);
  };

  useEffect(() => {
    if (!selectedTestProject || !config) {
      setTestScore(null);
      setTestLoading(false);
      return;
    }

    const calculateTestScore = async () => {
      setTestLoading(true);
      try {
        const testData = testProjects[selectedTestProject].data;
        const res = await fetch("/api/score/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testData,
            config, // Envoyer la config actuelle en mémoire
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setTestScore({
            scoreTotal: data.scorePercent,
            band: data.riskLevel,
            subscores: data.breakdown,
          });
        } else {
          const error = await res.json();
          console.error("Erreur API", error);
          setTestScore(null);
        }
      } catch (error) {
        console.error("Erreur calcul score test", error);
        setTestScore(null);
      } finally {
        setTestLoading(false);
      }
    };

    calculateTestScore();
  }, [selectedTestProject, config]);

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Configuration du moteur PRICE</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Modifiez les paramètres de calcul du score. Les changements prennent effet immédiatement.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </header>

        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Formule PRICE</h2>
          <div className="space-y-2 text-sm">
            <p className="font-mono text-lg">
              PRICE = 100 × (combinaison_hybride(P, R, I, C)^1.15) × (1 - pénalité_E)
            </p>
            <p className="text-zinc-300">
              Le score final utilise une combinaison hybride (70% moyenne arithmétique + 30% moyenne géométrique) 
              des 4 sous-scores positifs (P, R, I, C), élevée à la puissance 1.15 pour amplifier modérément les différences.
              Une pénalité E normalisée (jusqu'à 30%) réduit le score proportionnellement. 
              Le résultat est arrondi à 1 décimale et clampé entre 0 et 100.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-zinc-300">
              <li>• <strong>P (Problem)</strong> : Clarté et crédibilité du problème</li>
              <li>• <strong>R (Reach)</strong> : Crédibilité et représentativité des utilisateurs</li>
              <li>• <strong>I (Impact)</strong> : Impact attendu de la solution</li>
              <li>• <strong>C (Confidence)</strong> : Force des preuves accumulées</li>
              <li>• <strong>E (Effort)</strong> : Pénalité selon l'effort estimé (utilisé avec √E)</li>
            </ul>
          </div>
        </section>

        {/* Section de test en temps réel */}
        <section className="sticky top-4 z-10 mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">Test en temps réel</h2>
            <p className="text-sm text-zinc-600">
              Testez l&apos;impact de vos modifications de configuration sur trois types de projets types.
              Le score est recalculé automatiquement avec la configuration actuelle.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(testProjects).map(([key, project]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTestProject(key as TestProject)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedTestProject === key
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900">{project.name}</h3>
                  {selectedTestProject === key && (
                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                      Sélectionné
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-zinc-600">{project.description}</p>
                {selectedTestProject === key && testScore && (
                  <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-700">Score final :</span>
                      <span
                        className={`text-lg font-bold ${
                          testScore.scoreTotal <= 35
                            ? "text-red-600"
                            : testScore.scoreTotal <= 65
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {testScore.scoreTotal.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600">
                      <div className="grid grid-cols-5 gap-1">
                        <div>
                          <div className="font-medium">P</div>
                          <div className="text-zinc-500">{testScore.subscores.P.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">R</div>
                          <div className="text-zinc-500">{testScore.subscores.R.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">I</div>
                          <div className="text-zinc-500">{testScore.subscores.I.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">C</div>
                          <div className="text-zinc-500">{testScore.subscores.C.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">E</div>
                          <div className="text-zinc-500">{testScore.subscores.E.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      Niveau : <span className="font-medium text-zinc-700">{testScore.band}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {selectedTestProject && testLoading && (
            <div className="mt-4 text-center text-sm text-zinc-500">
              Calcul en cours...
            </div>
          )}
          {selectedTestProject && !testLoading && !testScore && (
            <div className="mt-4 text-center text-sm text-red-500">
              Erreur lors du calcul
            </div>
          )}
        </section>

        <div className="space-y-8">
          {/* Problem */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold">P — Problem</h2>
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium mb-2">Calcul du score P :</p>
                <p>
                  P = (clarity × {config.problem.weights.clarity}) + (approach × {config.problem.weights.approach}) + (depth × {config.problem.weights.depth}) + (alternatives × {config.problem.weights.alternatives})
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Le score P mesure la clarté et la crédibilité du problème identifié. Plus le problème est clairement formulé et validé par des entretiens structurés, plus le score est élevé.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">Clarity</h3>
                  <span className="text-xs text-zinc-500">
                    (Pondération: {config.problem.weights.clarity})
                  </span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Score selon la clarté du point de départ : clarté du problème vs. idée de solution sans problème clair.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.problem.clarity)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "clear_problem" && "Problème clair"}
                          {key === "solution_first" && "Solution d'abord"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["problem", "clarity"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">Approach</h3>
                  <span className="text-xs text-zinc-500">
                    (Pondération: {config.problem.weights.approach})
                  </span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Méthode utilisée pour démontrer l'existence du problème : entretiens structurés, discussions informelles, ou conviction seule.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(config.problem.approach)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "structured_interviews" && "Entretiens structurés"}
                          {key === "informal_discussions" && "Discussions informelles"}
                          {key === "conviction_only" && "Conviction seule"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["problem", "approach"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">Depth</h3>
                  <span className="text-xs text-zinc-500">
                    (Pondération: {config.problem.weights.depth})
                  </span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Profondeur des entretiens structurés : creuser le problème vs. écouter seulement. Utilisé uniquement si "Entretiens structurés" est sélectionné.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(config.problem.depth)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "dug_deeper" && "Creuser le problème"}
                          {key === "listened_only" && "Écouter seulement"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["problem", "depth"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">Alternatives</h3>
                  <span className="text-xs text-zinc-500">
                    (Pondération: {config.problem.weights.alternatives})
                  </span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Existence et capacité des alternatives à résoudre le problème.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(config.problem.alternatives)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "no_alternative" && "Aucune alternative"}
                          {key === "some_cannot" && "Certaines ne peuvent pas"}
                          {key === "all_can_solve" && "Toutes peuvent résoudre"}
                          {key === "dont_know_alt" && "Ne sais pas"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["problem", "alternatives"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Pondérations</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Poids de chaque composante dans le calcul final de P. La somme devrait idéalement être proche de 1.0.
                </p>
                <div className="grid gap-3 md:grid-cols-4">
                  {Object.entries(config.problem.weights).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "clarity" && "Clarté"}
                        {key === "approach" && "Approche"}
                        {key === "depth" && "Profondeur"}
                        {key === "alternatives" && "Alternatives"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["problem", "weights"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Reach */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold">R — Reach</h2>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-medium mb-2">Calcul du score R :</p>
                <p>
                  R = (moyenne des crédibilités des personas) × nFactor
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Le score R mesure la crédibilité et la représentativité des utilisateurs cibles. Plus les personas sont crédibles (clients &gt; interviewés &gt; rencontrés &gt; supposés) et nombreuses, plus le score est élevé.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Crédibilité</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Score de crédibilité selon le type de relation avec la persona : clients existants, personnes interviewées, rencontrées, ou supposées.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.reach.credibility)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "clients" && "Clients"}
                          {key === "interviewed" && "Interviewés"}
                          {key === "met" && "Rencontrés"}
                          {key === "assumed" && "Supposés"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["reach", "credibility"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">nFactor (par nombre de personas)</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Multiplicateur selon le nombre de personas définies. Plus il y a de personas, plus le score est élevé (meilleure couverture du problème).
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.reach.nFactor).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "0" && "0 persona"}
                        {key === "1" && "1 persona"}
                        {key === "2" && "2 personas"}
                        {key === "3" && "3 personas"}
                        {key === "4+" && "4+ personas"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["reach", "nFactor"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Impact */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold">I — Impact</h2>
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-medium mb-2">Calcul du score I :</p>
                <p>
                  I = (impactWeightedAvg × {config.impact.weights.impactWeighted}) + (valueFactor × {config.impact.weights.valueFactor})
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Le score I mesure l'impact attendu de la solution. Il combine l'impact perçu par les personas (pondéré par leur crédibilité) et le type de valeur apportée (game changer, nouvelle capacité, gain de temps, etc.).
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">Value Expectations</h3>
                  <span className="text-xs text-zinc-500">
                    (Pondération: {config.impact.weights.valueFactor})
                  </span>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Type de valeur apportée par la solution : changement de paradigme, nouvelle capacité, gain de temps, amélioration UX, ou inconnu.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.impact.valueExpectations)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "game_changer" && "Game changer"}
                          {key === "new_capability" && "Nouvelle capacité"}
                          {key === "time_saved" && "Gain de temps"}
                          {key === "ux_better" && "Meilleure UX"}
                          {key === "dont_know_value" && "Valeur inconnue"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(
                              ["impact", "valueExpectations"],
                              key,
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Pondérations</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Poids entre l'impact perçu par les personas (impactWeighted) et le type de valeur (valueFactor). La somme devrait être proche de 1.0.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(config.impact.weights).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "impactWeighted" && "Impact pondéré (personas)"}
                        {key === "valueFactor" && "Facteur valeur"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["impact", "weights"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Confidence */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold">C — Confidence</h2>
              <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-900">
                <p className="font-medium mb-2">Calcul du score C :</p>
                <p>
                  Pour chaque persona : C_persona = (somme des poids des preuves) × countFactor
                </p>
                <p>
                  C = moyenne des C_persona + bonus discovery (si entretiens structurés + profondeur)
                </p>
                <p className="mt-2 text-xs text-purple-700">
                  Le score C mesure la force des preuves accumulées. Plus il y a de preuves concrètes (paiements, certifications, tests, entretiens) et plus de personnes rencontrées, plus le score est élevé.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Evidence Weights</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Poids de chaque type de preuve. Les preuves sont cumulables (plafonnées à 1.0). Plus le poids est élevé, plus la preuve est forte.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.confidence.evidenceWeights).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "heard_people_say" && "Entendu dire"}
                        {key === "tested_myself" && "Testé moi-même"}
                        {key === "design_phase" && "Phase design"}
                        {key === "interviews_with_persona" && "Entretiens avec persona"}
                        {key === "persona_certified_solution" && "Solution certifiée"}
                        {key === "persona_certified_payment" && "Paiement certifié"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(
                            ["confidence", "evidenceWeights"],
                            key,
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Count Met</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Multiplicateur selon le nombre de personnes de ce type rencontrées. Plus il y a de personnes rencontrées, plus le score est élevé.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.confidence.countMet)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "1_seul" && "1 seul"}
                          {key === "2_5" && "2-5"}
                          {key === "5_10" && "5-10"}
                          {key === "plus_10" && "10+"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(["confidence", "countMet"], key, parseFloat(e.target.value))
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Discovery Bonus</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Bonus ajouté à C si la démarche inclut des entretiens structurés avec profondeur (creuser le problème).
                </p>
                <input
                  type="number"
                  step="0.01"
                  value={config.confidence.discoveryBonus}
                  onChange={(e) =>
                    updateNestedValue(["confidence", "discoveryBonus"], parseFloat(e.target.value))
                  }
                  className="w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Effort */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-xl font-semibold">E — Effort</h2>
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
                <p className="font-medium mb-2">Calcul du score E (pénalité) :</p>
                <p>
                  E = (budgetFactor + timeAddon) × brickComplexity × confidenceMult
                </p>
                <p className="mt-2 text-xs text-red-700">
                  Le score E est une pénalité : plus il est élevé, plus le risque augmente. Il combine le budget estimé, le temps, la complexité des briques fonctionnelles, et le niveau de confiance dans l'estimation. Si aucune estimation n'est fournie, E = noEstimatePenalty.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Budget Factor (k€)</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Facteur de pénalité selon le budget moyen estimé. Plus le budget est élevé, plus la pénalité est forte.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.effort.budgetFactor).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "<10" && "< 10 k€"}
                        {key === "10-20" && "10-20 k€"}
                        {key === "20-40" && "20-40 k€"}
                        {key === "40-80" && "40-80 k€"}
                        {key === "80+" && "80+ k€"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["effort", "budgetFactor"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Time Addon (jours)</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Additif de pénalité selon le temps moyen estimé. Plus le temps est long, plus la pénalité est forte.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.effort.timeAddon).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-sm text-zinc-600">
                        {key === "<15" && "< 15 jours"}
                        {key === "15-30" && "15-30 jours"}
                        {key === "30-60" && "30-60 jours"}
                        {key === "60-120" && "60-120 jours"}
                        {key === "120+" && "120+ jours"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["effort", "timeAddon"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Brick Coefficients</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Coefficient de complexité de chaque brique fonctionnelle. Plus le coefficient est élevé, plus la brique est complexe. La complexité totale = 1 + min(brickComplexityMax, somme_coeffs / brickComplexityDivisor).
                </p>
                <div className="grid gap-3 md:grid-cols-4">
                  {Object.entries(config.effort.brickCoeffs).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="flex-1 text-right text-xs text-zinc-600" title={key}>
                        {key.replace(/_/g, " ")}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) =>
                          updateRecordValue(["effort", "brickCoeffs"], key, parseFloat(e.target.value))
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Brick Complexity Divisor
                  </label>
                  <p className="mb-1 text-xs text-zinc-500">
                    Diviseur pour calculer la complexité totale à partir de la somme des coefficients.
                  </p>
                  <input
                    type="number"
                    step="1"
                    value={config.effort.brickComplexityDivisor}
                    onChange={(e) =>
                      updateNestedValue(
                        ["effort", "brickComplexityDivisor"],
                        parseFloat(e.target.value),
                      )
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Brick Complexity Max
                  </label>
                  <p className="mb-1 text-xs text-zinc-500">
                    Plafond pour la contribution de la complexité des briques (0.6 = +60% max).
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    value={config.effort.brickComplexityMax}
                    onChange={(e) =>
                      updateNestedValue(
                        ["effort", "brickComplexityMax"],
                        parseFloat(e.target.value),
                      )
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    No Estimate Penalty
                  </label>
                  <p className="mb-1 text-xs text-zinc-500">
                    Pénalité E appliquée si aucune estimation d'effort n'est fournie.
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    value={config.effort.noEstimatePenalty}
                    onChange={(e) =>
                      updateNestedValue(
                        ["effort", "noEstimatePenalty"],
                        parseFloat(e.target.value),
                      )
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Confidence Multiplier</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Multiplicateur selon le niveau de confiance dans l'estimation. Plus la confiance est faible, plus la pénalité est forte.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(config.effort.confidenceMult)
                    .filter(([key]) => key !== "default")
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-1 text-right text-sm text-zinc-600">
                          {key === "very_sure" && "Très sûr"}
                          {key === "rather_sure" && "Plutôt sûr"}
                          {key === "rather_uncertain" && "Plutôt incertain"}
                          {key === "very_uncertain" && "Très incertain"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) =>
                            updateRecordValue(
                              ["effort", "confidenceMult"],
                              key,
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* Bounds */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 space-y-2">
              <h2 className="text-xl font-semibold">Bornes (min/max)</h2>
              <p className="text-sm text-zinc-600">
                Valeurs min (éditable) et max théorique (calculé dynamiquement) pour chaque sous-score. Les scores calculés sont clampés dans ces bornes.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {Object.entries(config.bounds).map(([key, bounds]) => {
                const maxValue = maxScores && key !== "E" 
                  ? maxScores[key as "P" | "R" | "I" | "C"]
                  : key === "E" && maxScores
                  ? maxScores.E_max
                  : bounds.max;
                
                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">{key}</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={bounds.min}
                        onChange={(e) =>
                          updateNestedValue(
                            ["bounds", key, "min"],
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={maxValue}
                        disabled
                        className="w-20 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-500 cursor-not-allowed"
                        placeholder="Max"
                        title="Valeur calculée dynamiquement à partir des mappings et formules"
                      />
                    </div>
                    {key === "E" && maxScores && (
                      <p className="text-xs text-zinc-500">
                        Min théorique: {maxScores.E_min.toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Banding */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 space-y-2">
              <h2 className="text-xl font-semibold">Seuils de banding</h2>
              <p className="text-sm text-zinc-600">
                Seuils pour déterminer le niveau de risque (high_risk, medium_risk, low_risk) à partir du score total (0-100).
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(config.banding).map(([key, band]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700">
                    {key === "high_risk" && "Risque élevé"}
                    {key === "medium_risk" && "Risque modéré"}
                    {key === "low_risk" && "Risque maîtrisé"}
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={band.max}
                    onChange={(e) =>
                      updateNestedValue(["banding", key, "max"], parseInt(e.target.value))
                    }
                    className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                    placeholder="Max"
                  />
                  <p className="text-xs text-zinc-500">
                    Score ≤ {band.max}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

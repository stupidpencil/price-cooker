"use client";

import { ScoreGauge, TONE_COLORS } from "@/components/ScoreGauge";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState, Suspense } from "react";
import { getMaxScores } from "@/scoring/max-scores";

function getMessage(scorePercent: number, riskLevel: string): { title: string; tone: "red" | "amber" | "green" } {
  if (scorePercent <= 39) {
    return {
      title: "Aïe, votre idée est très risquée dans son état actuel.",
      tone: "red",
    };
  }
  if (scorePercent <= 69) {
    return {
      title: "Votre idée repose sur des bases intéressantes mais encore fragiles.",
      tone: "amber",
    };
  }
  return {
    title: "Vous avez posé des bases solides. Le risque est globalement maîtrisé.",
    tone: "green",
  };
}

function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [drivers, setDrivers] = useState<Array<{ key: string; label: string; severity: number }>>(
    [],
  );
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<{
    P?: number;
    R?: number;
    I?: number;
    C?: number;
    E?: number;
  }>({});
  const [showTooltip, setShowTooltip] = useState(false);

  const { scorePercent, riskLevel } = useMemo(() => {
    const rawScore = Number(searchParams.get("score") ?? "0");
    const rawLevel = searchParams.get("riskLevel") ?? "Risque modéré";
    const score = Number.isFinite(rawScore) ? Math.min(Math.max(rawScore, 0), 100) : 0;
    return { scorePercent: score, riskLevel: rawLevel };
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("riceCookerResult");
      if (stored) {
        try {
          const result = JSON.parse(stored);
          setDrivers(result.drivers || []);
          setRecommendations(result.recommendations || []);
          setBreakdown(result.breakdown || {});
        } catch (e) {
          console.error("Erreur parsing résultat", e);
        }
      }
    }
  }, []);

  const message = getMessage(scorePercent, riskLevel);

  const handleExport = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  const handleContact = () => {
    router.push("/contacter-un-pro");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10 print:px-0 print:py-4">
        <header className="flex items-center justify-between gap-4 print:hidden">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Résultat • RICE COOKER
            </p>
            <p className="text-sm text-zinc-600">
              Ce score mesure le risque de développement, pas la valeur de votre idée.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Revenir à l&apos;accueil
          </button>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="w-full">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
              Score de maîtrise du risque
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {message.title}
              {message.tone === "red" && " 😟"}
              {message.tone === "amber" && " 😐"}
              {message.tone === "green" && " 🙂"}
            </p>

            <div className="mt-6 w-full">
              <div className="flex flex-row flex-wrap items-center justify-center gap-4">
                <ScoreGauge scorePercent={scorePercent} tone={message.tone} />
                {(() => {
                  const c = TONE_COLORS[message.tone];
                  return (
                    <div
                      className="group relative w-fit"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <div
                        className="flex w-fit items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition"
                        style={{
                          backgroundColor: c.buttonBg,
                          borderColor: c.buttonBorder,
                          color: c.buttonText,
                        }}
                        role="status"
                        aria-label={riskLevel}
                      >
                        <span className="font-semibold">{riskLevel}</span>
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ backgroundColor: c.buttonBorder, color: "white" }}
                          aria-hidden
                        >
                          i
                        </span>
                      </div>
                      {showTooltip && (
                        <div
                          className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border-2 bg-white p-4 shadow-lg"
                          style={{ borderColor: c.buttonBorder }}
                          role="tooltip"
                        >
                          <h3 className="mb-2 text-sm font-semibold text-zinc-900">Comment lire ce résultat ?</h3>
                          <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-700">
                            <li>
                              Le score se concentre sur le <strong>risque de développement</strong> (problème,
                              reach, preuves, effort), pas sur le potentiel business.
                            </li>
                            <li>
                              Une <strong>maîtrise faible</strong> (score bas) ne veut pas dire que votre idée
                              est mauvaise, mais qu&apos;il reste beaucoup d&apos;inconnu.
                            </li>
                            <li>
                              L&apos;objectif est de vous aider à <strong>prioriser vos prochaines
                              actions</strong> avant d&apos;investir du temps et de l&apos;argent.
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Graphique PRICE */}
        {breakdown.P !== undefined && (
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Impact des dimensions PRICE sur votre score
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                Visualisation de ce qui valorise (P, R, I, C) et pénalise (E) votre score final
              </p>
            </div>
            <div className="space-y-4">
              {/* Dimensions positives */}
              <div className="space-y-3">
                {(() => {
                  // Calculer les scores max réellement atteignables dynamiquement
                  const maxScores = getMaxScores();
                  
                  return [
                    { key: "P", label: "Problem", value: breakdown.P, color: "amber", desc: "Clarté du problème", min: 0.2, max: maxScores.P },
                    { key: "R", label: "Reach", value: breakdown.R, color: "blue", desc: "Crédibilité des personas", min: 0.2, max: maxScores.R },
                    { key: "I", label: "Impact", value: breakdown.I, color: "emerald", desc: "Impact attendu", min: 0.2, max: maxScores.I },
                    { key: "C", label: "Confidence", value: breakdown.C, color: "purple", desc: "Force des preuves", min: 0.2, max: maxScores.C },
                  ].map((dim) => {
                    // Convertir la valeur en % (0-100) en utilisant le max réellement atteignable
                    // Cela reflète le potentiel réel de chaque dimension
                    const value = dim.value ?? dim.min;
                    const percentage = ((value - dim.min) / (dim.max - dim.min)) * 100;
                    const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));
                  
                  const colorClasses: Record<string, string> = {
                    amber: "bg-amber-500",
                    blue: "bg-blue-500",
                    emerald: "bg-emerald-500",
                    purple: "bg-purple-500",
                  };
                  const impact = clampedPercentage < 50 ? "Faible" : clampedPercentage < 70 ? "Moyen" : "Fort";
                  const impactColor = clampedPercentage < 50 ? "text-red-600" : clampedPercentage < 70 ? "text-amber-600" : "text-emerald-600";
                  return (
                    <div key={dim.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{dim.key}</span>
                          <span className="text-zinc-600">{dim.label}</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-500">{dim.desc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${impactColor}`}>{impact}</span>
                          <span className="font-medium text-zinc-700">
                            {clampedPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full ${colorClasses[dim.color] || "bg-zinc-500"} transition-all`}
                          style={{ width: `${clampedPercentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-700">
                          {clampedPercentage}%
                        </div>
                      </div>
                    </div>
                  );
                });
                })()}
              </div>

              {/* Dimension négative (Effort) */}
              {breakdown.E !== undefined && (() => {
                // Calculer E min (meilleur cas) et E max (pire cas) réellement atteignables
                const maxScores = getMaxScores();
                const E_min = maxScores.E_min; // Meilleur cas (min effort)
                const E_max = maxScores.E_max; // Pire cas (max effort)
                // Pour E, on inverse : plus E est élevé, plus le % est élevé (mais c'est mauvais)
                // E à min (meilleur) = 0% de pénalité, E à max (pire) = 100% de pénalité
                const penaltyPercentage = Math.round(((breakdown.E - E_min) / (E_max - E_min)) * 100);
                const clampedPenaltyPercentage = Math.max(0, Math.min(100, penaltyPercentage));
                
                return (
                  <div className="space-y-3 border-t border-zinc-200 pt-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">E</span>
                          <span className="text-zinc-600">Effort</span>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-500">Complexité et incertitude</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${clampedPenaltyPercentage > 70 ? "text-red-600" : clampedPenaltyPercentage > 40 ? "text-amber-600" : "text-emerald-600"}`}>
                            {clampedPenaltyPercentage > 70 ? "Élevé" : clampedPenaltyPercentage > 40 ? "Modéré" : "Maîtrisé"}
                          </span>
                          <span className="font-medium text-zinc-700">
                            {clampedPenaltyPercentage}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full bg-red-500 transition-all"
                          style={{ width: `${clampedPenaltyPercentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-700">
                          {clampedPenaltyPercentage}%
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Plus E est élevé, plus la pénalité appliquée au score est forte.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Formule de calcul */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
              <div>
                <p className="font-medium text-zinc-700 mb-1">Formule de calcul :</p>
                <p className="font-mono text-zinc-800">
                  Score = 100 × (combinaison_hybride(P, R, I, C)^1.15) × (1 - pénalité_E)
                </p>
              </div>
              <Link
                href="/methodologie"
                className="shrink-0 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Méthodologie
              </Link>
            </div>
          </section>
        )}

        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm md:p-6 print:hidden">
          <h2 className="text-sm font-semibold text-zinc-900">
            Faire quelque chose de ce résultat
          </h2>
          <p className="text-sm text-zinc-700">
            Vous pouvez garder ce résultat pour vous, le partager à un collègue, ou vous en servir
            comme base de discussion avec un pro du product.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Exporter / Imprimer
            </button>
            <button
              type="button"
              onClick={handleContact}
              className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
            >
              Contacter un pro
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Aucune donnée personnelle n&apos;a été transmise. Si vous choisissez de contacter un
            pro, nous vous demanderons vos coordonnées et votre consentement explicite.
          </p>
        </section>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-600">Chargement...</p>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}


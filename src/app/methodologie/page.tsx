"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MethodologiePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Méthodologie • RICE COOKER
            </p>
            <p className="text-sm text-zinc-600">
              Comment le score de maîtrise du risque est calculé.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Retour
          </button>
        </header>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Formule de calcul du score
          </h1>
          <p className="font-mono text-lg text-zinc-800">
            Score = 100 × (combinaison_hybride(P, R, I, C)^1.15) × (1 - pénalité_E)
          </p>
          <p className="text-sm text-zinc-700">
            Utilisation d&apos;une combinaison hybride (70 % arithmétique + 30 % géométrique) élevée à la puissance 1.15 pour amplifier modérément les différences et créer une meilleure distribution. La pénalité E (jusqu&apos;à 30 %) réduit le score proportionnellement.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-base font-semibold tracking-tight">
            Les 5 dimensions PRICE
          </h2>
          <ul className="space-y-3 text-sm text-zinc-700">
            <li>
              <strong className="text-zinc-900">P (Problem)</strong> — Clarté et crédibilité du problème identifié.
            </li>
            <li>
              <strong className="text-zinc-900">R (Reach)</strong> — Crédibilité et représentativité des utilisateurs cibles.
            </li>
            <li>
              <strong className="text-zinc-900">I (Impact)</strong> — Impact attendu de la solution pour ces utilisateurs.
            </li>
            <li>
              <strong className="text-zinc-900">C (Confidence)</strong> — Force des preuves accumulées (entretiens, tests, paiements, etc.).
            </li>
            <li>
              <strong className="text-zinc-900">E (Effort)</strong> — Pénalité selon l&apos;effort estimé et le niveau d&apos;incertitude. Plus E est élevé, plus la pénalité appliquée au score est forte.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            Accueil
          </Link>
          <Link
            href="/questionnaire"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            Lancer l&apos;évaluation
          </Link>
        </div>
      </main>
    </div>
  );
}

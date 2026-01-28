"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactProPage() {
  const router = useRouter();

  const [projectTitle, setProjectTitle] = useState("");
  const [projectStage, setProjectStage] = useState("");
  const [projectGoal, setProjectGoal] = useState("");
  const [projectContext, setProjectContext] = useState("");

  const [budgetRange, setBudgetRange] = useState("");
  const [timeConstraint, setTimeConstraint] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [consentAccepted, setConsentAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("riceCookerProjectName");
    if (stored && stored.trim() && !projectTitle.trim()) {
      setProjectTitle(stored.trim());
    }
  }, [projectTitle]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!projectTitle.trim()) {
      setError("Merci d’indiquer un titre de projet.");
      return;
    }
    if (!fullName.trim()) {
      setError("Merci d’indiquer votre nom.");
      return;
    }
    if (!email.trim()) {
      setError("Merci d’indiquer votre email.");
      return;
    }
    if (!consentAccepted) {
      setError("Merci de cocher la case de consentement avant d’envoyer votre demande.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: {
            title: projectTitle,
            stage: projectStage,
            goal: projectGoal,
            context: projectContext,
            constraints: {
              budgetRange,
              timeConstraint,
            },
          },
          contact: {
            fullName,
            email,
            phone,
          },
          consent: {
            accepted: consentAccepted,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l’envoi du lead.");
      }

      setSuccess("Merci ! Votre demande a bien été envoyée. Nous reviendrons vers vous rapidement.");
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l’envoi de votre demande.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10"
      >
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Mise en relation • RICE COOKER
            </p>
            <p className="text-sm text-zinc-600">
              Un brief structuré pour un premier échange utile avec un pro du product.
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

        <main className="space-y-6 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Parlez-nous un peu de votre projet
            </h1>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-800">
                Titre du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Stade actuel du projet
                </label>
                <select
                  value={projectStage}
                  onChange={(e) => setProjectStage(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Je préfère ne pas préciser</option>
                  <option value="idea">Idée</option>
                  <option value="prototype">Prototype / maquette</option>
                  <option value="in_production">Déjà en production</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Objectif principal de l&apos;accompagnement
                </label>
                <select
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Je ne sais pas encore / à clarifier</option>
                  <option value="cadrage">Cadrage / clarification du problème</option>
                  <option value="discovery">Discovery / recherche utilisateur</option>
                  <option value="mvp">Conception de MVP</option>
                  <option value="ux">UX / design</option>
                  <option value="delivery">Delivery / mise en production</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">
                Contexte et éléments importants
              </label>
              <textarea
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Précisez par exemple votre organisation, des contraintes internes, des enjeux particuliers, etc."
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-200 pt-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Contraintes budget & timing (ordre de grandeur)
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Budget cible (approx.)
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Je ne sais pas / à discuter</option>
                  <option value="<10k">Moins de 10 k€</option>
                  <option value="10-25k">10–25 k€</option>
                  <option value="25-50k">25–50 k€</option>
                  <option value=">50k">Plus de 50 k€</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Timing souhaité
                </label>
                <input
                  type="text"
                  value={timeConstraint}
                  onChange={(e) => setTimeConstraint(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex. « Idéalement avant septembre », « Démarrage en T3 », etc."
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-200 pt-4">
            <h2 className="text-sm font-semibold text-zinc-900">Vos coordonnées</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-800">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-800">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                />
                <span>
                  Je consens à ce que les informations de ce formulaire soient utilisées pour me
                  recontacter au sujet de mon projet. Je comprends qu&apos;elles ne seront pas
                  utilisées à d&apos;autres fins commerciales et que je peux demander leur
                  suppression à tout moment.
                </span>
              </label>
              <p className="text-[11px] text-zinc-500">
                Aucune donnée personnelle n&apos;est stockée tant que vous n&apos;envoyez pas ce
                formulaire.
              </p>
            </div>
          </section>
        </main>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-600" role="status">
            {success}
          </p>
        )}

        <footer className="flex justify-end border-t border-zinc-200 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
          </button>
        </footer>
      </form>
    </div>
  );
}


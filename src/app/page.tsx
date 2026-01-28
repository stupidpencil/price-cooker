export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-6 py-12 md:px-10 md:py-16">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            b,a.-ba présente
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            RICE COOKER
          </h1>
          <p className="max-w-xl text-lg text-zinc-700">
            Évalue le <span className="font-semibold">risque de développement</span> de ton
            projet numérique avant de le « cuire ». En{" "}
            <span className="font-semibold">5–8 minutes</span>, repars avec un score, un
            diagnostic lisible et des recommandations actionnables.
          </p>
          <p className="text-sm text-zinc-500">
            Ce score ne mesure pas la « brillance » de ton idée, mais le{" "}
            <span className="font-semibold">risque restant pour la développer</span>.
          </p>
                 <div className="flex flex-wrap items-center gap-3 pt-2">
                   <a
                     href="/questionnaire"
                     className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800"
                   >
                     Lancer l&apos;évaluation
                   </a>
                   <a
                     href="#comment-ca-marche"
                     className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
                   >
                     Comment ça marche ?
                   </a>
                   <span className="text-xs text-zinc-500">~5–8 minutes • aucun compte requis</span>
                   <a
                     href="/admin"
                     className="ml-auto text-xs font-medium text-zinc-500 underline-offset-4 hover:underline"
                   >
                     Admin
                   </a>
                 </div>
        </header>

        <section
          id="comment-ca-marche"
          className="grid gap-8 border-t border-zinc-200 pt-8 md:grid-cols-2"
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Ce que fait RICE COOKER
            </h2>
            <p className="text-sm text-zinc-700">
              RICE COOKER te fait passer par un court questionnaire structuré autour de 5
              dimensions :
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              <li>
                <strong>P – Problème</strong> : clarté et crédibilité du problème.
              </li>
              <li>
                <strong>R – Reach</strong> : qui est réellement touché, et dans quelle
                proportion.
              </li>
              <li>
                <strong>I – Impact</strong> : ce que ta solution change pour ces personnes.
              </li>
              <li>
                <strong>C – Confidence</strong> : les preuves et actions déjà réalisées.
              </li>
              <li>
                <strong>E – Effort</strong> : effort estimé et niveau d&apos;incertitude.
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Données & confidentialité</h3>
            <p className="text-sm text-zinc-700">
              Tu peux tester tes idées les plus secrètes :{" "}
              <span className="font-semibold">
                aucune donnée personnelle n&apos;est conservée tant que tu ne demandes pas à
                être recontacté·e.
              </span>
            </p>
            <p className="text-sm text-zinc-700">
              Si tu choisis ensuite de <span className="font-semibold">contacter un pro</span>,
              on te demandera explicitement tes coordonnées et ton consentement avant d&apos;envoyer un brief
              structuré à une personne de confiance.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

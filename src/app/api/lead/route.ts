import { NextResponse } from "next/server";

type LeadPayload = {
  project: {
    title: string;
    stage?: string;
    goal?: string;
    context?: string;
    constraints?: {
      budgetRange?: string;
      timeConstraint?: string;
    };
  };
  contact: {
    fullName: string;
    email: string;
    phone?: string;
  };
  consent: {
    accepted: boolean;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadPayload;

    if (!body.consent?.accepted) {
      return NextResponse.json(
        { error: "CONSENT_REQUIRED", message: "Le consentement est requis." },
        { status: 400 },
      );
    }

    if (!body.project?.title || !body.contact?.fullName || !body.contact.email) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD", message: "Champs obligatoires manquants." },
        { status: 400 },
      );
    }

    const lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      project: body.project,
      contact: body.contact,
      consent: {
        accepted: true,
        textVersion: "v1.0",
        acceptedAt: new Date().toISOString(),
      },
    };

    console.log("[RICE-COOKER] Nouveau lead reçu", lead);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Requête invalide",
      },
      { status: 400 },
    );
  }
}


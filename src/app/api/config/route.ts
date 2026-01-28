import { NextResponse } from "next/server";
import { loadConfig } from "@/config/config-loader";
import { saveConfig } from "@/config/config-server";

export async function GET() {
  try {
    const config = await loadConfig();
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error("[Config API] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la configuration" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await saveConfig(body);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Config API] PUT error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la configuration" },
      { status: 500 },
    );
  }
}

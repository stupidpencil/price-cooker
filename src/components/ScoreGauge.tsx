"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const GAUGE_WIDTH = 320;
const GAUGE_HEIGHT = 280;

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500"
      style={{ width: GAUGE_WIDTH, height: GAUGE_HEIGHT }}
    >
      Chargement…
    </div>
  ),
});

export type Tone = "red" | "amber" | "green";

/** Palette par ton (risque élevé / modéré / maîtrisé) pour arc, score et bouton */
export const TONE_COLORS: Record<
  Tone,
  { arc: string; score: string; buttonBg: string; buttonBorder: string; buttonText: string }
> = {
  red: {
    arc: "#ef4444",
    score: "#b91c1c",
    buttonBg: "#fef2f2",
    buttonBorder: "#ef4444",
    buttonText: "#b91c1c",
  },
  amber: {
    arc: "#f5b94e",
    score: "#c78c32",
    buttonBg: "#fff1d0",
    buttonBorder: "#f5b94e",
    buttonText: "#c78c32",
  },
  green: {
    arc: "#10b981",
    score: "#047857",
    buttonBg: "#ecfdf5",
    buttonBorder: "#10b981",
    buttonText: "#047857",
  },
};

type ScoreGaugeProps = {
  scorePercent: number;
  tone: Tone;
};

export function ScoreGauge({ scorePercent, tone }: ScoreGaugeProps) {
  const series = [Math.min(100, Math.max(0, scorePercent))];
  const { arc: fillColor, score: valueColor } = TONE_COLORS[tone];

  const options: ApexOptions = {
    chart: { type: "radialBar", offsetX: 0, offsetY: 0 },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "50%", margin: 0 },
        track: {
          background: "#e5e7eb",
          strokeWidth: "100%",
          margin: 0,
          startAngle: -90,
          endAngle: 90,
        },
        dataLabels: {
          name: { show: false },
          value: {
            show: true,
            fontSize: "36px",
            fontWeight: 700,
            offsetY: -4,
            color: valueColor,
            formatter: (val: number) => `${Math.round(Number(val))}%`,
          },
        },
      },
    },
    fill: { colors: [fillColor] },
    stroke: { lineCap: "round" },
    labels: [""],
  };

  return (
    <div className="w-fit shrink-0">
      <ReactApexChart
        options={options}
        series={series}
        type="radialBar"
        width={GAUGE_WIDTH}
        height={GAUGE_HEIGHT}
      />
    </div>
  );
}

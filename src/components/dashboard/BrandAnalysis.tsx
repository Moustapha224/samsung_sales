import { ComputedRecord } from "@/lib/types";
import { groupBy, sumField } from "@/lib/data-store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface Props {
  data: ComputedRecord[];
}

const COLORS = ["hsl(215,70%,55%)", "hsl(150,55%,45%)", "hsl(35,85%,55%)", "hsl(280,55%,55%)", "hsl(0,65%,55%)", "hsl(190,60%,50%)"];

const tooltipStyle = {
  contentStyle: { backgroundColor: "hsl(220,15%,17%)", border: "1px solid hsl(220,12%,25%)", borderRadius: "8px", color: "hsl(210,20%,92%)" },
  labelStyle: { color: "hsl(210,20%,92%)" },
};

function brandAgg(data: ComputedRecord[]) {
  const g = groupBy(data, (d) => d.brand);
  return Object.entries(g)
    .map(([brand, items]) => ({
      brand,
      volume: sumField(items, "sellOut"),
      ca: Math.round(sumField(items, "ca")),
      marge: Math.round(sumField(items, "margeTotale")),
    }))
    .sort((a, b) => b.volume - a.volume);
}

const MOIS_ORDER = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];

function monthlyByBrand(data: ComputedRecord[]) {
  const brands = [...new Set(data.map((d) => d.brand))];
  const g = groupBy(data, (d) => d.mois);
  const months = Object.keys(g).sort((a, b) => MOIS_ORDER.indexOf(a) - MOIS_ORDER.indexOf(b));
  return months.map((mois) => {
    const entry: Record<string, string | number> = { mois: mois.slice(0, 4) };
    brands.forEach((brand) => {
      entry[brand] = sumField(
        g[mois]?.filter((d) => d.brand === brand) || [],
        "sellOut"
      );
    });
    return entry;
  });
}

export default function BrandAnalysis({ data }: Props) {
  const agg = brandAgg(data);
  const brands = [...new Set(data.map((d) => d.brand))];
  const monthly = monthlyByBrand(data);
  const fmt = (v: number) => `${(v / 1000).toFixed(1)}k`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">📊 Analyse par Marque</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { key: "volume" as const, label: "Volume par Marque", color: COLORS[0] },
          { key: "ca" as const, label: "CA par Marque (€)", color: COLORS[1] },
          { key: "marge" as const, label: "Marge par Marque (€)", color: COLORS[2] },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-3 font-medium">{label}</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agg} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} tickFormatter={key !== "volume" ? fmt : undefined} />
                <YAxis dataKey="brand" type="category" tick={{ fill: "hsl(210,20%,85%)", fontSize: 11 }} width={90} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => key !== "volume" ? `${v.toLocaleString("fr-FR")} €` : v.toLocaleString("fr-FR")} />
                <Bar dataKey={key} fill={color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-sm text-muted-foreground mb-3 font-medium">Évolution mensuelle du volume par Marque</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,12%,25%)" />
            <XAxis dataKey="mois" tick={{ fill: "hsl(210,20%,85%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: "hsl(210,20%,85%)" }} />
            {brands.map((brand, i) => (
              <Line key={brand} type="monotone" dataKey={brand} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

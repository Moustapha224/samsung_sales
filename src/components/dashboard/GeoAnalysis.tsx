import { ComputedRecord } from "@/lib/types";
import { groupBy, sumField } from "@/lib/data-store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: ComputedRecord[];
}

const tooltipStyle = {
  contentStyle: { backgroundColor: "hsl(220,15%,17%)", border: "1px solid hsl(220,12%,25%)", borderRadius: "8px", color: "hsl(210,20%,92%)" },
};

function agg(data: ComputedRecord[], key: keyof ComputedRecord, metric: "sellOut" | "ca") {
  const g = groupBy(data, (d) => d[key] as string);
  return Object.entries(g)
    .map(([name, items]) => ({ name, value: metric === "ca" ? Math.round(sumField(items, "ca")) : sumField(items, "sellOut") }))
    .sort((a, b) => b.value - a.value);
}

export default function GeoAnalysis({ data }: Props) {
  const byZone = agg(data, "zone", "sellOut");
  const byDistrict = agg(data, "district", "ca").slice(0, 10);
  const byChannel = agg(data, "distributionChannel", "sellOut").filter((d) => d.name);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">🌍 Analyse Géographique</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-3 font-medium">Volume par Zone</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byZone}>
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,85%)", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(215,70%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-3 font-medium">CA par District (Top 10, €)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byDistrict} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "hsl(210,20%,85%)", fontSize: 10 }} width={100} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => `${v.toLocaleString("fr-FR")} €`} />
              <Bar dataKey="value" fill="hsl(150,55%,45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-3 font-medium">Volume par Canal de Distribution</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byChannel}>
              <XAxis dataKey="name" tick={{ fill: "hsl(210,20%,85%)", fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "hsl(215,15%,55%)", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="hsl(35,85%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

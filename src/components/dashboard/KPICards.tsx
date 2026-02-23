import { ComputedRecord } from "@/lib/types";
import { sumField, groupBy } from "@/lib/data-store";
import { TrendingUp, DollarSign, BarChart3, Percent, Store, Crown } from "lucide-react";

interface KPICardsProps {
  data: ComputedRecord[];
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function KPICard({ title, value, icon, accent }: KPICardProps) {
  return (
    <div className={`rounded-xl border border-border p-5 transition-all hover:shadow-lg ${accent ? "bg-primary/10 border-primary/30" : "bg-card"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-sm font-medium">{title}</span>
        <span className={`${accent ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-primary" : "text-card-foreground"}`}>{value}</p>
    </div>
  );
}

export default function KPICards({ data }: KPICardsProps) {
  const totalVolume = sumField(data, "sellOut");
  const totalCA = sumField(data, "ca");
  const totalMarge = sumField(data, "margeTotale");
  const tauxMarge = totalCA > 0 ? (totalMarge / totalCA) * 100 : 0;
  const uniquePOS = new Set(data.map((d) => d.codePOS)).size;

  // Leading brand by volume
  const byBrand = groupBy(data, (d) => d.brand);
  let leaderBrand = "—";
  let maxVol = 0;
  for (const [brand, items] of Object.entries(byBrand)) {
    const vol = sumField(items, "sellOut");
    if (vol > maxVol) {
      maxVol = vol;
      leaderBrand = brand;
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard title="Volume Total" value={totalVolume.toLocaleString("fr-FR")} icon={<BarChart3 size={20} />} accent />
      <KPICard title="Chiffre d'Affaires" value={fmt(totalCA)} icon={<DollarSign size={20} />} />
      <KPICard title="Marge Totale" value={fmt(totalMarge)} icon={<TrendingUp size={20} />} />
      <KPICard title="Taux de Marge" value={`${tauxMarge.toFixed(1)}%`} icon={<Percent size={20} />} />
      <KPICard title="Points de Vente" value={uniquePOS.toLocaleString("fr-FR")} icon={<Store size={20} />} />
      <KPICard title="Marque Leader" value={leaderBrand} icon={<Crown size={20} />} accent />
    </div>
  );
}

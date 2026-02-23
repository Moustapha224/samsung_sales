import { Filters, emptyFilters } from "@/lib/types";
import { Filter, X } from "lucide-react";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  options: {
    segment: string[];
    product: string[];
    zone: string[];
    district: string[];
    typeOfPOS: string[];
    categoryOfPOS: string[];
    brand: string[];
    mois: string[];
    quarter: string[];
    annee: number[];
  };
}

interface FilterSelectProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}

function FilterSelect({ label, values, selected, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <select
        multiple
        value={selected}
        onChange={(e) => {
          const opts = Array.from(e.target.selectedOptions, (o) => o.value);
          onChange(opts);
        }}
        className="bg-secondary text-secondary-foreground text-xs rounded-lg px-2 py-1.5 border border-border focus:ring-1 focus:ring-primary outline-none h-20"
      >
        {values.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

export default function DashboardFilters({ filters, onChange, options }: Props) {
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filtres Globaux</h3>
        </div>
        {hasFilters && (
          <button onClick={() => onChange(emptyFilters)} className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors">
            <X size={14} /> Réinitialiser
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
        <FilterSelect label="Marque" values={options.brand} selected={filters.brand} onChange={(v) => onChange({ ...filters, brand: v })} />
        <FilterSelect label="Segment" values={options.segment} selected={filters.segment} onChange={(v) => onChange({ ...filters, segment: v })} />
        <FilterSelect label="Produit" values={options.product} selected={filters.product} onChange={(v) => onChange({ ...filters, product: v })} />
        <FilterSelect label="Zone" values={options.zone} selected={filters.zone} onChange={(v) => onChange({ ...filters, zone: v })} />
        <FilterSelect label="District" values={options.district} selected={filters.district} onChange={(v) => onChange({ ...filters, district: v })} />
        <FilterSelect label="Type POS" values={options.typeOfPOS} selected={filters.typeOfPOS} onChange={(v) => onChange({ ...filters, typeOfPOS: v })} />
        <FilterSelect label="Catégorie POS" values={options.categoryOfPOS} selected={filters.categoryOfPOS} onChange={(v) => onChange({ ...filters, categoryOfPOS: v })} />
        <FilterSelect label="Mois" values={options.mois} selected={filters.mois} onChange={(v) => onChange({ ...filters, mois: v })} />
        <FilterSelect label="Trimestre" values={options.quarter} selected={filters.quarter} onChange={(v) => onChange({ ...filters, quarter: v })} />
        <FilterSelect
          label="Année"
          values={options.annee.map(String)}
          selected={filters.annee.map(String)}
          onChange={(v) => onChange({ ...filters, annee: v.map(Number) })}
        />
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback, useEffect } from "react";
import { Filters, emptyFilters } from "@/lib/types";
import { loadData, initData, computeRecord, applyFilters, getUniqueValues } from "@/lib/data-store";
import KPICards from "@/components/dashboard/KPICards";
import BrandAnalysis from "@/components/dashboard/BrandAnalysis";
import GeoAnalysis from "@/components/dashboard/GeoAnalysis";
import ProductAnalysis from "@/components/dashboard/ProductAnalysis";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import AddDataForm from "@/components/dashboard/AddDataForm";
import { BarChart3 } from "lucide-react";

const Index = () => {
  const [version, setVersion] = useState(0);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showAddData, setShowAddData] = useState(false);

  // On mount, load data from IndexedDB (for large datasets that exceeded localStorage)
  useEffect(() => {
    initData().then(() => setVersion((v) => v + 1));
  }, []);

  const rawData = useMemo(() => loadData(), [version]);
  const computedData = useMemo(() => rawData.map(computeRecord), [rawData]);
  const filteredData = useMemo(() => applyFilters(computedData, filters), [computedData, filters]);
  const filterOptions = useMemo(() => getUniqueValues(rawData), [rawData]);

  const handleDataAdded = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <BarChart3 className="text-primary" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Smartphone Sales Analytics</h1>
              <p className="text-xs text-muted-foreground">{rawData.length} enregistrements · {new Set(rawData.map((d) => d.brand)).size} marques</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddData(!showAddData)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showAddData ? "Masquer" : "➕ Ajouter des données"}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Add Data */}
        {showAddData && <AddDataForm onDataAdded={handleDataAdded} />}

        {/* Filters */}
        <DashboardFilters filters={filters} onChange={setFilters} options={filterOptions} />

        {/* KPI Cards */}
        <KPICards data={filteredData} />

        {/* Brand Analysis */}
        <BrandAnalysis data={filteredData} />

        {/* Geo Analysis */}
        <GeoAnalysis data={filteredData} />

        {/* Product Analysis */}
        <ProductAnalysis data={filteredData} />
      </main>
    </div>
  );
};

export default Index;

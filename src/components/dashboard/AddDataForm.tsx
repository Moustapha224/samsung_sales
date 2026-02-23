import { useState, useRef } from "react";
import { SalesRecord } from "@/lib/types";
import { addRecords, clearAllData, replaceAllData } from "@/lib/data-store";
import { Plus, Upload, FileSpreadsheet, Trash2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  onDataAdded: () => void;
}

const emptyRecord: SalesRecord = {
  codePOS: "", index: 0, nameOfPOS: "", categoryOfPOS: "RETAILER", typeOfPOS: "SHOP",
  zone: "", district: "", distributionChannel: "", brand: "", segment: "SMARTPHONE",
  product: "", sellOut: 0, purchasePrice: 0, salePrice: 0, status: "MCS",
  codeWeek: "", annee: 2025, mois: "", quarter: "",
};

const fields: { key: keyof SalesRecord; label: string; type: "text" | "number" }[] = [
  { key: "codePOS", label: "Code POS", type: "text" },
  { key: "index", label: "Index", type: "number" },
  { key: "nameOfPOS", label: "Nom du POS", type: "text" },
  { key: "categoryOfPOS", label: "Catégorie POS", type: "text" },
  { key: "typeOfPOS", label: "Type POS", type: "text" },
  { key: "zone", label: "Zone", type: "text" },
  { key: "district", label: "District", type: "text" },
  { key: "distributionChannel", label: "Canal Distribution", type: "text" },
  { key: "brand", label: "Marque", type: "text" },
  { key: "segment", label: "Segment", type: "text" },
  { key: "product", label: "Produit", type: "text" },
  { key: "sellOut", label: "Sell Out", type: "number" },
  { key: "purchasePrice", label: "Prix Achat (€)", type: "number" },
  { key: "salePrice", label: "Prix Vente (€)", type: "number" },
  { key: "status", label: "Statut", type: "text" },
  { key: "codeWeek", label: "Code Semaine", type: "text" },
  { key: "annee", label: "Année", type: "number" },
  { key: "mois", label: "Mois", type: "text" },
  { key: "quarter", label: "Trimestre", type: "text" },
];

// Flexible column name mapping: maps various possible Excel header names to SalesRecord keys
const COLUMN_ALIASES: Record<string, keyof SalesRecord> = {
  // codePOS
  codepos: "codePOS", code_pos: "codePOS", "code pos": "codePOS", code: "codePOS",
  // index
  index: "index", idx: "index",
  // nameOfPOS
  nameofpos: "nameOfPOS", name_of_pos: "nameOfPOS", "name of pos": "nameOfPOS",
  "nom du pos": "nameOfPOS", nom: "nameOfPOS", name: "nameOfPOS",
  // categoryOfPOS
  categoryofpos: "categoryOfPOS", category_of_pos: "categoryOfPOS", "category of pos": "categoryOfPOS",
  category: "categoryOfPOS", categorie: "categoryOfPOS", "catégorie pos": "categoryOfPOS", "catégorie": "categoryOfPOS",
  // typeOfPOS
  typeofpos: "typeOfPOS", type_of_pos: "typeOfPOS", "type of pos": "typeOfPOS",
  type: "typeOfPOS", "type pos": "typeOfPOS",
  // zone
  zone: "zone",
  // district
  district: "district",
  // distributionChannel
  distributionchannel: "distributionChannel", distribution_channel: "distributionChannel",
  "distribution channel": "distributionChannel", "canal distribution": "distributionChannel", canal: "distributionChannel",
  // brand
  brand: "brand", marque: "brand",
  // segment
  segment: "segment",
  // product
  product: "product", produit: "product",
  // sellOut
  sellout: "sellOut", sell_out: "sellOut", "sell out": "sellOut", ventes: "sellOut", quantite: "sellOut", quantité: "sellOut",
  // purchasePrice
  purchaseprice: "purchasePrice", purchase_price: "purchasePrice", "purchase price": "purchasePrice",
  "prix achat": "purchasePrice", "prix d'achat": "purchasePrice", prixachat: "purchasePrice",
  // salePrice
  saleprice: "salePrice", sale_price: "salePrice", "sale price": "salePrice",
  "prix vente": "salePrice", "prix de vente": "salePrice", prixvente: "salePrice",
  // status
  status: "status", statut: "status",
  // codeWeek
  codeweek: "codeWeek", code_week: "codeWeek", "code week": "codeWeek",
  "code semaine": "codeWeek", semaine: "codeWeek",
  // annee
  annee: "annee", année: "annee", year: "annee", an: "annee",
  // mois
  mois: "mois", month: "mois",
  // quarter
  quarter: "quarter", trimestre: "quarter",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[_\-\.]/g, " ").replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Record<number, keyof SalesRecord> {
  const mapping: Record<number, keyof SalesRecord> = {};
  const usedKeys = new Set<keyof SalesRecord>();

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i]);
    // Try exact match on normalized header
    const matchedKey = COLUMN_ALIASES[normalized];
    if (matchedKey && !usedKeys.has(matchedKey)) {
      mapping[i] = matchedKey;
      usedKeys.add(matchedKey);
    }
  }
  return mapping;
}

function parseExcelValue(value: unknown, fieldType: "text" | "number"): string | number {
  if (value == null || value === "") {
    return fieldType === "number" ? 0 : "";
  }
  if (fieldType === "number") {
    const str = String(value).replace(/[€\s]/g, "").replace(",", ".");
    return parseFloat(str) || 0;
  }
  return String(value).trim();
}

function rowToSalesRecord(
  row: unknown[],
  headerMapping: Record<number, keyof SalesRecord>,
): SalesRecord {
  const record: SalesRecord = { ...emptyRecord };
  const fieldTypeMap = new Map(fields.map((f) => [f.key, f.type]));

  for (const [colIdx, fieldKey] of Object.entries(headerMapping)) {
    const idx = parseInt(colIdx);
    const fType = fieldTypeMap.get(fieldKey) || "text";
    const parsed = parseExcelValue(row[idx], fType);
    (record as Record<string, unknown>)[fieldKey] = parsed;
  }
  return record;
}

interface ExcelPreview {
  fileName: string;
  totalRows: number;
  mappedColumns: { excelHeader: string; mappedTo: keyof SalesRecord }[];
  unmappedColumns: string[];
  headerMapping: Record<number, keyof SalesRecord>;
  rows: unknown[][];
}

export default function AddDataForm({ onDataAdded }: Props) {
  const [record, setRecord] = useState<SalesRecord>({ ...emptyRecord });
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState<"form" | "bulk" | "excel">("form");
  const [message, setMessage] = useState("");
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  // ---- Form mode ----
  const handleSubmit = () => {
    if (!record.codePOS || !record.nameOfPOS || !record.product || record.sellOut <= 0) {
      showMessage("⚠️ Veuillez remplir les champs obligatoires (Code POS, Nom, Produit, Sell Out)");
      return;
    }
    addRecords([record]);
    setRecord({ ...emptyRecord });
    showMessage("✅ Ligne ajoutée avec succès !");
    onDataAdded();
  };

  // ---- Bulk mode ----
  const handleBulkImport = () => {
    try {
      const lines = bulkText.trim().split("\n").filter(Boolean);
      const records: SalesRecord[] = lines.map((line) => {
        const cols = line.split("\t");
        if (cols.length < 19) throw new Error("Nombre de colonnes insuffisant");
        return {
          codePOS: cols[0],
          index: parseInt(cols[1]) || 0,
          nameOfPOS: cols[2],
          categoryOfPOS: cols[3],
          typeOfPOS: cols[4],
          zone: cols[5],
          district: cols[6],
          distributionChannel: cols[7],
          brand: cols[8],
          segment: cols[9],
          product: cols[10],
          sellOut: parseFloat(cols[11]?.replace(",", ".")) || 0,
          purchasePrice: parseFloat(cols[12]?.replace(/[€\s]/g, "").replace(",", ".")) || 0,
          salePrice: parseFloat(cols[13]?.replace(/[€\s]/g, "").replace(",", ".")) || 0,
          status: cols[14],
          codeWeek: cols[15],
          annee: parseInt(cols[16]) || 2025,
          mois: cols[17],
          quarter: cols[18],
        };
      });
      addRecords(records);
      setBulkText("");
      showMessage(`✅ ${records.length} ligne(s) importée(s) avec succès !`);
      onDataAdded();
    } catch {
      showMessage("⚠️ Erreur de format. Collez les données séparées par tabulations (19 colonnes).");
    }
  };

  // ---- Excel mode ----
  const processExcelFile = (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      showMessage("⚠️ Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          showMessage("⚠️ Le fichier ne contient pas assez de données (au moins 1 en-tête + 1 ligne).");
          return;
        }

        const headers = (jsonData[0] as unknown[]).map(String);
        const rows = jsonData.slice(1).filter((row) =>
          (row as unknown[]).some((cell) => cell != null && cell !== ""),
        ) as unknown[][];

        const headerMapping = mapHeaders(headers);
        const mappedColumns: { excelHeader: string; mappedTo: keyof SalesRecord }[] = [];
        const unmappedColumns: string[] = [];

        headers.forEach((h, i) => {
          if (headerMapping[i]) {
            mappedColumns.push({ excelHeader: h, mappedTo: headerMapping[i] });
          } else {
            unmappedColumns.push(h);
          }
        });

        if (mappedColumns.length === 0) {
          showMessage("⚠️ Aucune colonne reconnue. Vérifiez les en-têtes de votre fichier Excel.");
          return;
        }

        setExcelPreview({
          fileName: file.name,
          totalRows: rows.length,
          mappedColumns,
          unmappedColumns,
          headerMapping,
          rows,
        });
        showMessage(`📄 Fichier "${file.name}" lu — ${rows.length} lignes détectées, ${mappedColumns.length} colonnes mappées.`);
      } catch (err) {
        console.error("Excel parse error:", err);
        showMessage("⚠️ Erreur lors de la lecture du fichier Excel. Vérifiez le format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processExcelFile(file);
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processExcelFile(file);
  };

  const handleConfirmExcelImport = async () => {
    if (!excelPreview || isImporting) return;

    setIsImporting(true);
    try {
      const records = excelPreview.rows.map((row) =>
        rowToSalesRecord(row, excelPreview.headerMapping),
      );

      await replaceAllData(records);
      showMessage(`✅ ${records.length} ligne(s) importée(s) depuis "${excelPreview.fileName}" ! Les données précédentes ont été remplacées.`);
      setExcelPreview(null);
      onDataAdded();
    } catch (err) {
      console.error("Excel import error:", err);
      showMessage("⚠️ Erreur lors de l'import : impossible de sauvegarder les données. Veuillez réessayer.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelExcelImport = () => {
    setExcelPreview(null);
    setMessage("");
  };

  // ---- Clear all data ----
  const handleClearData = () => {
    const confirmed = window.confirm(
      "⚠️ Êtes-vous sûr de vouloir effacer TOUTES les données ?\n\nCette action est irréversible. Les données d'exemple seront restaurées au prochain chargement.",
    );
    if (!confirmed) return;

    clearAllData();
    showMessage("🗑️ Toutes les données ont été effacées. Les données d'exemple ont été restaurées.");
    onDataAdded();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      {/* Header with mode tabs and clear button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus size={18} className="text-primary" /> Ajouter des Données
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setMode("form")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${mode === "form" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              Formulaire
            </button>
            <button
              onClick={() => setMode("bulk")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${mode === "bulk" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              <Upload size={12} className="inline mr-1" /> Import en masse
            </button>
            <button
              onClick={() => setMode("excel")}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${mode === "excel" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              <FileSpreadsheet size={12} className="inline mr-1" /> Import Excel
            </button>
          </div>

          {/* Clear data button */}
          <button
            onClick={handleClearData}
            className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1 border border-destructive/20"
          >
            <Trash2 size={12} /> Effacer les données
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-sm px-3 py-2 rounded-lg bg-secondary animate-in fade-in duration-300">{message}</p>
      )}

      {/* FORM MODE */}
      {mode === "form" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type={type}
                  value={record[key] as string | number}
                  onChange={(e) => setRecord({ ...record, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                  className="bg-secondary text-secondary-foreground text-sm rounded-lg px-2 py-1.5 border border-border focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Ajouter la ligne
          </button>
        </>
      )}

      {/* BULK MODE */}
      {mode === "bulk" && (
        <>
          <p className="text-xs text-muted-foreground">Collez les données depuis Excel (séparées par tabulations, 19 colonnes). Une ligne par enregistrement.</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder="Collez vos données ici..."
            className="w-full bg-secondary text-secondary-foreground text-sm rounded-lg px-3 py-2 border border-border focus:ring-1 focus:ring-primary outline-none resize-y font-mono"
          />
          <button onClick={handleBulkImport} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Importer les données
          </button>
        </>
      )}

      {/* EXCEL MODE */}
      {mode === "excel" && (
        <>
          {!excelPreview ? (
            <>
              <p className="text-xs text-muted-foreground">
                Importez un fichier Excel (.xlsx) pour remplacer toutes les données actuelles.
                Les en-têtes de colonnes seront automatiquement mappées aux champs du dashboard.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragging
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                  }
                `}
              >
                <FileSpreadsheet
                  size={40}
                  className={`mx-auto mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                />
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Déposez le fichier ici..." : "Glissez-déposez votre fichier Excel ici"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou cliquez pour sélectionner un fichier (.xlsx, .xls)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Expected columns hint */}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  📋 Colonnes attendues (cliquer pour voir)
                </summary>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 p-3 bg-secondary/50 rounded-lg">
                  {fields.map(({ key, label }) => (
                    <span key={key} className="bg-secondary px-2 py-0.5 rounded text-xs">
                      <strong>{key}</strong> — {label}
                    </span>
                  ))}
                </div>
              </details>
            </>
          ) : (
            /* Preview after file parsed */
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-primary" />
                  Prévisualisation — {excelPreview.fileName}
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <span className="text-muted-foreground text-xs block">Lignes détectées</span>
                    <span className="text-xl font-bold text-foreground">{excelPreview.totalRows.toLocaleString()}</span>
                  </div>
                  <div className="bg-card rounded-lg p-3 border border-border">
                    <span className="text-muted-foreground text-xs block">Colonnes mappées</span>
                    <span className="text-xl font-bold text-primary">{excelPreview.mappedColumns.length} / {excelPreview.mappedColumns.length + excelPreview.unmappedColumns.length}</span>
                  </div>
                </div>

                {/* Mapped columns */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">✅ Colonnes reconnues :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {excelPreview.mappedColumns.map(({ excelHeader, mappedTo }) => (
                      <span key={mappedTo} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {excelHeader} → <strong>{mappedTo}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Unmapped columns */}
                {excelPreview.unmappedColumns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> Colonnes non reconnues (ignorées) :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {excelPreview.unmappedColumns.map((col) => (
                        <span key={col} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  L'import <strong>remplacera toutes les données existantes</strong> par les {excelPreview.totalRows.toLocaleString()} lignes de ce fichier.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmExcelImport}
                  disabled={isImporting}
                  className={`bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-opacity flex items-center gap-1.5 ${isImporting ? "opacity-60 cursor-wait" : "hover:opacity-90"}`}
                >
                  {isImporting ? (
                    <><span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importation en cours…</>
                  ) : (
                    <><Upload size={14} /> Confirmer l'import ({excelPreview.totalRows.toLocaleString()} lignes)</>
                  )}
                </button>
                <button
                  onClick={handleCancelExcelImport}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

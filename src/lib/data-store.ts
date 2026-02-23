import { SalesRecord, ComputedRecord, Filters } from "./types";
import { sampleData } from "./sample-data";

const STORAGE_KEY = "smartphone-sales-data";
const DB_NAME = "smartphone-sales-db";
const DB_STORE = "sales-data";
const DB_VERSION = 1;

// ---- In-memory cache ----
let cachedData: SalesRecord[] | null = null;

export function computeRecord(record: SalesRecord): ComputedRecord {
  const ca = record.sellOut * record.salePrice;
  const margeUnitaire = record.salePrice - record.purchasePrice;
  const margeTotale = margeUnitaire * record.sellOut;
  const tauxMarge = ca > 0 ? (margeTotale / ca) * 100 : 0;
  return { ...record, ca, margeUnitaire, margeTotale, tauxMarge };
}

// ---- IndexedDB helpers ----
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSave(data: SalesRecord[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    store.put(data, STORAGE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbLoad(): Promise<SalesRecord[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const req = store.get(STORAGE_KEY);
      req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

async function idbClear(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      const store = tx.objectStore(DB_STORE);
      store.delete(STORAGE_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // ignore
  }
}

// ---- Try saving to localStorage, fall back to IndexedDB ----
function trySaveToLocalStorage(data: SalesRecord[]): boolean {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch {
    // Quota exceeded – clear localStorage entry to avoid stale small data
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
    return false;
  }
}

// ---- Public API ----

/** Load data synchronously (from cache or localStorage). Call initData() once at startup for full IDB support. */
export function loadData(): SalesRecord[] {
  if (cachedData) return cachedData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedData = parsed;
        return parsed;
      }
    }
  } catch { }

  // No localStorage data – return sample data as default
  cachedData = sampleData;
  trySaveToLocalStorage(sampleData);
  return sampleData;
}

/** Async initialization: loads from IndexedDB if localStorage is empty (e.g. large dataset). */
export async function initData(): Promise<SalesRecord[]> {
  // First try localStorage (fast path)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedData = parsed;
        return parsed;
      }
    }
  } catch { }

  // Then try IndexedDB (for large datasets)
  const idbData = await idbLoad();
  if (idbData && Array.isArray(idbData) && idbData.length > 0) {
    cachedData = idbData;
    return idbData;
  }

  // Fall back to sample data
  cachedData = sampleData;
  trySaveToLocalStorage(sampleData);
  return sampleData;
}

export function saveData(data: SalesRecord[]) {
  cachedData = data;
  if (!trySaveToLocalStorage(data)) {
    // localStorage failed – save to IndexedDB in background
    idbSave(data).catch((err) => console.error("IndexedDB save error:", err));
  }
}

export function clearAllData(): void {
  cachedData = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch { }
  idbClear().catch(() => { });
}

export async function replaceAllData(data: SalesRecord[]): Promise<void> {
  cachedData = data;
  if (!trySaveToLocalStorage(data)) {
    // Data too large for localStorage – use IndexedDB
    await idbSave(data);
  }
}

export function addRecords(newRecords: SalesRecord[]): SalesRecord[] {
  const existing = loadData();
  const combined = [...existing, ...newRecords];
  saveData(combined);
  return combined;
}

export function applyFilters(data: ComputedRecord[], filters: Filters): ComputedRecord[] {
  return data.filter((r) => {
    if (filters.segment.length && !filters.segment.includes(r.segment)) return false;
    if (filters.product.length && !filters.product.includes(r.product)) return false;
    if (filters.zone.length && !filters.zone.includes(r.zone)) return false;
    if (filters.district.length && !filters.district.includes(r.district)) return false;
    if (filters.typeOfPOS.length && !filters.typeOfPOS.includes(r.typeOfPOS)) return false;
    if (filters.categoryOfPOS.length && !filters.categoryOfPOS.includes(r.categoryOfPOS)) return false;
    if (filters.brand.length && !filters.brand.includes(r.brand)) return false;
    if (filters.mois.length && !filters.mois.includes(r.mois)) return false;
    if (filters.quarter.length && !filters.quarter.includes(r.quarter)) return false;
    if (filters.annee.length && !filters.annee.includes(r.annee)) return false;
    return true;
  });
}

export function getUniqueValues(data: SalesRecord[]) {
  const unique = (key: keyof SalesRecord) => [...new Set(data.map((d) => d[key] as string))].filter(Boolean).sort();
  return {
    segment: unique("segment"),
    product: unique("product"),
    zone: unique("zone"),
    district: unique("district"),
    typeOfPOS: unique("typeOfPOS"),
    categoryOfPOS: unique("categoryOfPOS"),
    brand: unique("brand"),
    mois: unique("mois"),
    quarter: unique("quarter"),
    annee: [...new Set(data.map((d) => d.annee))].sort(),
  };
}

// Aggregation helpers
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function sumField(items: ComputedRecord[], field: "sellOut" | "ca" | "margeTotale"): number {
  return items.reduce((s, i) => s + i[field], 0);
}

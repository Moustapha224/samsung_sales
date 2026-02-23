export interface SalesRecord {
  codePOS: string;
  index: number;
  nameOfPOS: string;
  categoryOfPOS: string;
  typeOfPOS: string;
  zone: string;
  district: string;
  distributionChannel: string;
  brand: string;
  segment: string;
  product: string;
  sellOut: number;
  purchasePrice: number;
  salePrice: number;
  status: string;
  codeWeek: string;
  annee: number;
  mois: string;
  quarter: string;
}

export interface ComputedRecord extends SalesRecord {
  ca: number;
  margeUnitaire: number;
  margeTotale: number;
  tauxMarge: number;
}

export interface Filters {
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
}

export const emptyFilters: Filters = {
  segment: [],
  product: [],
  zone: [],
  district: [],
  typeOfPOS: [],
  categoryOfPOS: [],
  brand: [],
  mois: [],
  quarter: [],
  annee: [],
};

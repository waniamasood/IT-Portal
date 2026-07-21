'use client';
import { create } from 'zustand';

export interface IPRecord {
  IPID: number;
  IPTitle: string;
  CompanyName?: string;
  Category: string;
  Status: string;
  DateOfIssuance?: string;
  DateOfExpiry?: string;
  EffectiveDate?: string;
  ExternalCounselName?: string;
  InternalAssociateName?: string;
  ProfessionalFees?: number;
  Remarks?: string;
  CreatedAt: string;
}

interface IPStore {
  records: IPRecord[];
  loading: boolean;
  error: string | null;
  search: string;
  companyFilter: string;
  categoryFilter: string;
  statusFilter: string;
  selectedRecord: IPRecord | null;
  drawerOpen: boolean;
  detailOpen: boolean;
  setRecords: (r: IPRecord[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSearch: (v: string) => void;
  setCompanyFilter: (v: string) => void;
  setCategoryFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSelectedRecord: (r: IPRecord | null) => void;
  setDrawerOpen: (v: boolean) => void;
  setDetailOpen: (v: boolean) => void;
}

export const useIPStore = create<IPStore>((set) => ({
  records: [],
  loading: false,
  error: null,
  search: '',
  companyFilter: '',
  categoryFilter: '',
  statusFilter: '',
  selectedRecord: null,
  drawerOpen: false,
  detailOpen: false,
  setRecords: (records) => set({ records }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),
  setCompanyFilter: (companyFilter) => set({ companyFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setDetailOpen: (detailOpen) => set({ detailOpen }),
}));

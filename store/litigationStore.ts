'use client';
import { create } from 'zustand';

export interface LitigationCase {
  CaseID: number;
  CaseNumber: string;
  CaseTitle: string;
  CourtName?: string;
  CategoryName?: string;
  Status: string;
  ByAgainst?: string;
  NextHearingDate?: string;
  LastHearingDate?: string;
  AmountInvolved?: number;
  ProfessionalCost?: number;
  ExternalCounselName?: string;
  InternalAssociateName?: string;
  Remarks?: string;
  CreatedAt: string;
}

interface LitigationStore {
  cases: LitigationCase[];
  loading: boolean;
  error: string | null;
  search: string;
  courtFilter: string;
  statusFilter: string;
  selectedCase: LitigationCase | null;
  drawerOpen: boolean;
  detailOpen: boolean;
  setCases: (cases: LitigationCase[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSearch: (v: string) => void;
  setCourtFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSelectedCase: (c: LitigationCase | null) => void;
  setDrawerOpen: (v: boolean) => void;
  setDetailOpen: (v: boolean) => void;
}

export const useLitigationStore = create<LitigationStore>((set) => ({
  cases: [],
  loading: false,
  error: null,
  search: '',
  courtFilter: '',
  statusFilter: '',
  selectedCase: null,
  drawerOpen: false,
  detailOpen: false,
  setCases: (cases) => set({ cases }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),
  setCourtFilter: (courtFilter) => set({ courtFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedCase: (selectedCase) => set({ selectedCase }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setDetailOpen: (detailOpen) => set({ detailOpen }),
}));

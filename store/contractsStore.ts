'use client';
import { create } from 'zustand';

export interface ContractRecord {
  ContractID: number;
  ContractTitle: string;
  FirstParty: string;
  SecondParty: string;
  CompanyName?: string;
  DepartmentName?: string;
  CategoryName?: string;
  Status: string;
  DateOfSigning?: string;
  DateOfExpiry?: string;
  EffectiveDate?: string;
  ExternalPartyName?: string;
  InternalAssociateName?: string;
  Remarks?: string;
  CreatedAt: string;
}

interface ContractsStore {
  contracts: ContractRecord[];
  loading: boolean;
  error: string | null;
  search: string;
  companyFilter: string;
  statusFilter: string;
  selectedContract: ContractRecord | null;
  drawerOpen: boolean;
  detailOpen: boolean;
  setContracts: (c: ContractRecord[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setSearch: (v: string) => void;
  setCompanyFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSelectedContract: (c: ContractRecord | null) => void;
  setDrawerOpen: (v: boolean) => void;
  setDetailOpen: (v: boolean) => void;
}

export const useContractsStore = create<ContractsStore>((set) => ({
  contracts: [],
  loading: false,
  error: null,
  search: '',
  companyFilter: '',
  statusFilter: '',
  selectedContract: null,
  drawerOpen: false,
  detailOpen: false,
  setContracts: (contracts) => set({ contracts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),
  setCompanyFilter: (companyFilter) => set({ companyFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedContract: (selectedContract) => set({ selectedContract }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setDetailOpen: (detailOpen) => set({ detailOpen }),
}));

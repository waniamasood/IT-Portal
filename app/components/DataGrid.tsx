'use client';

import { AgGridReact } from 'ag-grid-react';
import type { AgGridReactProps } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeAlpine } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

export const darkTheme = themeAlpine.withParams({
  backgroundColor: '#0e0e1e',
  oddRowBackgroundColor: '#10101f',
  headerBackgroundColor: '#121228',
  borderColor: '#1e1e3a',
  rowHoverColor: 'rgba(38,169,225,0.06)',
  selectedRowBackgroundColor: 'rgba(38,169,225,0.12)',
  foregroundColor: '#dde1e9',
  headerForegroundColor: '#94a3b8',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  cellHorizontalPadding: 12,
});

export const ipDarkTheme = themeAlpine.withParams({
  backgroundColor: '#0e0e1e',
  oddRowBackgroundColor: '#10101f',
  headerBackgroundColor: '#121228',
  borderColor: '#1e1e3a',
  rowHoverColor: 'rgba(167,139,250,0.06)',
  selectedRowBackgroundColor: 'rgba(167,139,250,0.12)',
  foregroundColor: '#dde1e9',
  headerForegroundColor: '#94a3b8',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  cellHorizontalPadding: 12,
});

export default function DataGrid({ theme: themeProp, ...props }: AgGridReactProps) {
  return <AgGridReact theme={themeProp ?? darkTheme} {...props} />;
}

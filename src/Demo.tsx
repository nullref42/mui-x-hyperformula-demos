import * as React from 'react';
import {
  DataGridPremium,
  GridRowOrderChangeParams,
  useGridApiRef,
} from '@mui/x-data-grid-premium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { alpha } from '@mui/material/styles';
import {
  useFormulaSupport,
  FormulaColumnDef,
} from 'useFormulaSupport';
import { FormulaBar } from 'FormulaBar';
import { rowData } from 'formulaSupportData';
import { HyperFormulaContext } from 'formulaSupportContext';

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 130, type: 'formula' },
  { field: 'year_1', headerName: 'Year_1', width: 100, type: 'formula' },
  { field: 'year_2', headerName: 'Year_2', width: 100, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 100, type: 'formula' },
  { field: 'sum', headerName: 'Sum', width: 100, type: 'formula' },
];

export default function RowReorderingDemo() {
  const apiRef = useGridApiRef();

  const {
    columns,
    rows,
    formulaBarProps,
    hfContextValue,
    moveRow,
  } = useFormulaSupport({
    columns: baseColumns,
    initialData: rowData,
    apiRef,
  });

  const handleRowOrderChange = React.useCallback(
    (params: GridRowOrderChangeParams) => {
      moveRow(params.oldIndex, params.targetIndex);
    },
    [moveRow],
  );

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        🔀 Row Reordering + HyperFormula
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Drag rows to reorder them. HyperFormula's <code>moveRows()</code> API
        keeps all formula references intact — formulas automatically update to
        reflect the new row positions. Try dragging a data row past the "Total"
        row and observe how SUM/AVERAGE formulas adjust.
      </Alert>

      <HyperFormulaContext.Provider value={hfContextValue}>
        <Box sx={{ mb: 1 }}>
          <FormulaBar {...formulaBarProps} />
        </Box>

        <Box sx={{ height: 400 }}>
          <DataGridPremium
            apiRef={apiRef}
            columns={columns}
            rows={rows}
            rowReordering
            onRowOrderChange={handleRowOrderChange}
            density="compact"
            showColumnVerticalBorder
            showCellVerticalBorder
            disableColumnFilter
            disableColumnMenu
            disableColumnSorting
            hideFooter
            sx={(theme) => ({
              '& .MuiDataGrid-columnHeader': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[800]
                    : theme.palette.grey[100],
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
              },
              '& .row-number-cell': {
                display: 'flex',
                justifyContent: 'center',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[800]
                    : theme.palette.grey[100],
                color: theme.palette.text.primary,
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell:focus': {
                outline: '2px solid #4472C4',
                outlineOffset: '-2px',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha('#4472C4', 0.3)
                    : '#D6DCE5',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: '2px solid #4472C4',
              },
              '& .Mui-selected, .MuiDataGrid-row:hover': {
                backgroundColor: 'transparent !important',
              },
            })}
          />
        </Box>
      </HyperFormulaContext.Provider>
    </Box>
  );
}

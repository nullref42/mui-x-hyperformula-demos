import * as React from 'react';
import {
  DataGridPremium,
  GridAggregationFunction,
  useGridApiRef,
} from '@mui/x-data-grid-premium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import {
  useFormulaSupport,
  FormulaColumnDef,
} from 'useFormulaSupport';
import { FormulaBar } from 'FormulaBar';
import { rowData } from 'formulaSupportData';
import { HyperFormulaContext } from 'formulaSupportContext';

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 160, type: 'formula' },
  {
    field: 'department',
    headerName: 'Department',
    width: 140,
    type: 'formula',
  },
  { field: 'year_1', headerName: 'Year 1', width: 120, type: 'formula' },
  { field: 'year_2', headerName: 'Year 2', width: 120, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 120, type: 'formula' },
  { field: 'sum', headerName: 'Sum', width: 120, type: 'formula' },
];

// Custom aggregation that works with formula-computed string values
const numericSum: GridAggregationFunction<any, number> = {
  apply: ({ values }) => {
    let total = 0;
    values.forEach((value) => {
      const n = parseFloat(value);
      if (!Number.isNaN(n)) {
        total += n;
      }
    });
    return total.toFixed(2);
  },
  columnTypes: ['string', 'number'],
  label: 'Sum',
};

const numericAvg: GridAggregationFunction<any, number> = {
  apply: ({ values }) => {
    let total = 0;
    let count = 0;
    values.forEach((value) => {
      const n = parseFloat(value);
      if (!Number.isNaN(n)) {
        total += n;
        count += 1;
      }
    });
    return count > 0 ? (total / count).toFixed(2) : '0.00';
  },
  columnTypes: ['string', 'number'],
  label: 'Avg',
};

export default function RowGroupingWithHyperFormula() {
  const apiRef = useGridApiRef();

  const {
    columns,
    rows,
    formulaBarProps,
    hfContextValue,
  } = useFormulaSupport({
    columns: baseColumns,
    initialData: rowData,
    apiRef,
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        Row Grouping &amp; Aggregation with HyperFormula
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rows are grouped by <strong>Department</strong>. Numeric columns show{' '}
        <strong>sum</strong> and <strong>average</strong> aggregations computed
        on HyperFormula formula results. Edit any cell formula to see
        aggregations update.
      </Typography>

      <HyperFormulaContext.Provider value={hfContextValue}>
        <Box sx={{ mb: 1 }}>
          <FormulaBar {...formulaBarProps} />
        </Box>

        <DataGridPremium
          apiRef={apiRef}
          columns={columns}
          rows={rows}
          density="compact"
          showColumnVerticalBorder
          showCellVerticalBorder
          disableColumnFilter
          disableColumnMenu
          disableColumnSorting
          rowGroupingColumnMode="single"
          aggregationFunctions={{
            numericSum,
            numericAvg,
          }}
          initialState={{
            rowGrouping: {
              model: ['department'],
            },
            aggregation: {
              model: {
                year_1: 'numericSum',
                year_2: 'numericSum',
                average: 'numericAvg',
                sum: 'numericSum',
              },
            },
          }}
          defaultGroupingExpansionDepth={-1}
          groupingColDef={{
            headerName: 'Department',
            width: 200,
          }}
          sx={(theme) => ({
            height: 500,
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
      </HyperFormulaContext.Provider>
    </Box>
  );
}

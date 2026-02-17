import * as React from 'react';
import {
  DataGridPremium,
  useGridApiRef,
} from '@mui/x-data-grid-premium';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import {
  useFormulaSupport,
  FormulaColumnDef,
} from 'useFormulaSupport';
import { HyperFormulaContext } from 'formulaSupportContext';

// Generate 1500 rows of data with formulas
function generateLargeDataset(count: number) {
  const names = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
    'Iris', 'Jack', 'Karen', 'Leo', 'Mona', 'Nick', 'Olivia', 'Paul',
  ];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    const q1 = Math.round(Math.random() * 10000) / 100;
    const q2 = Math.round(Math.random() * 10000) / 100;
    const q3 = Math.round(Math.random() * 10000) / 100;
    const q4 = Math.round(Math.random() * 10000) / 100;
    const row = i + 1; // 1-indexed for HyperFormula
    rows.push({
      id: i + 1,
      name: `${name} #${i + 1}`,
      q1,
      q2,
      q3,
      q4,
      total: `=SUM(B${row}:E${row})`,
      average: `=AVERAGE(B${row}:E${row})`,
      max_val: `=MAX(B${row}:E${row})`,
      pct_of_total: `=F${row}/IF(F${row}=0,1,F${row})*100`,
    });
  }
  return rows;
}

const ROW_COUNT = 1500;

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 140, type: 'formula' },
  { field: 'q1', headerName: 'Q1', width: 90, type: 'formula' },
  { field: 'q2', headerName: 'Q2', width: 90, type: 'formula' },
  { field: 'q3', headerName: 'Q3', width: 90, type: 'formula' },
  { field: 'q4', headerName: 'Q4', width: 90, type: 'formula' },
  { field: 'total', headerName: 'Total', width: 100, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 100, type: 'formula' },
  { field: 'max_val', headerName: 'Max', width: 90, type: 'formula' },
  { field: 'pct_of_total', headerName: '% of Total', width: 100, type: 'formula' },
];

export default function LargeDatasetPerformanceDemo() {
  const apiRef = useGridApiRef();
  const [loadTime, setLoadTime] = React.useState<number | null>(null);

  // Generate data once
  const largeData = React.useMemo(() => generateLargeDataset(ROW_COUNT), []);

  const {
    columns,
    rows,
    hfContextValue,
  } = useFormulaSupport({
    columns: baseColumns,
    initialData: largeData,
    apiRef,
    useBatchEvaluation: true, // Uses suspendEvaluation/resumeEvaluation
  });

  // Measure when rows are available
  React.useEffect(() => {
    if (rows.length > 0 && loadTime === null) {
      setLoadTime(performance.now());
    }
  }, [rows, loadTime]);

  const startTime = React.useMemo(() => performance.now(), []);
  const elapsed = loadTime !== null ? Math.round(loadTime - startTime) : null;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        🚀 Large Dataset Performance with HyperFormula
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        This demo renders <strong>{ROW_COUNT.toLocaleString()} rows</strong> with{' '}
        <strong>4 formula columns each</strong> (
        {(ROW_COUNT * 4).toLocaleString()} formulas total).
        HyperFormula's <code>suspendEvaluation()</code> /{' '}
        <code>resumeEvaluation()</code> batches all formula computation into a
        single pass, while Data Grid's virtualization ensures only visible rows
        are rendered.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`${ROW_COUNT.toLocaleString()} rows`} color="primary" />
        <Chip label={`${(ROW_COUNT * 4).toLocaleString()} formulas`} color="secondary" />
        <Chip label="9 columns" variant="outlined" />
        {elapsed !== null && (
          <Chip
            label={`Loaded in ${elapsed}ms`}
            color="success"
          />
        )}
        <Chip label="Batch evaluation enabled" color="info" variant="outlined" />
      </Box>

      <HyperFormulaContext.Provider value={hfContextValue}>
        <Box sx={{ height: 600 }}>
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
            pagination
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
            }}
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
            })}
          />
        </Box>
      </HyperFormulaContext.Provider>
    </Box>
  );
}

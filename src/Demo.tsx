import * as React from 'react';
import useId from '@mui/utils/useId';
import {
  DataGridPremium,
  GridSlotProps,
  GridSortModel,
  useGridApiRef,
  useGridApiContext,
  useGridRootProps,
  Toolbar,
  ToolbarButton,
  ExportCsv,
  ExportPrint,
  ExportExcel,
  GridMenu,
} from '@mui/x-data-grid-premium';
import { GridToolbarDivider } from '@mui/x-data-grid/internals';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Theme, alpha } from '@mui/material/styles';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  useFormulaSupport,
  FormulaColumnDef,
  FormulaBarProps,
} from './useFormulaSupport';
import { FormulaBar } from './FormulaBar';
import { HyperFormulaContext } from './formulaSupportContext';

declare module '@mui/x-data-grid-premium' {
  interface ToolbarPropsOverrides {
    formulaBarProps: FormulaBarProps;
    onAddRow: () => void;
    onAddColumn: () => void;
  }
}

const rowData = [
  {
    id: 1,
    name: 'Greg Black',
    year_1: 4.66,
    year_2: '=B1*1.3',
    average: '=AVERAGE(B1:C1)',
    sum: '=SUM(B1:C1)',
  },
  {
    id: 2,
    name: 'Anne Carpenter',
    year_1: 5.25,
    year_2: '=$B$2*30%',
    average: '=AVERAGE(B2:C2)',
    sum: '=SUM(B2:C2)',
  },
  {
    id: 3,
    name: 'Natalie Dem',
    year_1: 3.59,
    year_2: '=B3*2.7+2+1',
    average: '=AVERAGE(B3:C3)',
    sum: '=SUM(B3:C3)',
  },
  {
    id: 4,
    name: 'John Sieg',
    year_1: 12.51,
    year_2: '=B4*(1.22+1)',
    average: '=AVERAGE(B4:C4)',
    sum: '=SUM(B4:C4)',
  },
  {
    id: 5,
    name: 'Chris Aklips',
    year_1: 7.63,
    year_2: '=B5*1.1*SUM(10,20)+1',
    average: '=AVERAGE(B5:C5)',
    sum: '=SUM(B5:C5)',
  },
  {
    id: 6,
    name: 'Maria Lopez',
    year_1: 9.12,
    year_2: '=B6*1.5',
    average: '=AVERAGE(B6:C6)',
    sum: '=SUM(B6:C6)',
  },
  {
    id: 7,
    name: 'David Kim',
    year_1: 1.88,
    year_2: '=B7*3.2',
    average: '=AVERAGE(B7:C7)',
    sum: '=SUM(B7:C7)',
  },
  {
    id: 8,
    name: 'Sarah Chen',
    year_1: 15.40,
    year_2: '=B8*0.8',
    average: '=AVERAGE(B8:C8)',
    sum: '=SUM(B8:C8)',
  },
  {
    id: 9,
    name: 'Omar Patel',
    year_1: 6.77,
    year_2: '=B9*2.1',
    average: '=AVERAGE(B9:C9)',
    sum: '=SUM(B9:C9)',
  },
  {
    id: 10,
    name: 'Lisa Zhang',
    year_1: 0.95,
    year_2: '=B10*10',
    average: '=AVERAGE(B10:C10)',
    sum: '=SUM(B10:C10)',
  },
  {
    id: 11,
    name: 'Total',
    year_1: '=SUM(B1:B10)',
    year_2: '=SUM(C1:C10)',
    average: '=IF(SUM(D1:D10)>100, "Greater than 100", "Less than 100")',
    sum: '=SUM(E1:E10)',
  },
];

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 140, type: 'formula' },
  { field: 'year_1', headerName: 'Year_1', width: 100, type: 'formula' },
  { field: 'year_2', headerName: 'Year_2', width: 100, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 110, type: 'formula' },
  { field: 'sum', headerName: 'Sum', width: 110, type: 'formula' },
];

const getButtonSx = (theme: Theme) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: '4px',
  color: theme.palette.text.primary,
  fontFamily: '"Calibri", "Segoe UI", sans-serif',
  fontSize: '12px',
  fontWeight: 500,
  textTransform: 'none',
  px: 2,
  height: '34px',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[200],
    borderColor:
      theme.palette.mode === 'dark'
        ? theme.palette.grey[600]
        : theme.palette.grey[400],
  },
});

function CustomToolbar(props: GridSlotProps['toolbar']) {
  const { formulaBarProps, onAddRow, onAddColumn, excelOptions } = props;
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const exportMenuId = useId();
  const exportMenuTriggerId = useId();

  const closeExportMenu = () => setExportMenuOpen(false);

  return (
    <Toolbar>
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormulaBar {...formulaBarProps} />
      </Box>
      <GridToolbarDivider />
      <rootProps.slots.baseTooltip title="Add Row">
        <ToolbarButton onClick={onAddRow}>
          <PostAddIcon fontSize="small" />
        </ToolbarButton>
      </rootProps.slots.baseTooltip>
      <rootProps.slots.baseTooltip title="Add Column">
        <ToolbarButton onClick={onAddColumn}>
          <PlaylistAddIcon fontSize="small" />
        </ToolbarButton>
      </rootProps.slots.baseTooltip>
      <GridToolbarDivider />
      <rootProps.slots.baseTooltip
        title={apiRef.current.getLocaleText('toolbarExport')}
        disableInteractive={exportMenuOpen}
      >
        <ToolbarButton
          ref={exportMenuTriggerRef}
          id={exportMenuTriggerId}
          aria-controls={exportMenuId}
          aria-haspopup="true"
          aria-expanded={exportMenuOpen ? 'true' : undefined}
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
        >
          <rootProps.slots.exportIcon fontSize="small" />
        </ToolbarButton>
      </rootProps.slots.baseTooltip>
      <GridMenu
        target={exportMenuTriggerRef.current}
        open={exportMenuOpen}
        onClose={closeExportMenu}
        position="bottom-end"
      >
        <rootProps.slots.baseMenuList
          id={exportMenuId}
          aria-labelledby={exportMenuTriggerId}
          autoFocusItem
          {...rootProps.slotProps?.baseMenuList}
        >
          <ExportPrint
            render={<rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />}
            onClick={closeExportMenu}
          >
            {apiRef.current.getLocaleText('toolbarExportPrint')}
          </ExportPrint>
          <ExportCsv
            render={<rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />}
            onClick={closeExportMenu}
          >
            {apiRef.current.getLocaleText('toolbarExportCSV')}
          </ExportCsv>
          <ExportExcel
            render={<rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />}
            options={excelOptions}
            onClick={closeExportMenu}
          >
            {apiRef.current.getLocaleText('toolbarExportExcel')}
          </ExportExcel>
        </rootProps.slots.baseMenuList>
      </GridMenu>
    </Toolbar>
  );
}

export default function SortingWithHyperFormula() {
  const apiRef = useGridApiRef();
  const [columnDialogOpen, setColumnDialogOpen] = React.useState(false);
  const [newFieldName, setNewFieldName] = React.useState('');
  const [newColumnName, setNewColumnName] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

  const {
    columns,
    rows,
    formulaBarProps,
    hfContextValue,
    addRow,
    addColumn,
    isFieldDuplicate,
    sortRows,
  } = useFormulaSupport({
    columns: baseColumns,
    initialData: rowData,
    apiRef,
  });

  // The last row (Total) is an aggregate row — exclude from sorting, pin to bottom
  const totalRowIndex = rowData.length - 1;

  const handleSortModelChange = React.useCallback(
    (newSortModel: GridSortModel) => {
      setSortModel(newSortModel);
      if (newSortModel.length > 0) {
        sortRows(newSortModel, [totalRowIndex]);
      }
    },
    [sortRows, totalRowIndex],
  );

  // Split rows: data rows for the grid, Total row pinned at bottom
  const dataRows = React.useMemo(() => rows.filter((_, i) => i !== totalRowIndex), [rows, totalRowIndex]);
  const pinnedRows = React.useMemo(() => ({
    bottom: rows.filter((_, i) => i === totalRowIndex),
  }), [rows, totalRowIndex]);

  const handleOpenColumnDialog = () => {
    setNewFieldName('');
    setNewColumnName('');
    setFieldError('');
    setColumnDialogOpen(true);
  };

  const handleCloseColumnDialog = () => {
    setColumnDialogOpen(false);
    setNewFieldName('');
    setNewColumnName('');
    setFieldError('');
  };

  const validateFieldName = (field: string) => {
    if (field.trim() && isFieldDuplicate(field)) {
      setFieldError('Field name already exists');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleFieldNameChange = (value: string) => {
    setNewFieldName(value);
    validateFieldName(value);
  };

  const canAddColumn = newFieldName.trim() && newColumnName.trim() && !fieldError;

  const handleAddColumn = () => {
    if (canAddColumn && validateFieldName(newFieldName)) {
      addColumn(newFieldName, newColumnName);
      handleCloseColumnDialog();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <HyperFormulaContext.Provider value={hfContextValue}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 1,
            color: 'text.secondary',
            fontFamily: '"Calibri", "Segoe UI", sans-serif',
          }}
        >
          💡 Click column headers to sort. Sorting physically rearranges rows in
          HyperFormula via <code>setRowOrder()</code> — formula references update
          automatically. The Total row is pinned at the bottom (excluded from sorting).
        </Typography>

        <Dialog open={columnDialogOpen} onClose={handleCloseColumnDialog}>
          <DialogTitle sx={{ fontFamily: '"Calibri", "Segoe UI", sans-serif' }}>
            Add Column
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Field Name"
              fullWidth
              variant="outlined"
              value={newFieldName}
              onChange={(event) => handleFieldNameChange(event.target.value)}
              error={!!fieldError}
              helperText={fieldError}
              size="small"
              sx={{ mt: 1, '& .MuiInputBase-root': { fontFamily: '"Calibri", "Segoe UI", sans-serif' } }}
            />
            <TextField
              margin="dense"
              label="Column Name"
              fullWidth
              variant="outlined"
              value={newColumnName}
              onChange={(event) => setNewColumnName(event.target.value)}
              size="small"
              sx={{ mt: 1, '& .MuiInputBase-root': { fontFamily: '"Calibri", "Segoe UI", sans-serif' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseColumnDialog} sx={(theme) => getButtonSx(theme)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddColumn}
              disabled={!canAddColumn}
              sx={(theme) => ({
                ...getButtonSx(theme),
                backgroundColor: canAddColumn ? '#4472C4' : undefined,
                color: canAddColumn ? '#fff' : undefined,
                '&:hover': { backgroundColor: canAddColumn ? '#3861a8' : undefined },
                mr: 0.5,
              })}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <DataGridPremium
          apiRef={apiRef}
          columns={columns}
          rows={dataRows}
          pinnedRows={pinnedRows}
          density="compact"
          tabNavigation="all"
          showColumnVerticalBorder
          showCellVerticalBorder
          disableColumnFilter
          disableColumnMenu
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          hideFooter
          historyStackSize={0}
          showToolbar
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              formulaBarProps,
              onAddRow: addRow,
              onAddColumn: handleOpenColumnDialog,
              excelOptions: { escapeFormulas: false },
            },
          }}
          sx={(theme) => ({
            '& .MuiDataGrid-columnHeader': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[800]
                  : theme.palette.grey[100],
            },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
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
                theme.palette.mode === 'dark' ? alpha('#4472C4', 0.3) : '#D6DCE5',
            },
            '& .MuiDataGrid-cell:focus-within': { outline: '2px solid #4472C4' },
            '& .Mui-selected, .MuiDataGrid-row:hover': {
              backgroundColor: 'transparent !important',
            },
          })}
        />
      </HyperFormulaContext.Provider>
    </Box>
  );
}

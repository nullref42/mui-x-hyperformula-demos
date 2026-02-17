import * as React from 'react';
import useId from '@mui/utils/useId';
import {
  DataGridPremium,
  GridSlotProps,
  GridCellParams,
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
import { CellType, DetailedCellError } from 'hyperformula';
import {
  useFormulaSupport,
  FormulaColumnDef,
  FormulaBarProps,
} from 'useFormulaSupport';
import { FormulaBar } from 'FormulaBar';
import { rowData } from 'formulaSupportData';
import { HyperFormulaContext } from 'formulaSupportContext';

declare module '@mui/x-data-grid-premium' {
  interface ToolbarPropsOverrides {
    formulaBarProps: FormulaBarProps;
    onAddRow: () => void;
    onAddColumn: () => void;
  }
}

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 130, type: 'formula' },
  { field: 'year_1', headerName: 'Year_1', width: 100, type: 'formula' },
  { field: 'year_2', headerName: 'Year_2', width: 100, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 100, type: 'formula' },
  { field: 'sum', headerName: 'Sum', width: 100, type: 'formula' },
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
            render={
              <rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />
            }
            onClick={closeExportMenu}
          >
            {apiRef.current.getLocaleText('toolbarExportPrint')}
          </ExportPrint>
          <ExportCsv
            render={
              <rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />
            }
            onClick={closeExportMenu}
          >
            {apiRef.current.getLocaleText('toolbarExportCSV')}
          </ExportCsv>
          <ExportExcel
            render={
              <rootProps.slots.baseMenuItem {...rootProps.slotProps?.baseMenuItem} />
            }
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

/**
 * Legend explaining the conditional styling colors.
 */
function StyleLegend() {
  const items = [
    { color: '#e8eaf6', border: '#9fa8da', label: 'Formula cell' },
    { color: '#ffebee', border: '#ef9a9a', label: 'Error value' },
    { color: '#e8f5e9', border: '#a5d6a7', label: 'Value > 100' },
    { color: '#fff3e0', border: '#ffcc80', label: 'Value < 0' },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', px: 1, pt: 1 }}>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              backgroundColor: item.color,
              border: `1px solid ${item.border}`,
              borderRadius: '2px',
            }}
          />
          <Box
            component="span"
            sx={{ fontSize: 11, fontFamily: '"Calibri", sans-serif' }}
          >
            {item.label}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function ExcelFormulaSupport() {
  const apiRef = useGridApiRef();
  const [columnDialogOpen, setColumnDialogOpen] = React.useState(false);
  const [newFieldName, setNewFieldName] = React.useState('');
  const [newColumnName, setNewColumnName] = React.useState('');
  const [fieldError, setFieldError] = React.useState('');

  const {
    columns,
    rows,
    formulaBarProps,
    hfContextValue,
    addRow,
    addColumn,
    isFieldDuplicate,
  } = useFormulaSupport({
    columns: baseColumns,
    initialData: rowData,
    apiRef,
  });

  // ── Conditional styling using HyperFormula's getCellType() API ──────────
  // Uses getCellType() to detect formulas and DetailedCellError for errors.
  // Numeric values are styled based on thresholds (> 100 green, < 0 orange).
  const getCellClassName = React.useCallback(
    (params: GridCellParams) => {
      const { hf, sheetId, columnFieldMap } = hfContextValue;
      if (!hf || params.field === 'row_number' || params.field === '__check__') {
        return '';
      }

      const colIndex = columnFieldMap.get(params.field);
      if (colIndex === undefined) return '';

      const hfRowIndex = (params.row as any)._hfRowIndex as number;
      const addr = { sheet: sheetId, row: hfRowIndex, col: colIndex };

      const cellType = hf.getCellType(addr);
      const cellValue = hf.getCellValue(addr);

      // Error cells get highest priority styling
      if (cellValue instanceof DetailedCellError) {
        return 'hf-cell-error';
      }

      const classes: string[] = [];

      // Formula cells get a subtle indigo background
      if (cellType === CellType.FORMULA) {
        classes.push('hf-cell-formula');
      }

      // Value-based conditional styling
      const num = typeof cellValue === 'number' ? cellValue : NaN;
      if (!isNaN(num)) {
        if (num > 100) classes.push('hf-cell-high');
        else if (num < 0) classes.push('hf-cell-negative');
      }

      return classes.join(' ');
    },
    [hfContextValue],
  );

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
        <StyleLegend />

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
              sx={{
                mt: 1,
                '& .MuiInputBase-root': {
                  fontFamily: '"Calibri", "Segoe UI", sans-serif',
                },
              }}
            />
            <TextField
              margin="dense"
              label="Column Name"
              fullWidth
              variant="outlined"
              value={newColumnName}
              onChange={(event) => setNewColumnName(event.target.value)}
              size="small"
              sx={{
                mt: 1,
                '& .MuiInputBase-root': {
                  fontFamily: '"Calibri", "Segoe UI", sans-serif',
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseColumnDialog}
              sx={(theme) => getButtonSx(theme)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddColumn}
              disabled={!canAddColumn}
              sx={(theme) => {
                const baseButtonSx = getButtonSx(theme);
                const disabledBg =
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[800]
                    : theme.palette.grey[100];
                const disabledHoverBg =
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[700]
                    : theme.palette.grey[200];

                return {
                  ...baseButtonSx,
                  backgroundColor: canAddColumn ? '#4472C4' : disabledBg,
                  color: canAddColumn ? '#fff' : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: canAddColumn ? '#3861a8' : disabledHoverBg,
                  },
                  mr: 0.5,
                };
              }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <DataGridPremium
          apiRef={apiRef}
          columns={columns}
          rows={rows}
          getCellClassName={getCellClassName}
          density="compact"
          tabNavigation="all"
          showColumnVerticalBorder
          showCellVerticalBorder
          disableColumnFilter
          disableColumnMenu
          disableColumnSorting
          hideFooter
          historyStackSize={0}
          showToolbar
          slots={{
            toolbar: CustomToolbar,
          }}
          slotProps={{
            toolbar: {
              formulaBarProps,
              onAddRow: addRow,
              onAddColumn: handleOpenColumnDialog,
              excelOptions: {
                escapeFormulas: false,
              },
            },
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

            '& .Mui-selected, .MuiDataGrid-row:hover': {
              backgroundColor: 'transparent !important',
            },

            // ── Conditional styling classes ──
            '& .hf-cell-formula': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha('#7986cb', 0.15)
                  : '#e8eaf6',
            },
            '& .hf-cell-error': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha('#ef5350', 0.25)
                  : '#ffebee',
              color: '#d32f2f',
              fontWeight: 600,
            },
            '& .hf-cell-high': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha('#66bb6a', 0.15)
                  : '#e8f5e9',
            },
            '& .hf-cell-negative': {
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha('#ffa726', 0.15)
                  : '#fff3e0',
              color: '#e65100',
            },
          })}
        />
      </HyperFormulaContext.Provider>
    </Box>
  );
}

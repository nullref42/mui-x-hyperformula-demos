import * as React from 'react';
import useId from '@mui/utils/useId';
import {
  DataGridPremium,
  GridSlotProps,
  useGridApiRef,
  useGridApiContext,
  useGridRootProps,
  Toolbar,
  ToolbarButton,
  ExportCsv,
  ExportPrint,
  ExportExcel,
  GridMenu,
  QuickFilter,
  QuickFilterControl,
} from '@mui/x-data-grid-premium';
import { GridToolbarDivider } from '@mui/x-data-grid/internals';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Theme, alpha } from '@mui/material/styles';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import SearchIcon from '@mui/icons-material/Search';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import {
  useFormulaSupport,
  FormulaColumnDef,
  FormulaBarProps,
} from 'useFormulaSupport';
import { FormulaBar } from 'FormulaBar';
import { HyperFormulaContext } from 'formulaSupportContext';

declare module '@mui/x-data-grid-premium' {
  interface ToolbarPropsOverrides {
    formulaBarProps: FormulaBarProps;
    onAddRow: () => void;
    onAddColumn: () => void;
  }
}

// More rows to make filtering meaningful
const rowData = [
  { id: 1, name: 'Greg Black', year_1: 4.66, year_2: '=B1*1.3', average: '=AVERAGE(B1:C1)', sum: '=SUM(B1:C1)' },
  { id: 2, name: 'Anne Carpenter', year_1: 5.25, year_2: '=$B$2*30%', average: '=AVERAGE(B2:C2)', sum: '=SUM(B2:C2)' },
  { id: 3, name: 'Natalie Dem', year_1: 3.59, year_2: '=B3*2.7+2+1', average: '=AVERAGE(B3:C3)', sum: '=SUM(B3:C3)' },
  { id: 4, name: 'John Sieg', year_1: 12.51, year_2: '=B4*(1.22+1)', average: '=AVERAGE(B4:C4)', sum: '=SUM(B4:C4)' },
  { id: 5, name: 'Chris Aklips', year_1: 7.63, year_2: '=B5*1.1*SUM(10,20)+1', average: '=AVERAGE(B5:C5)', sum: '=SUM(B5:C5)' },
  { id: 6, name: 'Maria Lopez', year_1: 9.12, year_2: '=B6*1.5', average: '=AVERAGE(B6:C6)', sum: '=SUM(B6:C6)' },
  { id: 7, name: 'David Chen', year_1: 2.34, year_2: '=B7*3.0', average: '=AVERAGE(B7:C7)', sum: '=SUM(B7:C7)' },
  { id: 8, name: 'Sarah Miller', year_1: 15.75, year_2: '=B8*0.8', average: '=AVERAGE(B8:C8)', sum: '=SUM(B8:C8)' },
  { id: 9, name: 'James Wilson', year_1: 6.88, year_2: '=B9*2.2', average: '=AVERAGE(B9:C9)', sum: '=SUM(B9:C9)' },
  { id: 10, name: 'Emily Brown', year_1: 1.45, year_2: '=B10*4.0+5', average: '=AVERAGE(B10:C10)', sum: '=SUM(B10:C10)' },
  { id: 11, name: 'Robert Taylor', year_1: 11.30, year_2: '=B11*1.1', average: '=AVERAGE(B11:C11)', sum: '=SUM(B11:C11)' },
  { id: 12, name: 'Lisa Anderson', year_1: 8.92, year_2: '=B12*0.5+3', average: '=AVERAGE(B12:C12)', sum: '=SUM(B12:C12)' },
  { id: 13, name: 'Michael Davis', year_1: 14.20, year_2: '=B13*1.75', average: '=AVERAGE(B13:C13)', sum: '=SUM(B13:C13)' },
  { id: 14, name: 'Jennifer White', year_1: 3.10, year_2: '=B14*2.5+1', average: '=AVERAGE(B14:C14)', sum: '=SUM(B14:C14)' },
  { id: 15, name: 'Total', year_1: '=SUM(B1:B14)', year_2: '=SUM(C1:C14)', average: '=IF(SUM(D1:D14)>100, "Greater than 100", "Less than 100")', sum: '=SUM(E1:E14)' },
];

const baseColumns: FormulaColumnDef[] = [
  { field: 'name', headerName: 'Name', width: 150, type: 'formula' },
  { field: 'year_1', headerName: 'Year 1', width: 120, type: 'formula' },
  { field: 'year_2', headerName: 'Year 2', width: 120, type: 'formula' },
  { field: 'average', headerName: 'Average', width: 120, type: 'formula' },
  { field: 'sum', headerName: 'Sum', width: 120, type: 'formula' },
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
      {/* Formula Bar */}
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <FormulaBar {...formulaBarProps} />
      </Box>

      <GridToolbarDivider />

      {/* Quick Filter / Search */}
      <QuickFilter>
        <QuickFilterControl
          render={({ ref, ...other }) => (
            <TextField
              {...other}
              inputRef={ref}
              size="small"
              placeholder="Search…"
              slotProps={{
                input: {
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                  sx: { fontFamily: '"Calibri", "Segoe UI", sans-serif', fontSize: '12px' },
                },
              }}
              sx={{ width: 180 }}
            />
          )}
        />
      </QuickFilter>

      <GridToolbarDivider />

      {/* Add Row/Column Buttons */}
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

      {/* Export Menu */}
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

export default function FilteringWithHyperFormula() {
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
        {/* Info banner */}
        <Box sx={{ mb: 1, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
          <Typography variant="body2" sx={{ fontFamily: '"Calibri", "Segoe UI", sans-serif', fontSize: 13 }}>
            <strong>Filtering with HyperFormula:</strong> Column filters and the quick
            search bar operate on <em>computed values</em> returned by HyperFormula,
            not on the raw formula strings. Try filtering Year 2 by &gt; 10, or search
            for a name.
          </Typography>
        </Box>

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

        <StyleLegend />
        <DataGridPremium
          apiRef={apiRef}
          columns={columns}
          rows={rows}
          getCellClassName={getCellClassName}
          density="compact"
          tabNavigation="all"
          showColumnVerticalBorder
          showCellVerticalBorder
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
                theme.palette.mode === 'dark' ? alpha('#4472C4', 0.3) : '#D6DCE5',
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

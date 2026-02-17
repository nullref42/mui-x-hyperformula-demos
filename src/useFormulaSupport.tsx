import * as React from 'react';
import HyperFormula, { RawCellContent } from 'hyperformula';
import {
  GridColDef,
  GridRowModel,
  GridRowId,
  GridRenderEditCellParams,
  GridColumnHeaderParams,
  GridCellParams,
  GridValueGetter,
  GridCellEditStopParams,
  GridCellEditStopReasons,
  GridSortModel,
  useGridApiRef,
  DataGridProps,
} from '@mui/x-data-grid';
import { useEventCallback } from '@mui/material/utils';
import useOnMount from '@mui/utils/useOnMount';
import { FormulaEditCell } from './FormulaEditCell';
import { TitleWithAlphabet } from './TitleWithAlphabet';
import { HyperFormulaContextValue } from './formulaSupportContext';

export type FormulaColumnDef = Omit<GridColDef, 'type'> & {
  type?: GridColDef['type'] | 'formula';
};

export interface UseFormulaSupportOptions {
  columns: FormulaColumnDef[];
  initialData: Record<string, RawCellContent>[];
  apiRef: ReturnType<typeof useGridApiRef>;
  getRowId?: (row: Record<string, RawCellContent>, index: number) => GridRowId;
  sheetName?: string;
}

export interface FormulaBarProps {
  value: string;
  onChange: (value: string) => void;
  isFormula: boolean;
  field: string;
  rowNumber: number | null;
  colIndex: number | null;
}

export interface UseFormulaSupportResult {
  columns: GridColDef[];
  rows: GridRowModel[];
  formulaBarProps: FormulaBarProps;
  currentFormula: string;
  currentField: string;
  isFormula: boolean;
  hfContextValue: HyperFormulaContextValue;
  addRow: () => void;
  addColumn: (field: string, headerName: string) => void;
  isFieldDuplicate: (field: string) => boolean;
  /**
   * Move a row from one index to another using HyperFormula's moveRows() API.
   * This keeps all formula references intact.
   */
  moveRow: (sourceIndex: number, targetIndex: number) => void;
  /**
   * Sort rows in HyperFormula using moveRows() so formula references update.
   * Uses sortingMode="server" pattern — the grid delegates sorting to HF.
   */
  sortRows: (sortModel: GridSortModel) => void;
}

interface HFRow extends GridRowModel {
  id: GridRowId;
  _hfRowIndex: number;
  row_number: number;
}

const rowNumberColumn: GridColDef = {
  field: 'row_number',
  headerName: '',
  width: 50,
  minWidth: 50,
  maxWidth: 80,
  disableColumnMenu: true,
  sortable: false,
  editable: false,
  disableExport: true,
  cellClassName: 'row-number-cell',
};

const defaultGetRowId: DataGridProps['getRowId'] = (row) => row.id;

export function useFormulaSupport(
  options: UseFormulaSupportOptions,
): UseFormulaSupportResult {
  const {
    columns,
    initialData,
    apiRef,
    getRowId = defaultGetRowId,
    sheetName = 'Sheet1',
  } = options;

  const hfRef = React.useRef<{ hf: HyperFormula; sheetId: number } | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [rowCount, setRowCount] = React.useState(initialData.length);
  const nextRowIdRef = React.useRef(
    initialData.reduce((max, row) => {
      const id = typeof row.id === 'number' ? row.id : 0;
      return Math.max(max, id);
    }, 0) + 1,
  );
  const [dynamicColumns, setDynamicColumns] =
    React.useState<FormulaColumnDef[]>(columns);

  const [currentField, setCurrentField] = React.useState<string>('');
  const [currentRow, setCurrentRow] = React.useState<HFRow | null>(null);
  const [currentFormula, setCurrentFormula] = React.useState<string>('');
  const isFormula = currentFormula.startsWith('=');
  const isEditingRef = React.useRef(false);
  const editingStateRef = React.useRef({
    field: '',
    row: null as HFRow | null,
    formula: '',
  });

  const formulaColumns = React.useMemo(
    () => dynamicColumns.filter((col) => col.type === 'formula'),
    [dynamicColumns],
  );

  const columnFieldMap = React.useMemo(() => {
    const map = new Map<string, number>();
    formulaColumns.forEach((col, index) => {
      map.set(col.field, index);
    });
    return map;
  }, [formulaColumns]);

  const dataArray = React.useMemo(
    () => initialData.map((row) => formulaColumns.map((col) => row[col.field])),
    [initialData, formulaColumns],
  );

  useOnMount(() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
    const name = hf.addSheet(sheetName);
    const sheetId = hf.getSheetId(name)!;
    hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, dataArray);
    hfRef.current = { hf, sheetId };
    setIsInitialized(true);
    return () => {
      hf.destroy();
    };
  });

  // Stable map: HF row index → GridRowId (survives physical row rearrangement)
  const rowIdMapRef = React.useRef<Map<number, GridRowId>>(
    new Map(initialData.map((row, i) => [i, getRowId?.(row, i) ?? i])),
  );

  // Version counter to force re-render after sort/move operations
  const [hfVersion, setHfVersion] = React.useState(0);

  const rows = React.useMemo<HFRow[]>(() => {
    if (!hfRef.current) {
      return [];
    }
    return Array.from({ length: rowCount }, (_, i) => {
      const rowId = rowIdMapRef.current.get(i) ?? i;
      return {
        id: rowId,
        _hfRowIndex: i,
        row_number: i + 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, rowCount, hfVersion]);

  const getCellValue = useEventCallback((hfRowIndex: number, colIndex: number) => {
    if (!hfRef.current) {
      return null;
    }
    const { hf, sheetId } = hfRef.current;
    const value = hf.getCellValue({
      sheet: sheetId,
      row: hfRowIndex,
      col: colIndex,
    });
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(2);
    }
    return value;
  });

  const getCellFormula = useEventCallback((hfRowIndex: number, colIndex: number) => {
    if (!hfRef.current) {
      return '';
    }
    const { hf, sheetId } = hfRef.current;
    return (
      hf.getCellSerialized({ sheet: sheetId, row: hfRowIndex, col: colIndex }) ?? ''
    );
  });

  const adjustFormulaForExcelHeaders = useEventCallback(
    (cellContent: RawCellContent | ''): RawCellContent | '' => {
      if (typeof cellContent !== 'string' || !cellContent.startsWith('=')) {
        return cellContent;
      }
      return cellContent.replace(
        /(\$?)([A-Z]+)(\$?)(\d+)/gi,
        (_match, colDollar, col, rowDollar, row) => {
          const newRow = parseInt(row, 10) + 1;
          return `${colDollar}${col}${rowDollar}${newRow}`;
        },
      );
    },
  );

  const commitCellValue = useEventCallback(
    (hfRowIndex: number, colIndex: number, value: string) => {
      if (!hfRef.current) {
        return;
      }
      const { hf, sheetId } = hfRef.current;
      hf.setCellContents({ sheet: sheetId, row: hfRowIndex, col: colIndex }, [
        [value],
      ]);
    },
  );

  const handleCellFormulaChange = useEventCallback((newValue: string) => {
    setCurrentFormula(newValue);
    editingStateRef.current.formula = newValue;
  });

  const handleFormulaBarChange = useEventCallback((newValue: string) => {
    if (!currentRow || !currentField) {
      return;
    }
    const colIndex = columnFieldMap.get(currentField);
    if (colIndex === undefined) {
      return;
    }
    setCurrentFormula(newValue);
    editingStateRef.current.formula = newValue;
    commitCellValue(currentRow._hfRowIndex, colIndex, newValue);
  });

  React.useEffect(() => {
    if (!apiRef.current) {
      return undefined;
    }

    const handleCellFocusIn = (params: GridCellParams) => {
      const { field, row, isEditable } = params;
      if (!isEditable) {
        setCurrentFormula('');
        setCurrentField('');
        setCurrentRow(null);
        editingStateRef.current = { field: '', row: null, formula: '' };
        return;
      }
      const hfRow = row as HFRow;
      const colIndex = columnFieldMap.get(field);
      if (colIndex === undefined) {
        return;
      }
      const formula = getCellFormula(hfRow._hfRowIndex, colIndex);
      const formulaStr = String(formula ?? '');
      setCurrentFormula(formulaStr);
      setCurrentField(field);
      setCurrentRow(hfRow);
      editingStateRef.current = { field, row: hfRow, formula: formulaStr };
    };

    const handleCellEditStart = () => {
      isEditingRef.current = true;
    };

    const handleCellEditStop = (params: GridCellEditStopParams) => {
      isEditingRef.current = false;
      const { row, field, formula } = editingStateRef.current;
      if (params.reason === GridCellEditStopReasons.escapeKeyDown) {
        if (row && field) {
          const colIndex = columnFieldMap.get(field);
          if (colIndex !== undefined) {
            const originalFormula = getCellFormula(row._hfRowIndex, colIndex);
            const originalFormulaStr = String(originalFormula ?? '');
            setCurrentFormula(originalFormulaStr);
            editingStateRef.current.formula = originalFormulaStr;
          }
        }
        return;
      }
      if (row && field) {
        const colIndex = columnFieldMap.get(field);
        if (colIndex !== undefined) {
          commitCellValue(row._hfRowIndex, colIndex, formula);
        }
      }
    };

    const unsubscribeFocus = apiRef.current.subscribeEvent(
      'cellFocusIn',
      handleCellFocusIn,
    );
    const unsubscribeEditStart = apiRef.current.subscribeEvent(
      'cellEditStart',
      handleCellEditStart,
    );
    const unsubscribeEditStop = apiRef.current.subscribeEvent(
      'cellEditStop',
      handleCellEditStop,
    );

    return () => {
      unsubscribeFocus();
      unsubscribeEditStart();
      unsubscribeEditStop();
    };
  }, [apiRef, columnFieldMap, getCellFormula, commitCellValue]);

  const createValueGetter = useEventCallback(
    (colIndex: number): GridValueGetter<HFRow> =>
      (_value, row) => {
        return getCellValue(row._hfRowIndex, colIndex);
      },
  );

  const createExcelValueGetter = useEventCallback(
    (colIndex: number): GridValueGetter<HFRow> =>
      (_value, row) => {
        const formula = getCellFormula(row._hfRowIndex, colIndex);
        return adjustFormulaForExcelHeaders(formula ?? '');
      },
  );

  const enhancedColumns = React.useMemo(() => {
    const formulaEnhancedColumns = dynamicColumns.map((col) => {
      if (col.type !== 'formula') {
        return col;
      }
      const colIndex = columnFieldMap.get(col.field);
      if (colIndex === undefined) {
        return col;
      }
      return {
        ...col,
        type: 'string' as const,
        editable: col.editable !== false,
        valueGetter: createValueGetter(colIndex),
        excelValueGetter: createExcelValueGetter(colIndex),
        renderEditCell: (params: GridRenderEditCellParams) => (
          <FormulaEditCell {...params} onChange={handleCellFormulaChange} />
        ),
        renderHeader: (params: GridColumnHeaderParams) => (
          <TitleWithAlphabet {...params} />
        ),
      };
    });
    return [rowNumberColumn, ...formulaEnhancedColumns];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dynamicColumns,
    columnFieldMap,
    createValueGetter,
    createExcelValueGetter,
    handleCellFormulaChange,
    isInitialized,
    hfVersion,
  ]);

  const formulaBarProps = React.useMemo<FormulaBarProps>(() => {
    const colIndex = currentField
      ? (apiRef.current?.getColumnIndexRelativeToVisibleColumns(currentField) ??
        null)
      : null;
    return {
      value: currentFormula,
      onChange: handleFormulaBarChange,
      isFormula,
      field: currentField,
      rowNumber: currentRow?.row_number ?? null,
      colIndex,
    };
  }, [
    currentFormula,
    handleFormulaBarChange,
    isFormula,
    currentField,
    currentRow,
    apiRef,
  ]);

  const hfContextValue = React.useMemo<HyperFormulaContextValue>(() => {
    if (!hfRef.current) {
      return {
        hf: null as unknown as HyperFormula,
        sheetId: 0,
        version: isInitialized ? 1 : 0,
        columnFieldMap,
      };
    }
    return {
      hf: hfRef.current.hf,
      sheetId: hfRef.current.sheetId,
      version: isInitialized ? 1 : 0,
      columnFieldMap,
    };
  }, [isInitialized, columnFieldMap]);

  const addRow = useEventCallback(() => {
    if (!hfRef.current) {
      return;
    }
    const { hf, sheetId } = hfRef.current;
    hf.addRows(sheetId, [rowCount, 1]);
    const newRowId = nextRowIdRef.current;
    nextRowIdRef.current += 1;
    rowIdMapRef.current.set(rowCount, newRowId);
    setRowCount((prev) => prev + 1);
  });

  const isFieldDuplicate = useEventCallback((field: string) => {
    const normalizedField = field.trim().toLowerCase();
    return dynamicColumns.some((col) => col.field.toLowerCase() === normalizedField);
  });

  const addColumn = useEventCallback((field: string, headerName: string) => {
    if (!hfRef.current || !field.trim() || !headerName.trim()) {
      return;
    }
    if (isFieldDuplicate(field)) {
      return;
    }
    const { hf, sheetId } = hfRef.current;
    const newColIndex = formulaColumns.length;
    hf.addColumns(sheetId, [newColIndex, 1]);
    const newColumn: FormulaColumnDef = {
      field: field.trim(),
      headerName: headerName.trim(),
      width: 150,
      type: 'formula',
    };
    setDynamicColumns((prev) => [...prev, newColumn]);
  });

  /**
   * Move a row using HyperFormula's moveRows() API.
   */
  const moveRow = useEventCallback((sourceIndex: number, targetIndex: number) => {
    if (!hfRef.current || sourceIndex === targetIndex) {
      return;
    }
    const { hf, sheetId } = hfRef.current;
    hf.moveRows(sheetId, [sourceIndex], targetIndex);

    // Rebuild row ID map after move
    const oldMap = new Map(rowIdMapRef.current);
    const newMap = new Map<number, GridRowId>();
    const numRows = hf.getSheetDimensions(sheetId).height;
    const adjustedTarget = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;

    for (let i = 0; i < numRows; i++) {
      let oldIdx: number;
      if (i === adjustedTarget) {
        oldIdx = sourceIndex;
      } else if (sourceIndex < adjustedTarget) {
        oldIdx = i >= sourceIndex && i < adjustedTarget ? i + 1 : i;
      } else {
        oldIdx = i > adjustedTarget && i <= sourceIndex ? i - 1 : i;
      }
      const id = oldMap.get(oldIdx);
      if (id !== undefined) newMap.set(i, id);
    }
    rowIdMapRef.current = newMap;
    setHfVersion((v) => v + 1);
  });

  /**
   * Sort rows in HyperFormula using setRowOrder() — a single atomic operation
   * that physically rearranges rows and updates all formula references.
   */
  const sortRows = useEventCallback((sortModel: GridSortModel) => {
    if (!hfRef.current || sortModel.length === 0) {
      return;
    }
    const { hf, sheetId } = hfRef.current;
    const numRows = hf.getSheetDimensions(sheetId).height;
    if (numRows === 0) return;

    // 1. Read computed values for sort columns
    const rowEntries = Array.from({ length: numRows }, (_, i) => {
      const values: Record<string, any> = {};
      for (const [field, colIdx] of columnFieldMap.entries()) {
        values[field] = hf.getCellValue({ sheet: sheetId, row: i, col: colIdx });
      }
      return { originalIndex: i, values };
    });

    // 2. Sort to determine desired order
    rowEntries.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        if (!sort) continue;
        const va = a.values[field];
        const vb = b.values[field];
        const dir = sort === 'asc' ? 1 : -1;

        const aErr = va != null && typeof va === 'object';
        const bErr = vb != null && typeof vb === 'object';
        if (aErr && !bErr) return 1;
        if (!aErr && bErr) return -1;
        if (aErr && bErr) continue;
        if (va == null && vb != null) return 1;
        if (va != null && vb == null) return -1;

        let cmp = 0;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb);
        } else {
          cmp = (Number(va) || 0) - (Number(vb) || 0);
        }
        if (cmp !== 0) return cmp * dir;
      }
      return 0;
    });

    // 3. Build permutation array: newRowOrder[originalIndex] = newPosition
    const newRowOrder = new Array(numRows);
    for (let newPos = 0; newPos < numRows; newPos++) {
      newRowOrder[rowEntries[newPos].originalIndex] = newPos;
    }

    // 4. Check if already in order (no-op)
    const isIdentity = newRowOrder.every((pos: number, i: number) => pos === i);
    if (isIdentity) return;

    // 5. Apply via setRowOrder — single atomic operation, updates all formula refs
    if (hf.isItPossibleToSetRowOrder(sheetId, newRowOrder)) {
      hf.setRowOrder(sheetId, newRowOrder);
    } else {
      console.warn('Cannot sort: array formulas prevent row reordering');
      return;
    }

    // 6. Rebuild row ID map to match new physical positions
    const oldMap = new Map(rowIdMapRef.current);
    const newMap = new Map<number, GridRowId>();
    for (let newPos = 0; newPos < numRows; newPos++) {
      const oldPos = rowEntries[newPos].originalIndex;
      const id = oldMap.get(oldPos);
      if (id !== undefined) {
        newMap.set(newPos, id);
      }
    }
    rowIdMapRef.current = newMap;

    setHfVersion((v) => v + 1);
  });

  return {
    columns: enhancedColumns as GridColDef[],
    rows,
    formulaBarProps,
    currentFormula,
    currentField,
    isFormula,
    hfContextValue,
    addRow,
    addColumn,
    isFieldDuplicate,
    moveRow,
    sortRows,
  };
}

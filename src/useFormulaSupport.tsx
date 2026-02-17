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

  const addedRowIdsRef = React.useRef<Map<number, GridRowId>>(new Map());

  // Track the current row ordering (HF row indices)
  const [rowOrder, setRowOrder] = React.useState<number[]>(() =>
    Array.from({ length: initialData.length }, (_, i) => i),
  );

  // Keep rowOrder in sync when rows are added
  React.useEffect(() => {
    setRowOrder((prev) => {
      if (prev.length < rowCount) {
        const newOrder = [...prev];
        for (let i = prev.length; i < rowCount; i++) {
          newOrder.push(i);
        }
        return newOrder;
      }
      return prev;
    });
  }, [rowCount]);

  // Version counter to force re-render after moves
  const [hfVersion, setHfVersion] = React.useState(0);

  const rows = React.useMemo<HFRow[]>(() => {
    if (!hfRef.current) {
      return [];
    }
    return rowOrder.map((hfRowIndex, displayIndex) => {
      const rowData = initialData[hfRowIndex];
      let rowId: GridRowId;
      if (rowData) {
        rowId = getRowId?.(rowData, hfRowIndex) ?? hfRowIndex;
      } else {
        rowId = addedRowIdsRef.current.get(hfRowIndex) ?? hfRowIndex;
      }
      return {
        id: rowId,
        _hfRowIndex: displayIndex,
        row_number: displayIndex + 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, getRowId, rowOrder, hfVersion]);

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
    addedRowIdsRef.current.set(rowCount, newRowId);
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
   * This ensures all formula references are updated automatically.
   */
  const moveRow = useEventCallback((sourceIndex: number, targetIndex: number) => {
    if (!hfRef.current || sourceIndex === targetIndex) {
      return;
    }
    const { hf, sheetId } = hfRef.current;

    // Use HyperFormula's moveRows to keep formula references intact
    hf.moveRows(sheetId, [sourceIndex], targetIndex);

    // Update the row order to reflect the move
    setRowOrder((prev) => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(sourceIndex, 1);
      // After removing, if target > source, the target index shifts by -1
      const adjustedTarget = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
      newOrder.splice(adjustedTarget, 0, moved);
      return newOrder;
    });

    setHfVersion((v) => v + 1);
  });

  /**
   * Sort rows in HyperFormula by physically rearranging them via moveRows().
   * This ensures all formula references (e.g., =SUM(B1:B10)) update correctly.
   * The row_number column always shows sequential 1, 2, 3… after sort.
   */
  const sortRows = useEventCallback((sortModel: GridSortModel) => {
    if (!hfRef.current || sortModel.length === 0) {
      return;
    }
    const { hf, sheetId } = hfRef.current;
    const rowCount = hf.getSheetDimensions(sheetId).height;

    // Build array of { hfRowIndex, values } for sorting
    const rowsWithValues = Array.from({ length: rowCount }, (_, i) => {
      const values: Record<string, any> = {};
      for (const [field, colIdx] of columnFieldMap.entries()) {
        values[field] = hf.getCellValue({ sheet: sheetId, row: i, col: colIdx });
      }
      return { hfRowIndex: i, values };
    });

    // Sort using the sort model (supports multi-column)
    rowsWithValues.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        if (!sort) continue;
        const colIdx = columnFieldMap.get(field);
        if (colIdx === undefined) continue;

        const va = a.values[field];
        const vb = b.values[field];
        const direction = sort === 'asc' ? 1 : -1;

        // Push errors/nulls to bottom
        const isErrA = va != null && typeof va === 'object';
        const isErrB = vb != null && typeof vb === 'object';
        if (isErrA && !isErrB) return 1;
        if (!isErrA && isErrB) return -1;
        if (isErrA && isErrB) continue;
        if (va == null && vb != null) return 1;
        if (va != null && vb == null) return -1;

        // Compare
        let cmp = 0;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb);
        } else {
          cmp = (Number(va) || 0) - (Number(vb) || 0);
        }
        if (cmp !== 0) return cmp * direction;
      }
      return 0;
    });

    // Apply the sort by moving rows one by one from top to bottom.
    // We track where each original row currently sits after previous moves.
    const currentPositions = Array.from({ length: rowCount }, (_, i) => i);

    for (let targetPos = 0; targetPos < rowCount; targetPos++) {
      const desiredOriginal = rowsWithValues[targetPos].hfRowIndex;
      const currentPos = currentPositions[desiredOriginal];

      if (currentPos !== targetPos) {
        hf.moveRows(sheetId, [currentPos], targetPos);

        // Update position tracking: the row that was at currentPos moved to targetPos
        // All rows between shifted by 1
        const movedOriginal = desiredOriginal;
        for (const [origIdx, pos] of currentPositions.entries()) {
          if (origIdx === movedOriginal) continue;
          if (currentPos > targetPos) {
            // Moved up: rows in [targetPos, currentPos) shift down by 1
            if (pos >= targetPos && pos < currentPos) {
              currentPositions[origIdx] = pos + 1;
            }
          } else {
            // Moved down: rows in (currentPos, targetPos] shift up by 1
            if (pos > currentPos && pos <= targetPos) {
              currentPositions[origIdx] = pos - 1;
            }
          }
        }
        currentPositions[movedOriginal] = targetPos;
      }
    }

    // Reset rowOrder to sequential since HF rows are now physically sorted
    setRowOrder(Array.from({ length: rowCount }, (_, i) => i));
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

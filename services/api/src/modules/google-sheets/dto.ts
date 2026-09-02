export type CreateWorkbookInput = { title: string; timezone?: string };
export type DefinitionInput = {
  dataset: 'sales' | 'inventory' | 'purchases' | 'finance';
  title: string;
  monthly?: boolean;
};
export type ColumnInput = {
  columnKey: string;
  label: string;
  dataType:
    | 'text'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'formula';
  formulaTemplate?: string;
  position?: number;
};

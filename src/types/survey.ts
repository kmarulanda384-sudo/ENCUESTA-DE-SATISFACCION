export enum NavigationTab {
  SURVEY = 'survey',
  RESPONSES = 'responses',
  ANALYTICS = 'analytics',
  HTML_CODE = 'html_code',
}

export interface SurveyFormValues {
  rol_usuario: string;
  frecuencia_uso: string;
  estado_equipos: string;
  conectividad_red: string;
  software_instalado: string;
  ambiente_fisico: string;
  soporte_atencion: string;
  acceso_prestamo: string;
  satisfaccion_general: string;
  sala_utilizada: string;
  sugerencias: string;
}

export interface SurveySubmission extends SurveyFormValues {
  id: string;
  timestamp: string;
  source: 'csv_inicial' | 'formulario_web';
  syncedToSheets: boolean;
  legacyNote?: string;
}

export interface SheetConfig {
  spreadsheetName: string;
  sheetName: string;
  scriptUrl: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  directSyncEnabled?: boolean;
}

export interface QuestionOption {
  value: string;
  label: string;
  helper?: string;
}

export interface QuestionDefinition {
  number: string;
  field: keyof SurveyFormValues;
  shortHeader: string;
  title: string;
  description: string;
  type: 'radio_grid' | 'scale_1_5' | 'room_and_notes';
  required: boolean;
  options?: QuestionOption[];
}

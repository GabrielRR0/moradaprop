import { useState } from 'react';
import { toast } from '@/lib/toast';
import { IMPORT_ERRORS, IMPORT_READY_ROWS } from './agency-data';

export const STEP_FILE = 1;
export const STEP_REVIEW = 2;
export const STEP_PROGRESS = 3;
export const STEP_DONE = 4;

/**
 * Importar desde Excel, compartido por escritorio y teléfono:
 * en qué paso va y qué filas con error ya corrigió.
 */
export function useImportFlow() {
  const [step, setStep] = useState(STEP_FILE);
  const [fixedRows, setFixedRows] = useState<number[]>([]);

  function toggleFixed(row: number) {
    if (fixedRows.includes(row)) setFixedRows(fixedRows.filter((other) => other !== row));
    else setFixedRows([...fixedRows, row]);
  }

  function goNext() {
    setStep(Math.min(STEP_DONE, step + 1));
    if (step === STEP_PROGRESS) toast('¡Importación lista!');
  }

  function goBack() {
    setStep(Math.max(STEP_FILE, step - 1));
  }

  function restart() {
    setStep(STEP_FILE);
    setFixedRows([]);
  }

  const errors = IMPORT_ERRORS.map((error) => {
    const isFixed = fixedRows.includes(error.row);
    return {
      row: error.row,
      message: error.message,
      propertyName: error.propertyName,
      placeholder: error.placeholder,
      className: isFixed ? 'err fixed' : 'err',
      buttonLabel: isFixed ? 'Corregida' : 'Corregir',
      buttonClass: isFixed ? 'fixb ok' : 'fixb',
      toggleFixed: () => toggleFixed(error.row),
    };
  });

  const errorCount = IMPORT_ERRORS.length - fixedRows.length;
  const readyCount = IMPORT_READY_ROWS + fixedRows.length;

  return {
    step,
    showFileStep: step === STEP_FILE,
    showReviewStep: step === STEP_REVIEW,
    showProgressStep: step === STEP_PROGRESS,
    showDoneStep: step === STEP_DONE,

    errors,
    errorCount,
    errorColor: errorCount === 0 ? '#1F9D55' : '#D98A00',
    readyCount,

    goNext,
    goBack,
    restart,
  };
}

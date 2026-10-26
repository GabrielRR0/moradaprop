import type { FileCheck } from '../types';
import { dangerousFilename } from './dangerous-filename';
import { executableContent } from './executable-content';

/**
 * LISTA DE REVISIONES DE ARCHIVO, en el orden en que se ejecutan (primero las mas baratas).
 * Agregar una: crea su archivo en esta carpeta y sumala aqui. Quitar una: borra su linea.
 */
export const FILE_CHECKS: readonly FileCheck[] = [dangerousFilename, executableContent];

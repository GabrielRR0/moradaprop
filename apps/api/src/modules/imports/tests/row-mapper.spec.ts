import { describeCase } from '@/../test/support/describe-case';
import { detectDelimiter, parseCsv } from '../utils/csv';
import { mapSheet, neutralizeFormula, normalizeHeader } from '../utils/row-mapper';

const HEAD = ['titulo', 'descripcion', 'tipo', 'precio', 'estado', 'municipio', 'latitud', 'longitud'];
const ok = ['Apartamento bonito', 'Apartamento con descripcion suficiente para pasar', 'apto', '450', 'Miranda', 'Chacao', '10.5', '-66.85'];

describe('csv', () => {
  describeCase('imports', {
    que: 'lee CSV con comillas, comas dentro de un campo, comillas escapadas y saltos de linea',
    espera: 'respeta cada campo entre comillas',
    ejecutar: () => parseCsv('a,b,c\r\n"hola, mundo","dijo ""hola""","linea1\nlinea2"\r\n\r\nx,y,z', 100),
    verificar: (filas) => expect(filas).toEqual([['a', 'b', 'c'], ['hola, mundo', 'dijo "hola"', 'linea1\nlinea2'], ['x', 'y', 'z']]),
  });

  describeCase('imports', {
    que: 'detecta el separador (coma, punto y coma de Excel en espanol o tabulador) y quita el BOM',
    espera: ',  ;  y tab; el BOM no ensucia el primer encabezado',
    ejecutar: () => ({
      separadores: [detectDelimiter('a,b,c'), detectDelimiter('a;b;c'), detectDelimiter('a\tb\tc')],
      primero: parseCsv('﻿titulo;precio\nCasa;100', 10)[0][0],
    }),
    verificar: ({ separadores, primero }) => {
      expect(separadores).toEqual([',', ';', '\t']);
      expect(primero).toBe('titulo');
    },
  });
});

describe('row-mapper', () => {
  describeCase('imports', {
    que: 'normaliza encabezados: sin tildes, en minusculas y con guion bajo',
    espera: '"Baños " -> banos; "Área M2" -> area_m2',
    ejecutar: () => [normalizeHeader('Baños '), normalizeHeader('Área M2'), normalizeHeader('Planta Eléctrica')],
    verificar: (r) => expect(r).toEqual(['banos', 'area_m2', 'planta_electrica']),
  });

  describeCase('imports', {
    que: 'neutraliza textos que Excel interpretaria como formula',
    espera: 'antepone una comilla a = + - @; no toca el resto',
    ejecutar: () => ['=1+1', '+54', '-cmd', '@SUM(A1)', 'Casa normal'].map(neutralizeFormula),
    verificar: (r) => expect(r).toEqual(["'=1+1", "'+54", "'-cmd", "'@SUM(A1)", 'Casa normal']),
  });

  describeCase('imports', {
    que: 'interpreta alias de tipo, moneda, si/no y numeros con coma decimal',
    espera: 'apto -> APARTAMENTO, Bs -> VES, "si" -> true, "1.250,50" -> 1250.5',
    ejecutar: async () => {
      const hoja = await mapSheet([
        [...HEAD, 'moneda', 'mascotas'],
        ['Casa grande', 'Casa grande con descripcion suficiente aqui', 'apto', '1.250,50', 'Miranda', 'Chacao', '10,5', '-66,85', 'Bs', 'si'],
      ]);
      return hoja.rows[0];
    },
    verificar: (fila) => {
      expect(fila.errors).toEqual([]);
      expect(fila.data).toMatchObject({ type: 'APARTAMENTO', currency: 'VES', petsAllowed: true, priceAmount: 1250.5, latitude: 10.5, longitude: -66.85 });
    },
    describirObtenido: (fila) => JSON.stringify(fila.data).slice(0, 150),
  });

  describeCase('imports', {
    que: 'reporta columnas obligatorias faltantes y encabezados desconocidos ignorados',
    espera: 'faltan precio/latitud/longitud; "color" se ignora',
    ejecutar: async () => mapSheet([['titulo', 'descripcion', 'tipo', 'estado', 'municipio', 'color'], ['x', 'y', 'z', 'a', 'b', 'rojo']]),
    verificar: (hoja) => {
      expect(hoja.missingHeaders).toEqual(['precio', 'latitud', 'longitud']);
      expect(hoja.ignoredHeaders).toEqual(['color']);
    },
  });

  describeCase('imports', {
    que: 'marca con numero de fila (desde 2) y motivo cada fila invalida, sin frenar a las validas',
    espera: 'fila 2 valida; fila 3 con error de precio en espanol; fila 4 con tipo invalido',
    ejecutar: async () => {
      const mala = [...ok];
      mala[3] = 'gratis';
      const tipo = [...ok];
      tipo[2] = 'castillo';
      return (await mapSheet([HEAD, ok, mala, tipo])).rows;
    },
    verificar: (filas) => {
      expect(filas.map((f) => [f.row, Boolean(f.data)])).toEqual([[2, true], [3, false], [4, false]]);
      expect(filas[1].errors[0]).toContain('precio');
      expect(filas[2].errors[0]).toContain('tipo');
    },
    describirObtenido: (filas) => filas.map((f) => `fila ${f.row}: ${f.data ? 'ok' : f.errors[0]}`).join(' | '),
  });
});

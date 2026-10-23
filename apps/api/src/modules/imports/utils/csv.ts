/** Elige el separador mas probable en la primera linea (Excel en español usa ";"). */
export function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const count = (char: string) => firstLine.split(char).length - 1;
  const candidates: Array<[',' | ';' | '\t', number]> = [
    [',', count(',')],
    [';', count(';')],
    ['\t', count('\t')],
  ];
  return candidates.sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Lector CSV (RFC 4180): campos entre comillas, comillas dobles escapadas y saltos de linea
 * dentro de un campo. Se detiene al pasar maxRows para no gastar memoria con archivos enormes.
 */
export function parseCsv(input: string, maxRows: number): string[][] {
  const text = input.replace(/^\uFEFF/, ''); // BOM de Excel
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (row.some((cell) => cell.trim() !== '')) rows.push(row); // ignora lineas vacias
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === delimiter) endField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      endRow();
      if (rows.length > maxRows) return rows;
    } else field += char;
  }
  if (field !== '' || row.length > 0) endRow();
  return rows;
}

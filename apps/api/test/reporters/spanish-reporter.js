const { existsSync, readFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');

const CASES_FILE = join(__dirname, '..', '..', '.test-report', 'cases.jsonl');

/** Reporter de Jest: imprime que prueba, que espera y que obtuvo, agrupado por modulo. */
class SpanishReporter {
  onRunStart() {
    rmSync(CASES_FILE, { force: true });
  }

  onRunComplete(_contexts, results) {
    const verde = (t) => `\x1b[32m${t}\x1b[0m`;
    const rojo = (t) => `\x1b[31m${t}\x1b[0m`;
    const gris = (t) => `\x1b[90m${t}\x1b[0m`;
    const negrita = (t) => `\x1b[1m${t}\x1b[0m`;

    const casos = existsSync(CASES_FILE)
      ? readFileSync(CASES_FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
      : [];

    const porModulo = new Map();
    for (const caso of casos) {
      if (!porModulo.has(caso.modulo)) porModulo.set(caso.modulo, []);
      porModulo.get(caso.modulo).push(caso);
    }

    console.log('');
    for (const [modulo, lista] of porModulo) {
      const bien = lista.filter((c) => c.ok).length;
      console.log(negrita(`MODULO ${modulo}`) + gris(`  (${bien}/${lista.length} correctos)`));
      for (const c of lista) {
        console.log(`  ${c.ok ? verde('✔') : rojo('✘')} ${c.que}`);
        console.log(gris(`      espera : ${c.espera}`));
        console.log(gris(`      obtuvo : ${c.obtuvo}`));
      }
      console.log('');
    }

    // Tests escritos con it() normal (sin describeCase) o con fallos de compilacion.
    for (const suite of results.testResults) {
      if (suite.failureMessage) console.log(rojo(suite.failureMessage));
    }

    const { numPassedTests, numFailedTests, numTotalTests, numFailedTestSuites } = results;
    console.log(negrita('RESUMEN'));
    console.log(`  Pruebas totales : ${numTotalTests}`);
    console.log(`  ${verde('Correctas')}       : ${numPassedTests}`);
    console.log(`  ${numFailedTests ? rojo('Fallidas') : 'Fallidas'}        : ${numFailedTests}`);
    if (numFailedTestSuites) console.log(rojo(`  Suites con error: ${numFailedTestSuites}`));
    console.log('');
  }
}

module.exports = SpanishReporter;

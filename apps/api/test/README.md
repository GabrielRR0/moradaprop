# test
Pruebas end-to-end (Supertest + base real alquiler_test, creada y migrada automáticamente; se niega a usar una base cuyo nombre no termine en _test).
- e2e/: una suite por flujo (auth, 2FA, admin, propiedades, agencias, citas, importación, GraphQL, rate limit).
- support/: app de pruebas con correo falso, helpers de registro/login, planillas y propiedades, y `resource-contract.ts`.
- reporters/: reporte en español (qué se probó, qué se esperaba, qué se obtuvo).
Las pruebas unitarias viven junto a su código, en tests/.

**Contrato de respuestas (`support/resource-contract.ts`):** en todas las pruebas e2e, un interceptor lee el tipo de retorno que declara cada ruta (`Promise<PropertyCardResource>`) y comprueba que la respuesta real lo cumple: cada propiedad obligatoria presente y del tipo correcto, y ninguna propiedad que el Resource no declare (así se detecta una fuga de datos internos). Si una ruta no cumple, responde 500 con el detalle y la prueba falla. Para ver qué incumple una ruta, pon `CONTRACT_LOG=ruta/archivo.log` (anota las violaciones y las rutas validadas). Se apaga con `RESOURCE_CONTRACT=off`. Una ruta nueva con Resource queda validada en cuanto alguna prueba la ejecuta.

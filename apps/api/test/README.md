# test
Pruebas end-to-end (Supertest + base real alquiler_test, creada y migrada automáticamente; se niega a usar una base cuyo nombre no termine en _test).
- e2e/: una suite por flujo (auth, 2FA, admin, propiedades, agencias, citas, importación, GraphQL, rate limit).
- support/: app de pruebas con correo falso, helpers de registro/login, planillas y propiedades.
- reporters/: reporte en español (qué se probó, qué se esperaba, qué se obtuvo).
Las pruebas unitarias viven junto a su código, en tests/.

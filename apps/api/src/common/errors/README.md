# errors
`AllExceptionsFilter`: filtro global para los errores que ningún controller maneja (base de datos, correo, bugs).
Los registra con su traza (se ven en los logs de Vercel o Docker) y responde un 500 limpio con un código `reference` que sirve para encontrarlos en el log. Los errores HTTP normales (400, 401, 403...) pasan sin cambios. Se registra en `bootstrap/configure-app.ts`.

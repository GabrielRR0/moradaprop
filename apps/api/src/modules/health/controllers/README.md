# controllers
```
controllers/
  public/                        sin sesión   @PublicGroup()
    health.controller.ts             GET /api/health
```
Además de público, no exige las cabeceras de app (`@SkipAppCheck`) para que lo pueda consultar un balanceador.

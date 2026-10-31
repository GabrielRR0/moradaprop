# controllers
```
controllers/
  private/
    user/                      cualquier usuario con sesión   @AuthGroup()
      second-factor.controller.ts      GET /api/auth/second-factor
```
Se puede consultar aunque la cuenta esté limitada por no tener segundo factor (`@AllowWithoutSecondFactor`): es justo lo que le dice qué le falta.

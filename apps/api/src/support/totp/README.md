# totp
Envuelve `otplib` (códigos de 6 dígitos de apps autenticadoras) y `qrcode` (imagen QR). Ventana de tolerancia fija en ±1 paso (30 s). Se usa como `TotpSupport.check(...)`.

| Función | Qué hace |
|---|---|
| `TotpSupport.generateSecret()` | Secreto base32 nuevo. |
| `TotpSupport.keyUri(cuenta, emisor, secreto)` | URL `otpauth://` para la app. |
| `TotpSupport.qrDataUrl(texto)` | QR como data URL PNG. |
| `TotpSupport.check(codigo, secreto)` | `0`, `-1`, `1` si es válido (paso actual/anterior/siguiente) o `null`. |
| `TotpSupport.generate(secreto, offsetSegundos?)` | Código válido ahora; solo para tests. |
| `TotpSupport.PERIOD_SECONDS` | 30. |

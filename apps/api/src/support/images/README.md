# images
Envuelve `sharp`. `ImagesService.process()` valida el formato real, corrige la orientación, elimina EXIF/GPS y genera original JPEG + variantes WebP thumb (300x200), medium (800x600) y hd (1920x1440). Re-codificar destruye payloads incrustados.

| Función | Qué hace |
|---|---|
| `ImagesService.process(buffer)` | Valida, limpia y genera original + variantes (`ProcessedImage`). |
| `ImagesSupport.render(entrada, { format, quality?, size? })` | Convierte/redimensiona a jpeg o webp (seed y tests). Tipo `RenderOptions`. |
| `ImagesSupport.solidJpeg(ancho, alto, rgb)` | JPEG de un color (tests). |
| `ImagesSupport.MAX_BYTES` | Tamaño máximo aceptado. |

También exporta `ImagesModule`.

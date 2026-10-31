# decorators
Decoradores propios del módulo que juntan varios en uno para que el controller se lea de un vistazo.

- **upload-images.decorator.ts** → `@UploadImages()`: límite de subidas, multer en memoria, máximo 10 archivos y solo JPG, PNG o WebP. Antes eran unas 15 líneas dentro del controller.

Regla: si un conjunto de decoradores se repite en 3 o más rutas, o ensucia el método, se vuelve un decorador compuesto con `applyDecorators`.

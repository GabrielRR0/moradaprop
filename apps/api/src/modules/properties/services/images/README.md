# images
Fotos de una propiedad: subir, borrar y elegir la portada.

- **property-images.service.ts**: valida los archivos, los procesa con `ImagesSupport` y guarda el original en el bucket privado y 3 variantes (thumb, medium, hd) en el público. Se procesan todas antes de guardar; si algo falla a mitad se borra lo ya subido. Máximo 20 fotos por propiedad.

Orden de carpetas en el almacenamiento:
```
properties/{propertyId}/original/{uuid}.jpg      bucket privado
properties/{propertyId}/thumb|medium|hd/{uuid}.webp   bucket público
```
Los nombres son UUID nuevos: nunca se usa el nombre que mandó el usuario.

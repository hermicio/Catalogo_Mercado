# Manual de Administrador — Catálogos del Local

Guía de uso del **panel de administración** para gestionar la web "Catálogos del Local": los negocios del edificio/local, sus catálogos PDF, productos a la venta, liquidaciones, fechas de ferias y el contenido de la portada.

---

## 1. Acceso al panel

1. Entrá a la web (ej. `https://catalogo-mercado-eqbl.vercel.app`).
2. Tocá **"Iniciar sesión"** (arriba a la derecha).
3. Ingresá con el **email y contraseña del administrador**.
4. Si el usuario tiene rol `admin`, entra directo al **Panel de administración** (`/admin/dashboard`). Si el rol es de puestero, va a su propio panel (no al de admin).

> Solo los usuarios con `rol: admin` ven el menú de administración. Un usuario puestero no puede acceder a `/admin/*`.

---

## 2. El menú del administrador

En la columna izquierda del panel aparecen estas secciones:

| Sección | ¿Para qué sirve? |
|---|---|
| **Resumen** | Indicadores generales (negocios totales/publicados, usuarios, catálogos pendientes) y accesos rápidos. |
| **Negocios** | Crear, editar, publicar/ocultar y configurar la aprobación de productos de cada negocio. |
| **Usuarios** | Ver los puesteros registrados y asignarles (o quitarles) un negocio. |
| **Catálogos** | Aprobar/rechazar los catálogos PDF que suben los puesteros. |
| **Productos** | Aprobar productos, marcarlos en liquidación y ocultarlos/eliminarlos. |
| **Página principal** | Editar el título, subtítulo y foto de fondo de la portada de la home. |
| **Ferias** | Cargar y eliminar las fechas de las próximas ferias que se muestran en la home. |
| **Ver sitio público** | Abrir la web tal como la ve el visitante. |

---

## 3. Resumen

Sirve como tablero de control. Muestra:

- **Negocios totales** y **negocios publicados**.
- **Usuarios (puesteros)** registrados.
- **Catálogos pendientes** de aprobación.

Desde acá hay accesos directos a gestionar negocios, aprobar catálogos y gestionar usuarios.

---

## 4. Gestionar negocios (`/admin/negocios`)

### 4.1 Crear un negocio
1. En **“Crear nuevo negocio”** completá:
   - **Nombre** (obligatorio).
   - **Dirección / local** (opcional).
   - **Descripción** (opcional).
2. Tocá **“Crear negocio”**. Aparece en la tabla.

### 4.2 Publicar / ocultar un negocio
Cada negocio tiene un estado **Publicado** u **Oculto**. Solo los negocios publicados se ven en la página pública.
- Botón **“Publicar”**: lo hace visible en la home.
- Botón **“Ocultar”**: lo saca de la vista pública (sin borrarlo).

### 4.3 Editar un negocio
Tocá **“Editar”** para modificar nombre, dirección, horario, teléfono, descripciones e imágenes (representativa y de portada).

### 4.4 Aprobación de productos (importante)
Cada negocio tiene un parámetro de **aprobación de productos**:

- **Automática**: los productos que cargue ese puestero se publican al instante (sin revisión del admin).
- **Requiere admin**: los productos quedan **pendientes** hasta que el admin los apruebe en la sección **Productos**.

Usá el botón **“Cambiar”** junto a ese badge para alternar entre ambos modos por negocio.

---

## 5. Gestionar usuarios (`/admin/usuarios`)

Muestra todos los usuarios registrados con:

- **Email** y estado de verificación (Verificado / Sin confirmar).
- **Rol** (Administrador o Puestero).
- **Negocios** que tiene asignados.

### Asignar / quitar negocio a un puestero
1. En la fila del usuario (que no sea admin), el desplegable muestra los negocios sin dueño (o el que ya tiene).
2. Seleccioná un negocio y tocá **“Asignar”**. Ese puestero pasa a administrar ese negocio.
3. Para quitarle el negocio, elegí **“Sin negocio”** y tocá “Asignar”.

> Los usuarios con rol `admin` no se pueden reasignar desde esta tabla.

---

## 6. Aprobar catálogos (`/admin/catalogos`)

Los puesteros suben catálogos PDF que quedan **pendientes** hasta esta revisión.

- **Aprobar** → el catálogo se publica y aparece en la página pública del negocio.
- **Rechazar** / ocultar → el catálogo no se muestra.

Publicá únicamente catálogos que correspondan realmente al negocio y estén completos/correctos.

---

## 7. Gestionar productos (`/admin/productos`)

### 7.1 Pendientes de aprobación
Lista los productos creados por puesteros cuya aprobación **requiere admin**:
- **Aprobar** → el producto se hace visible en el negocio.
- **Rechazar** → se mantiene oculto.

### 7.2 Publicados
Tabla con los productos visibles y sus acciones:
- **Marcar en liquidación** / **Quitar liquidación** → activa/desactiva el atributo de oferta del producto (se resalta con borde rojo en el negocio y aparece en la cinta de liquidaciones de la home).
- **Ocultar** / **Eliminar**.

> Recordá: si un negocio tiene la aprobación de productos en modo **Automática** (ver sección 4.4), sus productos entran directo a publicados sin pasar por “Pendientes”.

---

## 8. Página principal (`/admin/portada`)

Sirve para editar el contenido de la home sin tocar código:

- **Título principal**: el encabezado grande.
- **Subtítulo**: el texto debajo del título.
- **Imagen de fondo / portada**: subí una foto (queda de fondo con un velo blanco para legibilidad).
  - Para **quitar** la imagen actual: marcá *“Quitar la imagen actual”*.

Al guardar, tocá **“Ver la página principal”** para comprobar el resultado.

---

## 9. Fechas de ferias (`/admin/ferias`)

Controla el apartado “Próximas fechas de ferias” de la home.

### Agregar una fecha
1. Elegí la **fecha** en el calendario.
2. Opcional: **título** (ej. “Feria del Local”) y **descripción**.
3. Tocá **“Agregar fecha”**.

### Resultado en la home
- Se muestran las **próximas** fechas (desde hoy en adelante), ordenadas por cercanía.
- La **más próxima** aparece resaltada con el cartel “Más próxima”.

### Eliminar una fecha
Tocá **“Eliminar”** en la fila correspondiente y confirmá. Las fechas pasadas se marcan igual pero solo se muestran las futuras en la home.

---

## 10. Consejos y buenas prácticas

- **Revisá los pendientes seguido**: catálogos y productos pendientes representan trabajo de los puesteros esperando tu aprobación.
- **Probalo todo en la vista pública**: cada vez que publiques/ocultes algo, entrá a “Ver sitio público” para confirmar cómo se ve.
- **Usá la aprobación automática con criterio**: es útil para puesteros de confianza que publican mucho, pero dejá “Requiere admin” donde quieras mantener control de calidad.
- **No compartas la contraseña del admin** ni la clave `service_role` de Supabase. En el dashboard de Supabase podés regenerar o cambiar credenciales si alguna se expone.

---

## Anexo: flujo de un negocio de punta a punta

1. Un **puestero** se registra en la web → su negocio se crea **oculto** (pendiente).
2. Como **admin**, en **Negocios** tocá **“Publicar”** para mostrarlo.
3. El puestero sube **catálogos** (quedan pendientes) y/o **productos** (según el modo de aprobación del negocio).
4. Como admin, aprobás catálogos en **Catálogos** y productos en **Productos** (si aplica), y marcás liquidaciones si corresponde.
5. Opcional: cargás **fechas de ferias** y ajustás la **portada**.
6. Todo lo aprobado se refleja al instante en la página pública.

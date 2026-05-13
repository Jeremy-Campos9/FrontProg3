# SACR – Interfaces Web (HTML + CSS + JS)

Pantallas estáticas del sistema. **Solo UI** – sin backend ni base de datos. Lista para que conectes con tu proyecto Java.

## Estructura

```
SACR-Web/
├── index.html              -> redirige a login
├── login.html              -> Pantalla de inicio de sesión
├── css/
│   └── sacr.css            -> Sistema de diseño completo
├── js/
│   └── app.js              -> Solo abrir/cerrar modales y resaltar menú activo
└── pages/
    ├── dashboard.html
    ├── usuarios.html       -> CRUD usuarios + modal de edición
    ├── reservas.html       -> Listado, anular, modificar + modal
    ├── clientes.html       -> Listado + modal cliente
    ├── servicios.html      -> Catálogo en tarjetas + modal
    ├── reclamos.html       -> Atender + evaluar procedencia
    ├── notificaciones.html
    ├── auditoria.html      -> Log de auditoría
    ├── reporte-ventas.html
    └── reporte-calidad.html
```

## Cómo usarlo

1. Abre `login.html` en tu navegador (o sirve la carpeta con cualquier servidor estático).
2. Navega entre pantallas con el menú lateral.
3. Para integrar con tu backend Java:
   - Cada formulario tiene los campos correspondientes a las entidades del diagrama.
   - Reemplaza los `action=""` de los `<form>` o intercepta los `submit` desde JS para llamar a tus endpoints REST.
   - Reemplaza las filas de las tablas (`<tbody>`) con datos reales generándolas desde JS (`fetch` → renderizar filas).

## Mapeo con el diagrama UML/ER

| Diagrama                          | Pantalla                              |
|-----------------------------------|---------------------------------------|
| `pe.pucp.sacr.auth`               | login.html, usuarios.html             |
| Cliente / Reserva / Servicio      | clientes.html, reservas.html, servicios.html |
| Reclamo / EstadoReclamo           | reclamos.html                         |
| `pe.pucp.sacr.reportes`           | dashboard, reporte-ventas, reporte-calidad |
| Notificacion / TipoEvento         | notificaciones.html                   |
| Log_Auditoria                     | auditoria.html                        |
| `pe.pucp.sacr.webhooks` (Bokun)   | botón "Sincronizar Bokun" en reservas |

## Notas

- No hay datos persistentes ni llamadas a backend: todas las tablas tienen filas de ejemplo en HTML.
- El JS solo gestiona la apertura de modales (`data-open="#idModal"` / `data-close`) y resalta el enlace activo del menú.
- Todo el estilo está en `css/sacr.css` con variables CSS — cambia los colores en `:root` para retematizar.

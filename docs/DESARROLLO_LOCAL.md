# Desarrollo y publicación

## Primera instalación en Windows

Instala Git y Node.js 24 LTS. En una carpeta de trabajo abre PowerShell:

```powershell
git clone --branch develop https://github.com/magiclab-coding/title-studio-jukebox.git
cd title-studio-jukebox
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. El servidor solo escucha en tu ordenador y se detiene con Ctrl+C. Reconstruye al editar src y recarga el navegador automáticamente. También puedes ejecutar INICIAR-DESARROLLO.cmd dentro de la carpeta del proyecto.

## Actualizar para probar una nueva función

Con el servidor detenido y sin cambios locales pendientes:

```powershell
git switch develop
git pull --ff-only origin develop
npm ci
npm run dev
```

Las nuevas funciones se integran únicamente en develop y aumentan el tercer número: 7.4.0 → 7.4.1. La CI valida develop, pero no publica Pages. El servidor local permite probar esa rama sin modificar main.

## Publicar solo cuando se solicite

Si el encargo del cambio incluye publicar, prepara la versión en un commit
separado de la misma rama de trabajo antes de abrir la PR hacia `develop`. Si el
cambio ya está integrado al pedir la publicación, prepara la versión en una
nueva rama cuando haga falta. La versión de publicación incrementa el segundo
número y pone el tercero a cero, por ejemplo 7.4.1 → 7.5.0.

La PR `develop` → `main` ejecuta todas las comprobaciones. La fusión en
`main` activa Release y Pages. Después se sincroniza `develop` con `main`. El
[flujo de publicación](FLUJO_GITHUB.md#publicación) detalla los dos casos.

Los datos de localhost son independientes de los de GitHub Pages. Para llevar tus discos y composiciones a local, exporta Guardar todo en producción e importa ese JSON en local. No borres datos del navegador para actualizar el programa.

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

Preparar una PR develop → main con el segundo número incrementado y el tercero a cero: 7.4.1 → 7.5.0. Publicar solo tras la petición explícita del usuario. El merge a main activa Release y Pages; después se sincroniza develop con main.

Los datos de localhost son independientes de los de GitHub Pages. Para llevar tus discos y composiciones a local, exporta Guardar todo en producción e importa ese JSON en local. No borres datos del navegador para actualizar el programa.

# Sinapsis Orgánica

Apertura real de planificación financiera, limitada al botón **Comenzar**. Referencia visual: B.1 Neuronal, filamentos violetas y durazno, núcleo luminoso, profundidad y tipografía serif.

## Ejecutar

Requiere Node.js 24. No hay dependencias de ejecución.

```sh
npm run dev
```

Abrir http://127.0.0.1:4173. Para verificar archivos, sintaxis y controles: `npm test`. Para las pruebas de comportamiento: `node scripts/opening.test.cjs`.

## Publicar en Vercel

Importar `Chugita/WEB`, preset **Other**, directorio raíz del repositorio. `vercel.json` define `npm run build` y salida `public`. El recurso visual está incluido, sin peticiones a servicios de imágenes.

## Supabase

La apertura funciona sin base de datos. La integración opcional se configura con `SUPABASE_URL` en Vercel. `GET /api/health` comprueba la conexión al endpoint público JWKS de Supabase sin claves privilegiadas, usuarios ni tablas. Sin configuración devuelve `supabase: not_configured`; con conexión válida, `reachable`; con error, HTTP 503 y `unavailable`. Esta comprobación no prueba consultas de base de datos ni almacenamiento.

El proyecto separado solicitado en GAX Finance no pudo crearse por el límite de dos proyectos gratuitos activos. No se modificaron los proyectos existentes y no se reutilizó su base de datos. No hay integración activa hasta seleccionar/provisionar un proyecto.

## Alcance y accesibilidad

Intro de 4,8 segundos: expansión, disolución, núcleo guía, frase y botón. Omitir, repetir y pausar. Movimiento reducido muestra el estado final sin animación. Animación suspendida en pestañas ocultas, limitada a 30 fps y pixel ratio 1,5. Campo neuronal rasterizado con luces y partículas Canvas. No es una simulación 3D.

Comenzar emite `sinapsis:begin` sobre `document`; no navega a otra pantalla. No hay preguntas, cuentas, formularios, cookies analíticas ni recolección de información financiera.

Prompt y procedencia del fondo en `ASSET-PROMPT.md`.

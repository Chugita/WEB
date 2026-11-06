# Sinapsis Orgánica

Apertura real de planificación financiera, limitada al botón **Comenzar**. Referencia visual: B.1 Neuronal, filamentos violetas y durazno, núcleo luminoso, profundidad y tipografía serif.

## Ejecutar

Requiere Node.js 24. No hay dependencias de ejecución.

```sh
npm run dev
```

Abrir http://127.0.0.1:4173. `npm test` verifica archivos, sintaxis, comportamiento de la apertura y respuestas del endpoint de salud con red simulada.

## Publicar en Vercel

Importar `Chugita/WEB`, preset **Other**, directorio raíz del repositorio. `vercel.json` define `npm run build` y salida `public`. El recurso visual está incluido, sin peticiones a servicios de imágenes.

## Supabase

La apertura funciona sin base de datos. La integración opcional se configura con `SUPABASE_URL` en Vercel. `GET /api/health` comprueba la conexión al endpoint público JWKS de Supabase sin claves privilegiadas, usuarios ni tablas. Sin configuración devuelve `supabase: not_configured`; con conexión válida, `reachable`; con error, HTTP 503 y `unavailable`. Esta comprobación no prueba consultas de base de datos ni almacenamiento.

El proyecto separado solicitado en GAX Finance no pudo crearse por el límite de dos proyectos gratuitos activos. No se modificaron los proyectos existentes y no se reutilizó su base de datos. No hay integración activa hasta seleccionar/provisionar un proyecto.

## Alcance y accesibilidad

Intro de 4,8 segundos: expansión, disolución, núcleo guía, frase y botón. Omitir, repetir y pausar. Movimiento reducido muestra el estado final sin animación. Animación suspendida en pestañas ocultas, limitada a 30 fps y pixel ratio 1,5. Campo neuronal rasterizado con luces y partículas Canvas. No es una simulación 3D.

El núcleo del fondo se oculta con una máscara suave y se sustituye por una partícula Canvas independiente: membrana luminosa, deriva acotada en dos ejes, respiración e hilos que siguen su posición. La explosión usa compresión inicial, liberación cálida/violeta, filamentos en varios planos, ramificaciones y trazas que se disipan antes de aparecer la guía. La partícula sigue animándose después de la intro; pausar o el movimiento reducido la dejan quieta. No se implementa la fase 2.

Comenzar emite `sinapsis:begin` sobre `document`; no navega a otra pantalla. No hay preguntas, cuentas, formularios, cookies analíticas ni recolección de información financiera.

Prompt y procedencia del fondo en `ASSET-PROMPT.md`.

## Validación realizada

Pruebas de lógica aprobadas: secuencia, mensaje, estado final, Comenzar sin navegación, repetir, omitir y foco, pausar/reanudar, pestaña oculta y movimiento reducido. Endpoint local `/api/health` comprobado: `supabase: not_configured`.

Composición montada inspeccionada en navegador de escritorio (1280 × 720) y viewport estrecho observado (476 × 668), sin desbordamiento horizontal. Omitir, repetir y Comenzar comprobados en navegador; sin errores de consola observados. La solicitud de emulación a 390 × 844 no cambió el viewport efectivo de la pestaña probada; no se reporta como verificada. Dispositivos físicos, Safari y preferencia de movimiento reducido del sistema no comprobados.

# Sinapsis Orgánica · V6 · revisión visual

Silueta asimétrica con regiones tensionadas, integración volumétrica de 40 pasos, núcleo cálido parcialmente ocluido y estela de superficies trianguladas con ancho real. Una única masa procedural cerrada sobre negro; movimiento orgánico, presión local elástica, estela efímera y navegación reversible por scroll. Sin botón Comenzar. El recorrido termina en la primera pregunta aprobada y tres ramas; la elección ilumina un camino y conduce a un nodo inactivo, sin preguntas posteriores.

## Ejecutar

Node 24. `npm ci`, `npm run dev`, `npm run build`, `npm run preview`, `npm test`.

## Implementación

- Three.js y shaders propios: una superficie opaca con tejido y luz integrada, normales por diferencias finitas; no imágenes, capas transparentes ni código original de HorizonX.
- Campo coherente de varias escalas y tres impulsos amortiguados. Picking aproximado de baja resolución, actualizado periódicamente.
- Estela al mover el puntero sin presionar; intensidad según proximidad, muestras acotadas y desaparición temporal.
- Scroll nativo controla determinísticamente escala, cámara, descenso y aparición de la red.
- Tres botones semánticos con foco, Enter/Espacio y estado `aria-pressed`; controles de avance, regreso y pausa visibles al recibir foco.
- `prefers-reduced-motion` detiene movimiento ambiente, presión y estela; conserva navegación. Calidad y resolución adaptativas.
- Eventos `sinapsis:begin` y `sinapsis:decision` (question, answer, label). Sin persistencia de respuestas ni segunda pregunta.

## Validación y límites

Build y cinco pruebas de geometría/recorrido más pruebas simuladas del endpoint de salud. Revisión real de navegador a 1440×900 y 390×844: masa, scroll, selección y cambio de respuestas, teclado, regreso, movimiento reducido y alternativa sin WebGL. No equivale a prueba táctil en un teléfono físico ni a una medición de FPS en hardware diverso.

La imagen aprobada es referencia de dirección; este material procedural todavía tiene una apariencia más sólida y menos translúcida que aquella. No se afirma coincidencia exacta. No existe enlace de Peach Worlds: el usuario lo confirmó. Se analizaron principios de Spike Orb; su código original no se incorporó debido a su licencia separada.

La alternativa sin WebGL mantiene pregunta y respuestas accesibles, con un SVG simplificado; no reproduce la deformación, estela ni red 3D. La colisión CPU es aproximada. El recorrido posterior queda fuera de alcance. Supabase sigue sin configurarse por el límite de proyectos gratuitos; esta experiencia no necesita base de datos.

En desarrollo, Alt+Shift+S exporta captura; Alt+Shift+I/D/T graba cinco segundos del canvas. No se incluyen estas herramientas en producción. Los videos del canvas no incluyen el texto HTML.

## Estado V6

Implementada y probada como iteración de revisión, no declarada réplica exacta de la referencia. Persisten diferencias en la fineza de los pliegues, la distribución de luz y la forma. La integración de volumen es una aproximación procedural; no una simulación física de transmisión. No se copió el HTML recibido: se inspeccionó como material adicional.

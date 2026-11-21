# Crear tus propias plantillas

En **Diseños y plantillas**, pulsa el icono **Crear plantilla** de la cabecera.
Se abre un borrador con Artista central y los títulos de ambas caras. Puedes
vaciar el lienzo o importar una plantilla JSON previamente exportada.

## Lienzo y capas

Añade campos vinculados al disco, texto libre, líneas, rectángulos, elipses o
gráficos. Arrastra una capa, utiliza las flechas (Mayús mueve 10 unidades) o
introduce sus coordenadas y medidas. El asa de la selección cambia el tamaño.
Puedes ajustar giro, opacidad, alineación y orden, duplicar, ocultar o eliminar
capas, y deshacer o rehacer cambios.

Sobre la lista, la fila **Capa Actual** permite renombrar la capa seleccionada. A su derecha están las flechas de nivel y el botón para duplicarla.

En la lista de capas, el ojo abierto indica una capa visible y el ojo tachado
una capa oculta. El candado protege la capa de movimientos, cambios de tamaño,
edición de sus propiedades, reordenación y borrado. Puedes seleccionarla,
cambiar su visibilidad o duplicarla como una capa desbloqueada. Al tocar el
lienzo, la selección salta las capas bloqueadas y busca una capa inferior. **Vaciar
lienzo** conserva las capas bloqueadas. El estado del candado se guarda en la
plantilla y en su JSON. Las plantillas anteriores se abren desbloqueadas.
La papelera de cada fila borra esa capa directamente. Está desactivada en las
capas bloqueadas. Puedes recuperar una capa borrada con **Deshacer**.

La geometría usa un lienzo lógico de 300 × 150 unidades, adaptado al tamaño
físico de etiqueta del proyecto, que se muestra junto a la vista previa.
En pantallas estrechas las propiedades aparecen debajo del lienzo y las medidas
se agrupan por pares.
En móvil, Deshacer, Rehacer y Cerrar se mantienen arriba y el icono Guardar
queda en la misma cabecera al desplazar el contenido.

Los campos del disco se rellenan automáticamente al usar la plantilla.
El campo **Artista central** combina Artista A y Artista B con una barra.
Los textos libres se mantienen iguales en todas las tarjetas.

## Tipografía y colores

Cada texto permite fuente, tamaño en píxeles y alineación. La fuente heredada usa
la tipografía elegida para canciones o artista en la apariencia de la tarjeta.
Los tamaños de las capas de canciones y artistas se escalan con el tamaño de su
grupo en el modal de estilo. El texto se acorta sin reducir la fuente; los avisos
usan la misma medición que el renderizado.

Los colores pueden seguir Canciones, Artista o Elementos, o tener un color propio.
Rectángulos y elipses tienen una fila de relleno y otra de trazo. Desactivar el
relleno o dejar el grosor en cero desactiva el vínculo y el color correspondientes.
El fondo Papel pertenece a la plantilla.

Los campos de género, RPM y número obedecen la visibilidad de la tarjeta.
El editor los muestra para poder diseñarlos; puedes ocultar cualquier capa.
El selector **Probar nombres largos** comprueba el recorte sin guardar datos falsos.

## Recursos externos

Importa SVG de hasta 1 MB o PNG/JPG/WebP de hasta 2 MB por archivo.
Los SVG se reconstruyen con formas, grupos, texto, degradados y referencias
internas permitidas. Se excluyen scripts, eventos, animaciones, HTML,
hojas de estilo y referencias externas. Para conservar colores definidos por
clases CSS, exporta el SVG con estilos de presentación en los elementos.
Los recursos se incluyen en los datos; no dependen de rutas locales.

Máximo 80 capas por plantilla y 100 plantillas propias. Las imágenes grandes
pueden superar el almacenamiento disponible del navegador: conserva copias JSON
y reduce su tamaño si aparece el aviso de guardado.

## Guardar y reutilizar

**Guardar plantilla** la añade a **Mis plantillas** y al selector de estilos de
Composición. Pulsar una plantilla propia reabre el editor. En Mis plantillas
también puedes duplicarla o eliminarla.

Cada posición guarda una copia independiente del diseño. Editar o eliminar una
plantilla del catálogo no cambia las tarjetas colocadas. Para actualizarlas,
selecciona de nuevo la plantilla en su estilo o aplícala a toda la composición.

El editor permite importar/exportar una plantilla JSON individual. **Guardar
todo** conserva también el catálogo y los recursos. Las copias de composición
incluyen los diseños usados en sus posiciones. La vista previa y el PDF a escala
1:1 usan el mismo dibujo SVG.

## Partir de un diseño integrado

El lápiz de cualquier plantilla abre el editor visual con ese diseño ya cargado.
En los diseños integrados se crea una copia propia: los títulos, el artista y los
metadatos son campos vinculados editables; las cartelas son formas y los trazos
complejos siguen siendo recursos SVG independientes. Puedes moverlos, cambiar
su tamaño, ocultarlos, eliminarlos o reemplazarlos. Los gráficos conservan sus
colores de papel y elementos, y las fuentes usadas por adornos tipográficos.

Guardar añade la copia a Mis plantillas. Cancelar no modifica el diseño de
partida ni las tarjetas colocadas. Las plantillas propias se editan directamente
en el mismo editor, manteniendo la independencia de las posiciones existentes.

Las fuentes de máquina de escribir aparecen primero en los selectores. El campo
Buscar fuente filtra por nombre y admite términos como "máquina" o "typewriter".
Courier Prime, Cutive Mono, Special Elite e IBM Plex Mono se encuentran tanto en
el editor como en los estilos de composición y conservan ñ y acentos.

## Paleta y fondo del texto

Transparente aparece primero, con damero; Personalizar color es la última fila.
Los Custom se guardan por orden de creación, del más antiguo al más nuevo.
Guardar desde la rueda añade el color a la paleta compartida sin aplicarlo.
Para usarlo, selecciónalo después en la lista. La papelera solo elimina el color
de la paleta y conserva las capas y tarjetas que ya lo usan.

Cada capa de texto tiene Fondo del texto, transparente de forma predeterminada.
El fondo ocupa el rectángulo de esa capa y comparte su giro y opacidad.
No modifica la tinta, el papel ni otras capas. El archivo JSON, las posiciones
de composición y la salida SVG/PDF conservan este fondo.

## Papel actual y tintas vinculadas

La segunda fila de la paleta es Papel actual y refleja el papel de la plantilla
o tarjeta que se está editando. Es un acceso directo al valor actual; no añade
colores personalizados. Los Custom se nombran Custom 1, Custom 2 y siguientes,
según su orden visible. Al borrar uno, se renumeran los que quedan.

**Vincular tinta con** y **Vincular fondo con** tienen una fila cada uno en las
capas de texto. Cada desplegable permite elegir Color de canción, Color de
artista, Color de elementos, Color de papel o Color propio. A su lado, la
muestra **Tinta** o **Fondo** permite editar el color compartido o propio.
El fondo de las capas existentes conserva su valor y el de las nuevas
empieza con Color propio transparente.
Seleccionar **Papel actual** en la paleta de Tinta o Fondo vincula esa
propiedad a **Color de papel**. El vínculo sigue los cambios de Papel en
**Estilo del diseño**. Para vincular un color que se guardó anteriormente como
propio, elige **Papel actual** o selecciona **Color de papel** en el desplegable.
El borde de rectángulos y elipses también puede vincularse a los colores de
canción, artista, elementos o papel; el grosor, el vínculo y la muestra de color
se mantienen en una única fila.

En pantallas pequeñas, las medidas de las capas se agrupan en dos columnas:
X/Y, ancho/alto y giro/opacidad. Los encabezados de los modales mantienen el
cierre a la izquierda, el título centrado en una línea y las acciones agrupadas
en controles redondeados. Los títulos largos se recortan para caber.

En **Diseños y plantillas**, pulsa el nombre o la vista previa de un diseño
predefinido o propio para abrir **Estilo del diseño**. **Guardar estilo**
establece sus colores, fuentes y tamaños para las próximas tarjetas que usen
la plantilla. Al elegir una fuente, la vista previa actualiza las canciones o
el artista, incluso si sus capas tienen una tipografía propia. El lápiz abre
el editor de capas.

En **Color canciones**, **Color artista** y **Tinta** de una capa de texto,
**Automático** conserva el tono complementario si alcanza un contraste de
7:1. En los demás fondos de color usa blanco si su contraste llega a 2,5:1
con saturación del 50 % o superior en el modelo HSV (tono, saturación y
valor), o a 3:1 en los tonos menos saturados. Para fondos más claros usa
negro. En fondos neutros elige el blanco o negro de mayor contraste.
Los desplegables usan la misma regla para el texto sobre cada muestra.
La elección se guarda y se recalcula al modificar el fondo. La vista previa
y el PDF usan la misma tinta.

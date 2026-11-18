// --- Plantillas propias: datos acotados y recursos gráficos autónomos ---
(() => {
  const fields = [
    { key: 'artist', label: 'Artista central', sample: 'Artista A / Artista B' },
    { key: 'artistA', label: 'Artista A', sample: 'Artista A' },
    { key: 'artistB', label: 'Artista B', sample: 'Artista B' },
    { key: 'a', label: 'Título cara A', sample: 'Título de la cara A' },
    { key: 'b', label: 'Título cara B', sample: 'Título de la cara B' },
    { key: 'category', label: 'Estilo musical', sample: 'ROCK & ROLL' },
    { key: 'rpm', label: 'Velocidad', sample: '45 RPM' },
    { key: 'number', label: 'Selección', sample: 'A1' },
    { key: 'label', label: 'Sello', sample: 'Sello' },
    { key: 'year', label: 'Año', sample: '1957' },
  ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const id = () => globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random();
  const num = (value, fallback, min, max) => {
    const n = value === '' || value == null ? NaN : Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  const color = (value, fallback = '#213d36') =>
    value === 'transparent' || /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  const escape = (value) =>
    String(value ?? '').replace(
      /[<>&"']/g,
      (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
    );
  const raster = (value) =>
    typeof value === 'string' &&
    value.length <= 2800000 &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value)
      ? value
      : '';
  const svgCache = new Map();

  // Se reconstruye una lista permitida; nunca se inserta el documento importado sin revisar.
  function sanitizeSvg(source) {
    if (typeof source !== 'string' || source.length > 1000000 || /<!DOCTYPE|<!ENTITY/i.test(source))
      throw Error('SVG no válido o demasiado grande (máximo 1 MB).');
    if (svgCache.has(source)) return svgCache.get(source);
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = doc.documentElement;
    if (root?.localName !== 'svg' || doc.querySelector('parsererror'))
      throw Error('No se pudo leer el SVG.');
    const tags = new Set([
      'svg',
      'g',
      'path',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'defs',
      'linearGradient',
      'radialGradient',
      'stop',
      'clipPath',
      'mask',
      'use',
      'symbol',
      'title',
      'desc',
      'text',
      'tspan',
    ]);
    const attrs = new Set([
      'id',
      'd',
      'x',
      'y',
      'x1',
      'y1',
      'x2',
      'y2',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'width',
      'height',
      'viewBox',
      'preserveAspectRatio',
      'points',
      'transform',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'stroke-dasharray',
      'stroke-dashoffset',
      'fill-rule',
      'clip-rule',
      'opacity',
      'fill-opacity',
      'stroke-opacity',
      'clip-path',
      'mask',
      'offset',
      'stop-color',
      'stop-opacity',
      'gradientUnits',
      'gradientTransform',
      'spreadMethod',
      'fx',
      'fy',
      'text-anchor',
      'dominant-baseline',
      'font-family',
      'font-size',
      'font-weight',
      'data-disc-field',
      'data-disc-width',
    ]);
    const ids = new Map();
    let count = 0;
    const collect = (node) => {
      if (++count > 5000) throw Error('El SVG contiene demasiados elementos.');
      const key = node.getAttribute?.('id');
      if (key) ids.set(key, 'asset-' + ids.size);
      for (const child of node.children || []) collect(child);
    };
    collect(root);
    const safeValue = (name, value) => {
      if (
        value.length > 200000 ||
        /[<>]|javascript:|data:|https?:|\/\/|expression|var\(/i.test(value)
      )
        return null;
      if (name === 'id') return ids.get(value);
      if (/url\(/i.test(value)) {
        const match = /^url\(\s*['"]?#([^\s'")]+)['"]?\s*\)$/.exec(value);
        return match && ids.has(match[1]) ? 'url(#' + ids.get(match[1]) + ')' : null;
      }
      return value;
    };
    const serialize = (node, depth = 0) => {
      if (depth > 40) throw Error('El SVG tiene demasiados niveles.');
      if (node.nodeType === 3) return escape(node.textContent);
      if (node.nodeType !== 1 || !tags.has(node.localName)) return '';
      const values = new Map();
      for (const attr of Array.from(node.attributes)) {
        if (attrs.has(attr.name)) values.set(attr.name, attr.value);
        if (attr.name === 'href' || attr.name === 'xlink:href') {
          if (attr.value.startsWith('#') && ids.has(attr.value.slice(1)))
            values.set('href', '#' + ids.get(attr.value.slice(1)));
        }
        if (attr.name === 'style') {
          for (const declaration of attr.value.split(';')) {
            const colon = declaration.indexOf(':');
            const name = declaration.slice(0, colon).trim();
            if (colon > 0 && attrs.has(name)) values.set(name, declaration.slice(colon + 1).trim());
          }
        }
      }
      let attributes = '';
      for (const [name, value] of values) {
        const safe = name === 'href' ? value : safeValue(name, value);
        if (safe != null) attributes += ' ' + name + '="' + escape(safe) + '"';
      }
      if (node === root) attributes += ' xmlns="http://www.w3.org/2000/svg"';
      return (
        '<' +
        node.localName +
        attributes +
        '>' +
        Array.from(node.childNodes)
          .map((child) => serialize(child, depth + 1))
          .join('') +
        '</' +
        node.localName +
        '>'
      );
    };
    const result = serialize(root);
    if (svgCache.size > 60) svgCache.clear();
    svgCache.set(source, result);
    return result;
  }

  function element(type = 'text', field = '') {
    return {
      id: id(),
      type,
      name:
        fields.find((f) => f.key === field)?.label ||
        {
          text: 'Texto libre',
          rect: 'Rectángulo',
          ellipse: 'Elipse',
          line: 'Línea',
          svg: 'Gráfico SVG',
          image: 'Imagen',
        }[type],
      x: 10,
      y: 55,
      width: 280,
      height: 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      field,
      text: field ? '' : 'Tu texto',
      font: '',
      fontSize: 20,
      align: 'center',
      colorRole: field.startsWith('artist') ? 'artistInk' : field ? 'ink' : 'graphicsInk',
      background: 'transparent',
      fill: '#213d36',
      stroke: '#213d36',
      strokeWidth: type === 'line' ? 2 : 0,
      radius: 0,
    };
  }
  function newTemplate() {
    return {
      id: '',
      name: 'Mi plantilla',
      group: 'Mis plantillas',
      description: 'Diseño propio',
      ink: '#28548a',
      artistInk: '#213d36',
      graphicsInk: '#213d36',
      paper: '#ffffff',
      font: 'DM Sans',
      titlePx: 20,
      artistPx: 19,
      showGenre: false,
      showRpm: false,
      showNumber: false,
      design: {
        version: 1,
        elements: [
          { ...element('text', 'a'), y: 20 },
          { ...element('text', 'artist'), y: 60, fontSize: 19 },
          { ...element('text', 'b'), y: 100 },
        ],
      },
    };
  }
  function normalizeDesign(value) {
    if (!value || !Array.isArray(value.elements) || value.elements.length > 80)
      throw Error('La plantilla debe contener como máximo 80 capas.');
    const seen = new Set();
    return {
      version: 1,
      elements: value.elements.map((raw) => {
        const types = ['text', 'rect', 'ellipse', 'line', 'svg', 'image'];
        if (!types.includes(raw?.type)) throw Error('Tipo de capa no válido.');
        let key = typeof raw.id === 'string' && raw.id.length < 100 ? raw.id : id();
        if (seen.has(key)) key = id();
        seen.add(key);
        const e = {
          ...element(raw.type),
          id: key,
          name: String(raw.name || 'Capa').slice(0, 80),
          x: num(raw.x, 10, 0, 300),
          y: num(raw.y, 55, 0, 150),
          width: num(raw.width, 280, 2, 300),
          height: num(raw.height, 30, 2, 150),
          rotation: num(raw.rotation, 0, -180, 180),
          opacity: num(raw.opacity, 1, 0, 1),
          visible: raw.visible !== false,
          field: fields.some((f) => f.key === raw.field) ? raw.field : '',
          text: String(raw.text || '').slice(0, 1000),
          font: String(raw.font || '').slice(0, 100),
          fontSize: num(raw.fontSize, 20, 4, 100),
          align: ['left', 'center', 'right'].includes(raw.align) ? raw.align : 'center',
          baseline: ['middle', 'alphabetic', 'central'].includes(raw.baseline)
            ? raw.baseline
            : 'central',
          strokeRole: ['ink', 'artistInk', 'graphicsInk', 'paper'].includes(raw.strokeRole)
            ? raw.strokeRole
            : 'fixed',
          colorRole: ['ink', 'artistInk', 'graphicsInk', 'paper', 'fixed'].includes(raw.colorRole)
            ? raw.colorRole
            : 'fixed',
          background: color(raw.background, 'transparent'),
          fill: raw.fill === 'none' ? 'none' : color(raw.fill),
          stroke: color(raw.stroke),
          strokeWidth: num(raw.strokeWidth, 0, 0, 20),
          radius: num(raw.radius, 0, 0, 75),
        };
        if (e.type === 'svg') {
          e.svg = sanitizeSvg(raw.svg);
          if (raw.palette)
            e.palette = Object.fromEntries(
              ['paper', 'graphicsInk', 'ink', 'artistInk']
                .filter((key) => /^#[0-9a-f]{6}$/i.test(raw.palette[key]))
                .map((key) => [key, raw.palette[key]]),
            );
        }
        if (e.type === 'image') {
          e.src = raster(raw.src);
          if (!e.src) throw Error('Imagen no válida. Utiliza PNG, JPG o WebP de hasta 2 MB.');
        }
        return e;
      }),
    };
  }
  function normalizeTemplate(raw) {
    const design = normalizeDesign(raw?.design);
    const legacyArtist = design.elements.find(
      (layer) =>
        layer.type === 'text' && layer.field.startsWith('artist') && layer.colorRole === 'paper',
    );
    if (legacyArtist)
      design.elements.forEach((layer) => {
        if (
          layer.type === 'text' &&
          layer.field.startsWith('artist') &&
          layer.colorRole === 'paper'
        )
          layer.colorRole = 'artistInk';
      });
    return {
      ...newTemplate(),
      id: typeof raw?.id === 'string' && /^custom-[\w-]+$/.test(raw.id) ? raw.id : '',
      name:
        String(raw?.name || '')
          .trim()
          .slice(0, 80) || 'Mi plantilla',
      ink: color(raw?.ink, '#28548a'),
      artistInk: legacyArtist ? color(raw?.paper, legacyArtist.fill) : color(raw?.artistInk),
      graphicsInk: color(raw?.graphicsInk),
      paper: color(raw?.paper, '#ffffff'),
      font: String(raw?.font || 'DM Sans').slice(0, 100),
      artistFont: String(raw?.artistFont || '').slice(0, 100),
      titlePx: num(raw?.titlePx, 20, 6, 48),
      artistPx: num(raw?.artistPx, 19, 6, 48),
      showGenre: raw?.showGenre === true,
      showRpm: raw?.showRpm === true,
      showNumber: raw?.showNumber === true,
      design,
    };
  }

  // --- Diseños integrados: textos vinculados y gráficos independientes ---
  function fromBuiltinSvg(source, base) {
    const root = new DOMParser().parseFromString(
      sanitizeSvg(source),
      'image/svg+xml',
    ).documentElement;
    const layers = [];
    const roleFor = (value, preferred = 'graphicsInk') => {
      if (value === 'none') return 'fixed';
      const lower = String(value || '').toLowerCase();
      if (lower === String(base[preferred] || '').toLowerCase()) return preferred;
      for (const key of ['paper', 'graphicsInk', 'ink', 'artistInk'])
        if (lower === String(base[key] || '').toLowerCase()) return key;
      return 'fixed';
    };
    let mounted = false;
    try {
      // Medición real del trazo; sin DOM de navegador se conserva el lienzo completo.
      if (globalThis.document?.body && root.style) {
        Object.assign(root.style, {
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '300px',
          height: '150px',
          visibility: 'hidden',
          pointerEvents: 'none',
        });
        globalThis.document.body.appendChild(root);
        mounted = true;
      }
      for (const [index, node] of Array.from(root.children).entries()) {
        const tag = node.localName;
        if (['style', 'defs', 'title', 'desc'].includes(tag)) continue;
        if (
          index === 0 &&
          tag === 'rect' &&
          Number(node.getAttribute('width')) === 300 &&
          Number(node.getAttribute('height')) === 150
        )
          continue;
        const value = (name, fallback = 0) => {
          const n = parseFloat(node.getAttribute(name));
          return Number.isFinite(n) ? n : fallback;
        };
        const field = node.getAttribute('data-disc-field');
        const fill = node.getAttribute('fill') || '#000000';
        const opacity = value('opacity', 1);
        if (field && fields.some((f) => f.key === field)) {
          const px = value('font-size', 20),
            centerY = value('y');
          const height = Math.max(
            2,
            Math.min(Math.max(12, px * 1.6), centerY * 2, (150 - centerY) * 2),
          );
          const width = value('data-disc-width', 280);
          const anchor = node.getAttribute('text-anchor') || 'start';
          const align = { middle: 'center', start: 'left', end: 'right' }[anchor] || 'left';
          const x = value('x') - (align === 'center' ? width / 2 : align === 'right' ? width : 0);
          layers.push({
            ...element('text', field),
            x,
            y: centerY - height / 2,
            width,
            height,
            font: node.getAttribute('font-family') || base.font || 'Georgia',
            fontSize: px,
            align,
            baseline: node.getAttribute('dominant-baseline') || 'alphabetic',
            fill,
            colorRole: field.startsWith('artist') ? 'artistInk' : roleFor(fill, 'ink'),
            opacity,
          });
          continue;
        }
        if (['rect', 'circle', 'ellipse'].includes(tag) && !node.hasAttribute('transform')) {
          const ellipse = tag !== 'rect';
          const rx = value(tag === 'circle' ? 'r' : 'rx');
          const ry = tag === 'circle' ? rx : value('ry');
          layers.push({
            ...element(ellipse ? 'ellipse' : 'rect'),
            name: ellipse ? 'Elipse del diseño' : 'Cartela del diseño',
            x: ellipse ? value('cx') - rx : value('x'),
            y: ellipse ? value('cy') - ry : value('y'),
            width: ellipse ? rx * 2 : value('width', 100),
            height: ellipse ? ry * 2 : value('height', 30),
            radius: ellipse ? 0 : value('rx'),
            fill,
            colorRole: roleFor(fill),
            stroke: node.getAttribute('stroke') || '#213d36',
            strokeRole: roleFor(node.getAttribute('stroke')),
            strokeWidth: value('stroke-width'),
            opacity,
          });
          continue;
        }
        let box = { x: 0, y: 0, width: 300, height: 150 };
        try {
          const bounds = node.getBBox(),
            matrix = node.getCTM();
          const corners = [
            [bounds.x, bounds.y],
            [bounds.x + bounds.width, bounds.y],
            [bounds.x, bounds.y + bounds.height],
            [bounds.x + bounds.width, bounds.y + bounds.height],
          ].map(([x, y]) =>
            matrix
              ? [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f]
              : [x, y],
          );
          const pad = value('stroke-width') / 2 + 1;
          const x = Math.max(0, Math.min(...corners.map((p) => p[0])) - pad);
          const y = Math.max(0, Math.min(...corners.map((p) => p[1])) - pad);
          const right = Math.min(300, Math.max(...corners.map((p) => p[0])) + pad);
          const bottom = Math.min(150, Math.max(...corners.map((p) => p[1])) + pad);
          box = { x, y, width: Math.max(2, right - x), height: Math.max(2, bottom - y) };
        } catch {}
        node.removeAttribute('opacity');
        layers.push({
          ...element('svg'),
          ...box,
          opacity,
          name: tag === 'text' ? 'Adorno tipográfico' : 'Trazo del diseño',
          svg:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' +
            [box.x, box.y, box.width, box.height].join(' ') +
            '">' +
            node.outerHTML +
            '</svg>',
          palette: { paper: base.paper, graphicsInk: base.graphicsInk },
        });
      }
      return normalizeTemplate({
        ...base,
        id: '',
        // Conserva el blanco de un artista en inversa sin vincularlo al papel.
        artistInk:
          layers.find((layer) => layer.type === 'text' && layer.field.startsWith('artist'))?.fill ||
          base.artistInk,
        design: { version: 1, elements: layers },
      });
    } finally {
      if (mounted) root.remove();
    }
  }

  const content = (e, card) =>
    e.field === 'artist'
      ? [card.artist, card.artistB].filter(Boolean).join(' / ')
      : e.field === 'artistA'
        ? card.artist || ''
        : e.field
          ? card[e.field] || ''
          : e.text;
  const isArtist = (e) => e.field.startsWith('artist');
  function metrics(e, card, fit) {
    const artist = isArtist(e);
    const family = e.font || (artist ? card.artistFont || card.font : card.font) || 'DM Sans';
    const scale = artist ? (card.artistPx ?? 19) / 19 : (card.titlePx ?? 20) / 20;
    const px =
      e.fontSize *
      (e.field && ['artist', 'artistA', 'artistB', 'a', 'b'].includes(e.field) ? scale : 1);
    return { ...fit(content(e, card), family, px, e.width), family, px };
  }
  function overflow(card, key, fit) {
    const keys =
      key === 'artist' ? ['artist', 'artistA'] : key === 'artistB' ? ['artist', 'artistB'] : [key];
    return card.customDesign.elements.some(
      (e) =>
        e.type === 'text' &&
        e.visible !== false &&
        keys.includes(e.field) &&
        metrics(e, card, fit).truncated,
    );
  }
  function render(card, settings, helpers, selected = '') {
    const design = normalizeDesign(card.customDesign);
    const H = (300 * settings.height) / settings.width;
    const fonts = new Set([card.font || 'DM Sans', card.artistFont || card.font || 'DM Sans']);
    let layers = '';
    for (const e of design.elements) {
      if (!e.visible) continue;
      const flag = { category: 'showGenre', rpm: 'showRpm', number: 'showNumber' }[e.field];
      if (flag && card[flag] === false) continue;
      const fill = e.colorRole === 'fixed' ? e.fill : color(card[e.colorRole], color(e.fill));
      const stroke = e.strokeRole === 'fixed' ? e.stroke : color(card[e.strokeRole], e.stroke);
      const transform =
        'translate(' +
        e.x +
        ' ' +
        e.y +
        ') rotate(' +
        e.rotation +
        ' ' +
        e.width / 2 +
        ' ' +
        e.height / 2 +
        ')';
      let shape = '';
      if (e.type === 'text') {
        const m = metrics(e, card, helpers.fit);
        fonts.add(m.family);
        const anchor = { left: 'start', center: 'middle', right: 'end' }[e.align];
        const x = e.align === 'left' ? 0 : e.align === 'right' ? e.width : e.width / 2;
        shape =
          '<text x="' +
          x +
          '" y="' +
          e.height / 2 +
          '" dominant-baseline="' +
          e.baseline +
          '" text-anchor="' +
          anchor +
          '" fill="' +
          fill +
          '" font-family="' +
          escape(m.family) +
          '" font-size="' +
          m.px +
          '" font-weight="400">' +
          escape(m.text) +
          '</text>';
        // El fondo pertenece a la capa y comparte su geometría, opacidad y giro.
        if (e.background !== 'transparent')
          shape =
            '<rect data-text-background="true" width="' +
            e.width +
            '" height="' +
            e.height +
            '" fill="' +
            e.background +
            '"/>' +
            shape;
      } else if (e.type === 'rect')
        shape =
          '<rect width="' +
          e.width +
          '" height="' +
          e.height +
          '" rx="' +
          e.radius +
          '" fill="' +
          fill +
          '" stroke="' +
          stroke +
          '" stroke-width="' +
          e.strokeWidth +
          '"/>';
      else if (e.type === 'ellipse')
        shape =
          '<ellipse cx="' +
          e.width / 2 +
          '" cy="' +
          e.height / 2 +
          '" rx="' +
          e.width / 2 +
          '" ry="' +
          e.height / 2 +
          '" fill="' +
          fill +
          '" stroke="' +
          stroke +
          '" stroke-width="' +
          e.strokeWidth +
          '"/>';
      else if (e.type === 'line')
        shape =
          '<path d="M0 ' +
          e.height / 2 +
          'H' +
          e.width +
          '" stroke="' +
          fill +
          '" stroke-width="' +
          (e.strokeWidth || 1) +
          '" fill="none"/>';
      else if (e.type === 'svg') {
        // Las fuentes de texto gráfico también viajan dentro del recurso SVG.
        let resource = e.svg;
        if (e.palette)
          resource = resource.replace(
            /\b(fill|stroke|stop-color)="(#[0-9a-f]{6})"/gi,
            (match, attr, original) => {
              const role = Object.keys(e.palette).find(
                (key) => e.palette[key].toLowerCase() === original.toLowerCase(),
              );
              return role ? attr + '="' + color(card[role], original) + '"' : match;
            },
          );
        const resourceFonts = Object.keys(globalThis.StudioFonts || {})
          .filter((family) => resource.includes('font-family="' + family + '"'))
          .map((family) => globalThis.StudioFonts[family])
          .join('');
        if (resourceFonts)
          resource = resource.replace('>', '><style>' + resourceFonts + '</style>');
        // data SVG se ejecuta en contexto de imagen, sin referencias entre capas.
        shape =
          '<image width="' +
          e.width +
          '" height="' +
          e.height +
          '" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;charset=utf-8,' +
          escape(encodeURIComponent(resource)) +
          '"/>';
      } else if (e.type === 'image')
        shape =
          '<image width="' +
          e.width +
          '" height="' +
          e.height +
          '" preserveAspectRatio="xMidYMid meet" href="' +
          escape(e.src) +
          '"/>';
      layers +=
        '<g transform="' +
        transform +
        '" opacity="' +
        e.opacity +
        '">' +
        shape +
        (e.id === selected
          ? '<rect width="' +
            e.width +
            '" height="' +
            e.height +
            '" fill="none" stroke="#b9553b" stroke-width="1" stroke-dasharray="3 2"/>'
          : '') +
        '</g>';
    }
    const css = [...fonts].map((f) => globalThis.StudioFonts?.[f] || '').join('');
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      settings.width +
      'mm" height="' +
      settings.height +
      'mm" viewBox="0 0 300 ' +
      H +
      '" role="img" aria-label="' +
      escape(card.artist + ' ' + card.a) +
      '"><style>' +
      css +
      '</style><rect width="300" height="' +
      H +
      '" fill="' +
      color(card.paper, '#ffffff') +
      '"/><g transform="scale(1 ' +
      H / 150 +
      ')">' +
      layers +
      '</g></svg>'
    );
  }
  globalThis.StudioTemplateTools = {
    fields,
    clone,
    id,
    element,
    newTemplate,
    normalizeDesign,
    normalizeTemplate,
    fromBuiltinSvg,
    sanitizeSvg,
    render,
    overflow,
    metrics,
  };
})();

// --- Editor visual: el borrador no modifica el catálogo hasta guardar ---
globalThis.StudioComponents.TemplateDesigner = {
  props: { initial: Object, settings: Object, fonts: Array, renderCard: Function },
  emits: ['save', 'close'],
  data() {
    const tools = globalThis.StudioTemplateTools;
    return {
      model: this.initial
        ? tools.normalizeTemplate(tools.clone(this.initial))
        : tools.newTemplate(),
      selectedId: '',
      undoStack: [],
      redoStack: [],
      cleanState: '',
      error: '',
      dragging: false,
      lastState: '',
      fileBusy: false,
      fieldToAdd: 'a',
      sampleMode: 'sample',
      stopDrag: null,
    };
  },
  computed: {
    fields() {
      return globalThis.StudioTemplateTools.fields;
    },
    layers() {
      return this.model.design.elements;
    },
    selectedLayer() {
      return this.layers.find((e) => e.id === this.selectedId);
    },
    canSave() {
      return !!this.model.name.trim() && !this.fileBusy;
    },
    previewCard() {
      const card = {
        ...this.model,
        customDesign: this.model.design,
        artist: 'Artista A',
        artistB: 'Artista B',
        a: 'Título de la cara A',
        b: 'Título de la cara B',
        category: 'ROCK & ROLL',
        rpm: '45 RPM',
        number: 'A1',
        label: 'Sello',
        year: '1957',
        showGenre: true,
        showRpm: true,
        showNumber: true,
      };
      if (this.sampleMode === 'long')
        Object.assign(card, {
          artist: 'Artista con nombre largo',
          artistB: 'Segundo artista',
          a: 'Un título largo para comprobar el espacio disponible',
          b: 'Otra canción con un título muy largo',
        });
      return card;
    },
    preview() {
      return this.renderCard(this.previewCard);
    },
    selectionStyle() {
      const e = this.selectedLayer;
      if (!e || !e.visible) return {};
      return {
        left: e.x / 3 + '%',
        top: e.y / 1.5 + '%',
        width: e.width / 3 + '%',
        height: e.height / 1.5 + '%',
        transform: 'rotate(' + e.rotation + 'deg)',
      };
    },
    dirty() {
      return JSON.stringify(this.model) !== this.cleanState;
    },
  },
  watch: {
    model: {
      deep: true,
      handler() {
        if (!this.dragging) this.remember();
      },
    },
  },
  mounted() {
    this.lastState = JSON.stringify(this.model);
    this.cleanState = this.lastState;
    this.selectedId = this.layers.find((e) => e.type === 'text')?.id || '';
  },
  beforeUnmount() {
    this.stopDrag?.();
  },
  methods: {
    remember() {
      const next = JSON.stringify(this.model);
      if (next === this.lastState) return;
      this.undoStack.push(this.lastState);
      if (this.undoStack.length > 40) this.undoStack.shift();
      this.redoStack = [];
      this.lastState = next;
    },
    undo() {
      if (!this.undoStack.length) return;
      this.redoStack.push(JSON.stringify(this.model));
      this.lastState = this.undoStack.pop();
      this.model = JSON.parse(this.lastState);
    },
    redo() {
      if (!this.redoStack.length) return;
      this.undoStack.push(JSON.stringify(this.model));
      this.lastState = this.redoStack.pop();
      this.model = JSON.parse(this.lastState);
    },
    add(type, field = '') {
      if (this.layers.length >= 80) {
        this.error = 'Máximo 80 capas por plantilla.';
        return;
      }
      const e = globalThis.StudioTemplateTools.element(type, field);
      if (type !== 'text') Object.assign(e, { width: 100, height: type === 'line' ? 4 : 30 });
      this.layers.push(e);
      this.selectedId = e.id;
      this.error = '';
    },
    duplicate() {
      if (!this.selectedLayer || this.layers.length >= 80) return;
      const tools = globalThis.StudioTemplateTools;
      const e = {
        ...tools.clone(this.selectedLayer),
        id: tools.id(),
        name: this.selectedLayer.name + ' (copia)',
      };
      e.x = Math.min(300 - e.width, e.x + 4);
      e.y = Math.min(150 - e.height, e.y + 4);
      this.layers.push(e);
      this.selectedId = e.id;
    },
    remove() {
      this.model.design.elements = this.layers.filter((e) => e.id !== this.selectedId);
      this.selectedId = '';
    },
    order(direction) {
      const index = this.layers.findIndex((e) => e.id === this.selectedId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= this.layers.length) return;
      const list = [...this.layers];
      [list[index], list[target]] = [list[target], list[index]];
      this.model.design.elements = list;
    },
    align(direction) {
      const e = this.selectedLayer;
      if (!e) return;
      if (direction === 'left') e.x = 0;
      if (direction === 'center') e.x = (300 - e.width) / 2;
      if (direction === 'right') e.x = 300 - e.width;
      if (direction === 'middle') e.y = (150 - e.height) / 2;
    },
    clear() {
      if (this.layers.length && !window.confirm('¿Vaciar el lienzo? Puedes deshacerlo.')) return;
      this.model.design.elements = [];
      this.selectedId = '';
    },
    // Las coordenadas se convierten desde píxeles de pantalla al lienzo lógico.
    startPointer(event, resize = false) {
      if (event.button !== 0) return;
      const box = this.$refs.stage.getBoundingClientRect();
      let e = this.selectedLayer;
      const x = ((event.clientX - box.left) * 300) / box.width,
        y = ((event.clientY - box.top) * 150) / box.height;
      if (!resize) {
        e = [...this.layers].reverse().find((layer) => {
          if (!layer.visible) return false;
          const angle = (-layer.rotation * Math.PI) / 180;
          const dx = x - layer.x - layer.width / 2,
            dy = y - layer.y - layer.height / 2;
          const lx = dx * Math.cos(angle) - dy * Math.sin(angle) + layer.width / 2;
          const ly = dx * Math.sin(angle) + dy * Math.cos(angle) + layer.height / 2;
          return lx >= 0 && lx <= layer.width && ly >= 0 && ly <= layer.height;
        });
        this.selectedId = e?.id || '';
      }
      if (!e) return;
      event.preventDefault();
      const origin = { x: e.x, y: e.y, width: e.width, height: e.height };
      const before = JSON.stringify(this.model);
      this.dragging = true;
      const stage = this.$refs.stage;
      stage.setPointerCapture?.(event.pointerId);
      const move = (ev) => {
        const dx = ((ev.clientX - event.clientX) * 300) / box.width;
        const dy = ((ev.clientY - event.clientY) * 150) / box.height;
        if (resize) {
          const angle = (-e.rotation * Math.PI) / 180;
          e.width = Math.round(
            Math.max(
              4,
              Math.min(300 - origin.x, origin.width + dx * Math.cos(angle) - dy * Math.sin(angle)),
            ),
          );
          e.height = Math.round(
            Math.max(
              4,
              Math.min(150 - origin.y, origin.height + dx * Math.sin(angle) + dy * Math.cos(angle)),
            ),
          );
        } else {
          e.x = Math.round(Math.max(0, Math.min(300 - e.width, origin.x + dx)));
          e.y = Math.round(Math.max(0, Math.min(150 - e.height, origin.y + dy)));
        }
      };
      const stop = (ev) => {
        stage.removeEventListener('pointermove', move);
        stage.removeEventListener('pointerup', stop);
        stage.removeEventListener('pointercancel', stop);
        if (stage.hasPointerCapture?.(event.pointerId))
          stage.releasePointerCapture(event.pointerId);
        if (ev?.type === 'pointercancel') this.model = JSON.parse(before);
        this.dragging = false;
        this.remember();
        this.stopDrag = null;
      };
      stage.addEventListener('pointermove', move);
      stage.addEventListener('pointerup', stop);
      stage.addEventListener('pointercancel', stop);
      this.stopDrag = stop;
    },
    keydown(event) {
      if (event.target.closest('input,select,textarea,summary,button')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? this.redo() : this.undo();
        return;
      }
      const e = this.selectedLayer;
      if (!e) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.remove();
      }
      const deltas = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const d = deltas[event.key];
      if (d) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        e.x = Math.max(0, Math.min(300 - e.width, e.x + d[0] * step));
        e.y = Math.max(0, Math.min(150 - e.height, e.y + d[1] * step));
      }
    },
    async importAsset(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (this.layers.length >= 80) {
        this.error = 'Máximo 80 capas por plantilla.';
        return;
      }
      this.fileBusy = true;
      this.error = '';
      try {
        const tools = globalThis.StudioTemplateTools;
        const svg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
        if (file.size > (svg ? 1000000 : 2000000))
          throw Error('Máximo 1 MB por SVG y 2 MB por imagen.');
        let e = tools.element(svg ? 'svg' : 'image');
        Object.assign(e, { name: file.name.slice(0, 80), width: 100, height: 50 });
        if (svg) {
          e.svg = tools.sanitizeSvg(await file.text());
          const root = new DOMParser().parseFromString(e.svg, 'image/svg+xml').documentElement;
          const vb = root
            .getAttribute('viewBox')
            ?.trim()
            .split(/[\s,]+/)
            .map(Number);
          const width = vb?.[2] || parseFloat(root.getAttribute('width')) || 100;
          const height = vb?.[3] || parseFloat(root.getAttribute('height')) || 50;
          e.height = Math.min(90, Math.max(4, (100 * height) / width));
        } else {
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
            throw Error('Utiliza SVG, PNG, JPG o WebP.');
          e.src = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(Error('No se pudo leer la imagen.'));
            reader.readAsDataURL(file);
          });
        }
        this.layers.push(e);
        this.selectedId = e.id;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.fileBusy = false;
      }
    },
    async importTemplate(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      this.error = '';
      try {
        if (file.size > 5000000) throw Error('Plantilla demasiado grande (máximo 5 MB).');
        const data = JSON.parse(await file.text());
        if (data.kind !== 'title-studio-template')
          throw Error('No es una plantilla de Title Studio.');
        const next = globalThis.StudioTemplateTools.normalizeTemplate(data.template);
        next.id = this.model.id;
        this.model = next;
        this.selectedId = '';
      } catch (error) {
        this.error = error.message;
      }
    },
    exportTemplate() {
      try {
        const template = globalThis.StudioTemplateTools.normalizeTemplate(this.model);
        const blob = new Blob(
          [JSON.stringify({ kind: 'title-studio-template', schema: 1, template }, null, 2)],
          { type: 'application/json' },
        );
        const url = URL.createObjectURL(blob),
          a = document.createElement('a');
        a.href = url;
        a.download = 'title-studio-plantilla.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        this.error = error.message;
      }
    },
    save() {
      try {
        this.$emit('save', globalThis.StudioTemplateTools.normalizeTemplate(this.model));
      } catch (error) {
        this.error = error.message;
      }
    },
    close() {
      if (this.dirty && !window.confirm('¿Descartar los cambios sin guardar de esta plantilla?'))
        return;
      this.$emit('close');
    },
  },
  template: `
    <section class="template-designer" @keydown="keydown">
        <header class="designer-heading">
          <h2>{{ initial ? 'Editar plantilla' : 'Crear plantilla' }}</h2>
          <div class="designer-heading-actions">
            <button class="control-icon" type="button" @click="undo" :disabled="!undoStack.length" title="Deshacer" aria-label="Deshacer en plantilla">↶</button>
            <button class="control-icon" type="button" @click="redo" :disabled="!redoStack.length" title="Rehacer" aria-label="Rehacer en plantilla">↷</button>
            <button class="control-icon" type="button" @click="close" title="Cerrar editor" aria-label="Cerrar editor de plantilla">×</button>
          </div>
        </header>
        <div class="designer-identity">
          <label>Nombre<input v-model="model.name" maxlength="80" placeholder="Nombre de tu plantilla" /></label>
          <color-picker label="Papel" v-model="model.paper"></color-picker>
          <button class="control-icon" type="button" @click="$refs.templateFile.click()" title="Importar plantilla JSON" aria-label="Importar plantilla JSON">↥</button>
          <button class="control-icon" type="button" @click="exportTemplate" title="Exportar plantilla JSON" aria-label="Exportar plantilla JSON">↧</button>
        </div>
        <div class="designer-workspace">
          <div class="designer-canvas-panel">
            <div class="designer-tools" role="group" aria-label="Añadir elementos">
              <label class="designer-field-select"><span class="sr-only">Campo del disco</span><select v-model="fieldToAdd" aria-label="Campo del disco para añadir"><option v-for="field in fields" :value="field.key">{{ field.label }}</option></select></label>
              <button class="control-icon" type="button" @click="add('text',fieldToAdd)" title="Añadir campo del disco" aria-label="Añadir campo del disco">＋</button>
              <button class="control-icon" type="button" @click="add('text')" title="Añadir texto libre" aria-label="Añadir texto libre">T</button>
              <button class="control-icon" type="button" @click="add('line')" title="Añadir línea" aria-label="Añadir línea">╱</button>
              <button class="control-icon" type="button" @click="add('rect')" title="Añadir rectángulo" aria-label="Añadir rectángulo">▭</button>
              <button class="control-icon" type="button" @click="add('ellipse')" title="Añadir elipse" aria-label="Añadir elipse">◯</button>
              <button class="control-icon" type="button" @click="$refs.assetFile.click()" :disabled="fileBusy" title="Importar SVG o imagen" aria-label="Importar SVG o imagen">▧</button>
            </div>
            <div class="designer-stage-shell">
              <div ref="stage" class="designer-stage" tabindex="0" role="group" aria-label="Lienzo de plantilla. Selecciona y arrastra una capa; usa las flechas para moverla." :style="{aspectRatio:settings.width+'/'+settings.height}" @pointerdown="startPointer">
                <div class="designer-drawing" v-html="preview"></div>
                <div v-if="selectedLayer && selectedLayer.visible" class="designer-selection" :style="selectionStyle">
                  <button type="button" class="designer-resize" @pointerdown.stop="startPointer($event,true)" title="Arrastrar para cambiar tamaño" aria-label="Cambiar tamaño de la capa"></button>
                </div>
              </div>
            </div>
            <div class="designer-preview-options">
              <span>{{ settings.width }} × {{ settings.height }} mm</span>
              <label><span class="sr-only">Texto de prueba</span><select v-model="sampleMode" aria-label="Texto de prueba"><option value="sample">Texto de muestra</option><option value="long">Probar nombres largos</option></select></label>
              <button type="button" class="text-btn" @click="clear">Vaciar lienzo</button>
            </div>
            <p class="designer-help">Arrastra las capas o ajusta sus medidas. Flechas para mover · Mayús para pasos de 10.</p>
            <div class="designer-layer-heading"><h3>Capas</h3><small>{{ layers.length }} / 80</small></div>
            <ol class="designer-layers" aria-label="Capas, de delante hacia atrás">
              <li v-for="layer in [...layers].reverse()" :key="layer.id" :class="{active:layer.id===selectedId}">
                <button type="button" class="designer-layer-name" @click="selectedId=layer.id" :aria-pressed="layer.id===selectedId">{{ layer.name }}</button>
                <button type="button" class="control-icon" @click="layer.visible=!layer.visible" :title="layer.visible ? 'Ocultar capa' : 'Mostrar capa'" :aria-label="(layer.visible ? 'Ocultar ' : 'Mostrar ')+layer.name" :aria-pressed="layer.visible">{{ layer.visible ? '◉' : '○' }}</button>
              </li>
            </ol>
            <p v-if="!layers.length" class="small-muted">Añade campos, formas o un gráfico para empezar.</p>
          </div>
          <aside class="designer-properties" aria-label="Propiedades de capa">
            <h3>Propiedades</h3>
            <template v-if="selectedLayer">
              <label>Nombre de la capa<input v-model="selectedLayer.name" maxlength="80" /></label>
              <div class="designer-layer-actions">
                <button class="control-icon" type="button" @click="duplicate" title="Duplicar capa" aria-label="Duplicar capa">⧉</button>
                <button class="control-icon" type="button" @click="order(1)" title="Traer hacia delante" aria-label="Traer capa hacia delante">↑</button>
                <button class="control-icon" type="button" @click="order(-1)" title="Enviar hacia atrás" aria-label="Enviar capa hacia atrás">↓</button>
                <button class="control-icon danger" type="button" @click="remove" title="Eliminar capa" aria-label="Eliminar capa"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg></button>
              </div>
              <div class="designer-measures">
                <label>X<input type="number" min="0" max="300" v-model.number="selectedLayer.x" /></label>
                <label>Y<input type="number" min="0" max="150" v-model.number="selectedLayer.y" /></label>
                <label>Ancho<input type="number" min="2" max="300" v-model.number="selectedLayer.width" /></label>
                <label>Alto<input type="number" min="2" max="150" v-model.number="selectedLayer.height" /></label>
                <label>Giro · °<input type="number" min="-180" max="180" v-model.number="selectedLayer.rotation" /></label>
                <label>Opacidad<input type="number" min="0" max="1" step="0.05" v-model.number="selectedLayer.opacity" /></label>
              </div>
              <div class="designer-align" role="group" aria-label="Alinear en el lienzo">
                <button type="button" class="control-icon" @click="align('left')" title="Alinear a izquierda" aria-label="Alinear a izquierda">⇤</button>
                <button type="button" class="control-icon" @click="align('center')" title="Centrar horizontalmente" aria-label="Centrar horizontalmente">↔</button>
                <button type="button" class="control-icon" @click="align('right')" title="Alinear a derecha" aria-label="Alinear a derecha">⇥</button>
                <button type="button" class="control-icon" @click="align('middle')" title="Centrar verticalmente en la tarjeta" aria-label="Centrar verticalmente en la tarjeta">↕</button>
              </div>
              <template v-if="selectedLayer.type==='text'">
                <label>Contenido<select v-model="selectedLayer.field" aria-label="Contenido"><option value="">Texto libre</option><option v-for="field in fields" :value="field.key">{{ field.label }}</option></select></label>
                <label v-if="!selectedLayer.field">Texto<input v-model="selectedLayer.text" maxlength="1000" /></label>
                <font-picker v-model="selectedLayer.font" :options="fonts" label="Fuente de la capa" sample="Título de la cara A" inherit></font-picker>
                <div class="designer-measures">
                  <label>Tamaño · px<input type="number" min="4" max="100" v-model.number="selectedLayer.fontSize" /></label>
                  <label>Alineación<select v-model="selectedLayer.align"><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label>
                </div>
              </template>
              <color-picker v-if="selectedLayer.type==='text'" label="Fondo del texto" v-model="selectedLayer.background"></color-picker>
              <color-picker v-if="selectedLayer.type === 'svg' && selectedLayer.palette" label="Elementos" v-model="model.graphicsInk"></color-picker>
              <template v-if="!['svg','image'].includes(selectedLayer.type)">
                <div class="designer-color-row">
                  <label>Color<select v-model="selectedLayer.colorRole"><option value="ink">Canciones</option><option value="artistInk">Artista</option><option value="graphicsInk">Elementos</option>
                  <option value="paper">Papel</option><option value="fixed">Propio</option></select></label>
                  <color-picker v-if="selectedLayer.colorRole==='fixed'" label="Tinta" v-model="selectedLayer.fill"></color-picker><color-picker v-else label="Tinta" v-model="model[selectedLayer.colorRole]"></color-picker>
                </div>
                <label v-if="selectedLayer.type==='line'">Grosor<input type="number" min="0.5" max="20" step="0.5" v-model.number="selectedLayer.strokeWidth" /></label>
                <template v-if="['rect','ellipse'].includes(selectedLayer.type)">
                  <label class="designer-check"><input type="checkbox" :checked="selectedLayer.fill==='none'" @change="selectedLayer.fill=$event.target.checked ? 'none' : '#213d36'; selectedLayer.colorRole='fixed'" />Sin relleno</label>
                  <div class="designer-measures"><label>Borde<input type="number" min="0" max="20" step="0.5" v-model.number="selectedLayer.strokeWidth" /></label><color-picker label="Color borde" :model-value="selectedLayer.stroke" @update:model-value="selectedLayer.stroke = $event; selectedLayer.strokeRole = 'fixed'"></color-picker></div>
                  <label v-if="selectedLayer.type==='rect'">Redondeo<input type="number" min="0" max="75" v-model.number="selectedLayer.radius" /></label>
                </template>
              </template>
            </template>
            <p v-else class="small-muted">Selecciona una capa en el lienzo o en la lista.</p>
          </aside>
        </div>
        <p v-if="error" class="designer-error" role="alert">{{ error }}</p>
        <footer class="designer-footer">
          <button type="button" class="text-btn" @click="close">Cancelar</button>
          <v-btn color="primary" :disabled="!canSave" @click="save">Guardar plantilla</v-btn>
        </footer>
        <input ref="assetFile" type="file" class="sr-only" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" @change="importAsset" />
        <input ref="templateFile" type="file" class="sr-only" accept=".json,application/json" @change="importTemplate" />
      </section>
  `,
};

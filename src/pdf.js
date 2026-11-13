/* Self-contained PDF writer. Physical coordinates in points, no browser print layout.
   Labels are rasterized at 600 dpi; each canvas is released before the next label. */
globalThis.StudioPDF = {
  async create({ s, dims, pages }, makeSvg) {
    await document.fonts?.ready;
    const enc = new TextEncoder(),
      objects = [null],
      pt = (n) => ((n * 72) / 25.4).toFixed(5);
    const add = (data) => {
      objects.push(typeof data === 'string' ? enc.encode(data) : data);
      return objects.length - 1;
    };
    const cat = (parts) => {
      const n = parts.reduce((a, p) => a + p.length, 0),
        out = new Uint8Array(n);
      let k = 0;
      for (const p of parts) {
        out.set(p, k);
        k += p.length;
      }
      return out;
    };
    const stream = (dict, data) =>
      cat([
        enc.encode(`<< ${dict} /Length ${data.length} >>\nstream\n`),
        data,
        enc.encode('\nendstream'),
      ]);
    const catalog = add(''),
      root = add(''),
      ids = [];
    for (const items of pages) {
      const resources = [],
        commands = [];
      for (const [index, item] of items.entries()) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil((s.width / 25.4) * 600);
        canvas.height = Math.ceil((s.height / 25.4) * 600);
        const url = URL.createObjectURL(
          new Blob([makeSvg(item.card, s)], { type: 'image/svg+xml' }),
        );
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(Error('No se pudo leer una etiqueta'));
            img.src = url;
          });
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const raw = atob(canvas.toDataURL('image/jpeg', 0.98).split(',')[1]),
            bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
          const id = add(
            stream(
              `/Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
              bytes,
            ),
          );
          resources.push(`/L${index} ${id} 0 R`);
          commands.push(
            `q ${pt(s.width)} 0 0 ${pt(s.height)} ${pt(item.x)} ${pt(dims[1] - item.y - s.height)} cm /L${index} Do Q`,
          );
          if (s.guides)
            commands.push(
              `q 0.55 G 0.25 w [2 2] 0 d ${pt(item.x)} ${pt(dims[1] - item.y - s.height)} ${pt(s.width)} ${pt(s.height)} re S Q`,
            );
        } finally {
          URL.revokeObjectURL(url);
          canvas.width = canvas.height = 0;
        }
      }
      const content = add(stream('', enc.encode(commands.join('\n'))));
      ids.push(
        add(
          `<< /Type /Page /Parent ${root} 0 R /MediaBox [0 0 ${pt(dims[0])} ${pt(dims[1])}] /Resources << /XObject << ${resources.join(' ')} >> >> /Contents ${content} 0 R >>`,
        ),
      );
    }
    objects[catalog] = enc.encode(
      `<< /Type /Catalog /Pages ${root} 0 R /ViewerPreferences << /PrintScaling /None >> >>`,
    );
    objects[root] = enc.encode(
      `<< /Type /Pages /Count ${ids.length} /Kids [${ids.map((i) => i + ' 0 R').join(' ')}] >>`,
    );
    const parts = [enc.encode('%PDF-1.4\n')],
      offsets = [0];
    let length = parts[0].length;
    for (let i = 1; i < objects.length; i++) {
      offsets.push(length);
      const part = cat([enc.encode(`${i} 0 obj\n`), objects[i], enc.encode('\nendobj\n')]);
      parts.push(part);
      length += part.length;
    }
    parts.push(
      enc.encode(
        `xref\n0 ${objects.length}\n0000000000 65535 f \n` +
          offsets
            .slice(1)
            .map((o) => String(o).padStart(10, '0') + ' 00000 n \n')
            .join('') +
          `trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${length}\n%%EOF`,
      ),
    );
    return cat(parts);
  },
};

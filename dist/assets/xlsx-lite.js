(() => {
  'use strict';

  const decoder = new TextDecoder('utf-8');

  function normalizePath(base, target) {
    if (target.startsWith('/')) return target.slice(1);
    const parts = base.split('/');
    parts.pop();
    for (const token of target.split('/')) {
      if (token === '.' || token === '') continue;
      if (token === '..') parts.pop();
      else parts.push(token);
    }
    return parts.join('/');
  }

  function findEocd(view) {
    const min = Math.max(0, view.byteLength - 0xffff - 22);
    for (let i = view.byteLength - 22; i >= min; i--) {
      if (view.getUint32(i, true) === 0x06054b50) return i;
    }
    throw new Error('Arquivo ZIP/XLSX inválido: diretório central não encontrado.');
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Este navegador não oferece descompressão necessária para XLSX. Use Chrome, Edge ou importe CSV.');
    }
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function openZip(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const eocd = findEocd(view);
    const entriesCount = view.getUint16(eocd + 10, true);
    const centralOffset = view.getUint32(eocd + 16, true);
    const entries = new Map();
    let p = centralOffset;

    for (let i = 0; i < entriesCount; i++) {
      if (view.getUint32(p, true) !== 0x02014b50) throw new Error('Diretório central corrompido.');
      const method = view.getUint16(p + 10, true);
      const compressedSize = view.getUint32(p + 20, true);
      const uncompressedSize = view.getUint32(p + 24, true);
      const nameLen = view.getUint16(p + 28, true);
      const extraLen = view.getUint16(p + 30, true);
      const commentLen = view.getUint16(p + 32, true);
      const localOffset = view.getUint32(p + 42, true);
      const name = decoder.decode(u8.slice(p + 46, p + 46 + nameLen));
      entries.set(name, { name, method, compressedSize, uncompressedSize, localOffset });
      p += 46 + nameLen + extraLen + commentLen;
    }

    async function read(name) {
      const entry = entries.get(name);
      if (!entry) return null;
      const off = entry.localOffset;
      if (view.getUint32(off, true) !== 0x04034b50) throw new Error(`Entrada ZIP inválida: ${name}`);
      const nameLen = view.getUint16(off + 26, true);
      const extraLen = view.getUint16(off + 28, true);
      const start = off + 30 + nameLen + extraLen;
      const compressed = u8.slice(start, start + entry.compressedSize);
      if (entry.method === 0) return compressed;
      if (entry.method === 8) return inflateRaw(compressed);
      throw new Error(`Método de compressão não suportado (${entry.method}) em ${name}.`);
    }

    return { entries, read };
  }

  function xml(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const error = doc.querySelector('parsererror');
    if (error) throw new Error('XML interno do XLSX inválido.');
    return doc;
  }

  function nodesByLocalName(root, name) {
    return Array.from(root.getElementsByTagName('*')).filter(n => n.localName === name);
  }

  function attr(node, localName) {
    for (const a of Array.from(node.attributes || [])) {
      if (a.localName === localName || a.name === localName) return a.value;
    }
    return null;
  }

  function textOfAll(node, localName) {
    return nodesByLocalName(node, localName).map(n => n.textContent || '').join('');
  }

  function colIndex(ref) {
    const match = String(ref || '').match(/^([A-Z]+)/i);
    if (!match) return 0;
    let n = 0;
    for (const ch of match[1].toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
    return n - 1;
  }

  function excelSerialToIso(serial, date1904 = false) {
    if (!Number.isFinite(serial)) return serial;
    const epoch = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
    const ms = epoch + serial * 86400000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return serial;
    const hasTime = Math.abs(serial - Math.trunc(serial)) > 1e-8;
    return hasTime ? d.toISOString().replace('.000Z', 'Z') : d.toISOString().slice(0, 10);
  }

  const builtInDates = new Set([14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57]);
  function looksDateFormat(fmt) {
    if (!fmt) return false;
    const clean = fmt
      .replace(/"[^"]*"/g, '')
      .replace(/\\./g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/_.|\*./g, '')
      .toLowerCase();
    return /(^|[^a-z])[dmyhs]+([^a-z]|$)/.test(clean) && !/\[h\]|\[m\]|\[s\]/.test(clean);
  }

  async function parseXlsx(arrayBuffer) {
    const zip = await openZip(arrayBuffer);
    const getText = async name => {
      const bytes = await zip.read(name);
      return bytes ? decoder.decode(bytes) : null;
    };

    const workbookText = await getText('xl/workbook.xml');
    const relsText = await getText('xl/_rels/workbook.xml.rels');
    if (!workbookText || !relsText) throw new Error('O arquivo não contém uma pasta de trabalho XLSX reconhecível.');

    const workbookDoc = xml(workbookText);
    const relsDoc = xml(relsText);
    const date1904Node = nodesByLocalName(workbookDoc, 'workbookPr')[0];
    const date1904 = date1904Node && ['1','true'].includes(String(attr(date1904Node, 'date1904')).toLowerCase());

    const relMap = new Map();
    for (const rel of nodesByLocalName(relsDoc, 'Relationship')) {
      relMap.set(attr(rel, 'Id'), normalizePath('xl/workbook.xml', attr(rel, 'Target') || ''));
    }

    let shared = [];
    const sharedName = Array.from(zip.entries.keys()).find(n => n === 'xl/sharedStrings.xml' || n.endsWith('/sharedStrings.xml'));
    if (sharedName) {
      const sharedDoc = xml(await getText(sharedName));
      shared = nodesByLocalName(sharedDoc, 'si').map(si => textOfAll(si, 't'));
    }

    let styleDate = [];
    const stylesName = Array.from(zip.entries.keys()).find(n => n === 'xl/styles.xml' || n.endsWith('/styles.xml'));
    if (stylesName) {
      const stylesDoc = xml(await getText(stylesName));
      const customFormats = new Map();
      for (const nf of nodesByLocalName(stylesDoc, 'numFmt')) {
        customFormats.set(Number(attr(nf, 'numFmtId')), attr(nf, 'formatCode') || '');
      }
      const cellXfs = nodesByLocalName(stylesDoc, 'cellXfs')[0];
      const xfs = cellXfs ? Array.from(cellXfs.children).filter(n => n.localName === 'xf') : [];
      styleDate = xfs.map(xf => {
        const id = Number(attr(xf, 'numFmtId') || 0);
        return builtInDates.has(id) || looksDateFormat(customFormats.get(id));
      });
    }

    const sheets = [];
    for (const sheetNode of nodesByLocalName(workbookDoc, 'sheet')) {
      const name = attr(sheetNode, 'name') || `Planilha ${sheets.length + 1}`;
      const relId = attr(sheetNode, 'id');
      const path = relMap.get(relId);
      if (!path || !zip.entries.has(path)) continue;
      const sheetDoc = xml(await getText(path));
      const rows = [];
      for (const rowNode of nodesByLocalName(sheetDoc, 'row')) {
        const rowNum = Number(attr(rowNode, 'r') || rows.length + 1) - 1;
        const row = rows[rowNum] || [];
        for (const c of Array.from(rowNode.children).filter(n => n.localName === 'c')) {
          const ref = attr(c, 'r');
          const idx = colIndex(ref);
          const type = attr(c, 't') || '';
          const style = Number(attr(c, 's') || 0);
          const vNode = Array.from(c.children).find(n => n.localName === 'v');
          let value = vNode ? vNode.textContent : '';

          if (type === 's') value = shared[Number(value)] ?? '';
          else if (type === 'inlineStr') value = textOfAll(c, 't');
          else if (type === 'str') value = String(value ?? '');
          else if (type === 'b') value = value === '1';
          else if (type === 'e') value = '';
          else if (value !== '') {
            const num = Number(value);
            if (Number.isFinite(num)) value = styleDate[style] ? excelSerialToIso(num, date1904) : num;
          }
          row[idx] = value;
        }
        rows[rowNum] = row;
      }
      sheets.push({ name, rows });
    }
    return { type: 'xlsx', sheets };
  }

  function parseCsvText(text) {
    const firstLine = String(text).split(/\r?\n/, 1)[0] || '';
    const candidates = [',', ';', '\t'];
    const delimiter = candidates
      .map(d => ({ d, count: firstLine.split(d).length - 1 }))
      .sort((a, b) => b.count - a.count)[0].d;
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else {
        if (ch === '"') quoted = true;
        else if (ch === delimiter) { row.push(cell.trim()); cell = ''; }
        else if (ch === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
        else if (ch !== '\r') cell += ch;
      }
    }
    if (cell.length || row.length) { row.push(cell.trim()); rows.push(row); }
    return { type: 'csv', sheets: [{ name: 'CSV', rows }] };
  }

  async function parseFile(file) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.csv')) return parseCsvText(await file.text());
    if (lower.endsWith('.xlsx')) return parseXlsx(await file.arrayBuffer());
    throw new Error('Formato não suportado. Use XLSX ou CSV.');
  }

  window.XLSX_LITE = { parseFile, parseXlsx, parseCsvText };
})();

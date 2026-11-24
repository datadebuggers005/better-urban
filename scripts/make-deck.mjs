import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/bablu/Desktop/CityBizz";
const manifestPath = path.join(root, "docs/screens/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const outDir = path.join(root, "docs/screens");
fs.mkdirSync(outDir, { recursive: true });

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (i + 3 >= buf.length) break;
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  throw new Error("no SOF marker");
}

function ascii(s) {
  return String(s)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00b7/g, ".")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[^\x20-\x7e]/g, "?");
}
function esc(s) { return ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }

function fontDict(name) {
  return Buffer.from(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} >>`);
}
function streamBuffer(s) {
  const b = Buffer.from(s);
  return Buffer.concat([Buffer.from(`<< /Length ${b.length} >> stream\n`), b, Buffer.from("\nendstream")]);
}

const objects = [];
function addObject(buf) { const id = objects.length + 1; objects.push({ id, buf }); return id; }

const fontRegular = addObject(fontDict("Helvetica"));
const fontBold = addObject(fontDict("Helvetica-Bold"));

const entries = manifest.map((e) => {
  const dest = path.join(outDir, e.name + ".jpeg");
  fs.copyFileSync(e.src, dest);
  const buf = fs.readFileSync(dest);
  const dims = jpegSize(buf);
  return { ...e, dest, buf, dims };
});

const pagesReservedId = addObject(Buffer.from("%%PAGES%%"));

for (const e of entries) {
  e.imgObj = addObject(Buffer.concat([
    Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${e.dims.width} /Height ${e.dims.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${e.buf.length} >> stream\n`),
    e.buf,
    Buffer.from("\nendstream"),
  ]));
}

// cover content
function coverContent() {
  const lines = [];
  let y = 760;
  lines.push(`BT /F2 11 Tf 40 ${y} Td (BETTER URBAN) Tj ET`);
  y -= 34;
  lines.push(`BT /F2 30 Tf 40 ${y} Td (Screen deck) Tj ET`);
  y -= 22;
  lines.push(`BT /F1 12 Tf 40 ${y} Td (Every screen of the prototype, captured at phone-frame resolution.) Tj ET`);
  y -= 16;
  lines.push(`BT /F1 10 Tf 40 ${y} Td (Tutedude Buildathon 2026 - CityFix track - 23 to 28 Nov 2026) Tj ET`);
  y -= 12;
  lines.push(`BT /F1 9 Tf 40 ${y} Td (Prototype: synthetic demo data, simulated dispatch, not affiliated with any government body.) Tj ET`);
  y -= 24;
  lines.push(`BT /F2 10 Tf 40 ${y} Td (Screens) Tj ET`);
  y -= 16;
  entries.forEach((e, i) => {
    const label = esc(`${String(i + 1).padStart(2, "0")}   ${e.title}   ${e.route}`);
    lines.push(`BT /F1 9 Tf 40 ${y} Td (${label}) Tj ET`);
    y -= 13;
  });
  const img = entries[0];
  const crop = img.crop || { x: 0, y: 0, w: img.dims.width, h: img.dims.height };
  const boxW = 230, boxH = 460, boxX = 330, boxBottom = 100, boxTopPdf = 560;
  const scale = Math.min(boxW / crop.w, boxH / crop.h);
  const drawnW = img.dims.width * scale;
  const drawnH = img.dims.height * scale;
  const imgLeft = boxX - crop.x * scale;
  const imgBottom = boxTopPdf + crop.y * scale - drawnH;
  lines.push("q");
  lines.push(`${boxX} ${boxBottom} ${boxW} ${boxH} re`);
  lines.push("W n");
  lines.push(`${imgLeft.toFixed(2)} ${imgBottom.toFixed(2)} ${drawnW.toFixed(2)} ${drawnH.toFixed(2)} cm`);
  lines.push(`/Im${img.imgObj} Do`);
  lines.push("Q");
  lines.push(`${boxX} ${boxBottom} ${boxW} ${boxH} re S`);
  return lines.join("\n");
}

const coverContentId = addObject(streamBuffer(coverContent()));
const coverPageId = addObject(Buffer.from(
  `<< /Type /Page /Parent ${pagesReservedId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> /XObject << /Im${entries[0].imgObj} ${entries[0].imgObj} 0 R >> >> /Contents ${coverContentId} 0 R >>`,
));

const totalPages = entries.length + 1;
const contentPageIds = [];

for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  e.pageNum = i + 2;
  const landscape = !!e.landscape;
  const pageW = landscape ? 842 : 595;
  const pageH = landscape ? 595 : 842;
  const margin = 40;
  const headerY = pageH - 30;
  const titleY = pageH - 52;
  const noteY = pageH - 72;
  const boxTopPdf = pageH - 92;
  const boxBottomPdf = 40;
  const boxH = boxTopPdf - boxBottomPdf;
  const boxW = pageW - margin * 2;
  const boxX = margin;

  const crop = e.crop || { x: 0, y: 0, w: e.dims.width, h: e.dims.height };
  const scale = Math.min(boxW / crop.w, boxH / crop.h);
  const drawnW = e.dims.width * scale;
  const drawnH = e.dims.height * scale;
  const imgLeft = boxX - crop.x * scale;
  const imgBottom = boxTopPdf + crop.y * scale - drawnH;

  const clipX = boxX;
  const clipY = boxBottomPdf;
  const clipW = boxW;
  const clipH = boxH;

  const lines = [];
  lines.push(`BT /F1 9 Tf ${margin} ${headerY} Td (Better Urban - screen deck) Tj ET`);
  const pn = `page ${e.pageNum} of ${totalPages}`;
  lines.push(`BT /F1 9 Tf ${pageW - margin - 70} ${headerY} Td (${esc(pn)}) Tj ET`);
  lines.push(`BT /F2 16 Tf ${margin} ${titleY} Td (${esc(e.title)}) Tj ET`);
  const sub = `${e.route}   -   ${e.note}`;
  lines.push(`BT /F1 9 Tf ${margin} ${noteY} Td (${esc(sub)}) Tj ET`);
  lines.push("q");
  lines.push(`${clipX} ${clipY} ${clipW} ${clipH} re`);
  lines.push("W n");
  lines.push(`${imgLeft.toFixed(2)} ${imgBottom.toFixed(2)} ${drawnW.toFixed(2)} ${drawnH.toFixed(2)} cm`);
  lines.push(`/Im${e.imgObj} Do`);
  lines.push("Q");
  lines.push(`${boxX} ${boxBottomPdf} ${boxW} ${boxH} re S`);
  lines.push(`BT /F1 8 Tf ${margin} 20 Td (Prototype - synthetic demo data - simulated dispatch - not affiliated with any government body.) Tj ET`);

  const contentId = addObject(streamBuffer(lines.join("\n")));
  const pageId = addObject(Buffer.from(
    `<< /Type /Page /Parent ${pagesReservedId} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> /XObject << /Im${e.imgObj} ${e.imgObj} 0 R >> >> /Contents ${contentId} 0 R >>`,
  ));
  contentPageIds.push(pageId);
}

const allPageIds = [coverPageId, ...contentPageIds];
objects[pagesReservedId - 1].buf = Buffer.from(
  `<< /Type /Pages /Kids [${allPageIds.map((id) => id + " 0 R").join(" ")}] /Count ${allPageIds.length} >>`,
);

const catalogId = addObject(Buffer.from(`<< /Type /Catalog /Pages ${pagesReservedId} 0 R >>`));

// write PDF
const outPath = path.join(root, "docs/Better-Urban-screen-deck.pdf");
const parts = [];
let pos = 0;
function writeStr(s) { const b = Buffer.from(s); parts.push(b); pos += b.length; }
function writeBuf(b) { parts.push(b); pos += b.length; }

writeStr("%PDF-1.4\n");
const offsets = new Array(objects.length + 1).fill(0);
for (const o of objects) {
  offsets[o.id] = pos;
  writeStr(`${o.id} 0 obj\n`);
  writeBuf(o.buf);
  writeStr("\nendobj\n");
}
const xrefPos = pos;
writeStr("xref\n");
writeStr(`0 ${objects.length + 1}\n`);
writeStr("0000000000 65535 f \n");
for (let i = 1; i <= objects.length; i++) {
  writeStr(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
}
writeStr("trailer\n");
writeStr(`<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`);
writeStr("startxref\n");
writeStr(`${xrefPos}\n`);
writeStr("%%EOF\n");

fs.writeFileSync(outPath, Buffer.concat(parts));
console.log("wrote", outPath, "pages:", totalPages, "objects:", objects.length, "bytes:", fs.statSync(outPath).size);
fs.writeFileSync(path.join(root, "docs/screens/deck-manifest.txt"), entries.map((e) => `${e.name}.jpeg  ${e.title}  ${e.route}`).join("\n"));

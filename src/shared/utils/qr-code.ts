import QRCode from 'qrcode';

/**
 * Standards-Compliant ISO/IEC 18004 QR Code Utilities.
 * Powered by battle-tested `qrcode` engine for 100% reliable camera scanning.
 */

/**
 * Encodes text into an ISO/IEC 18004 standard 2D boolean matrix representing QR dark modules.
 */
export function generateQRMatrix(text: string): boolean[][] {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const count = qr.modules.size;
  const matrix: boolean[][] = [];

  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.modules.get(r, c) === 1);
    }
    matrix.push(row);
  }

  return matrix;
}

/**
 * Returns an ISO/IEC 18004 standard SVG representation of the QR code with a 4-module quiet zone.
 * Renders razor-sharp vector paths for instantaneous smartphone camera autofocus.
 */
export function generateQRSVG(text: string, sizePx = 256, color = '#1a1a1a'): string {
  const matrix = generateQRMatrix(text);
  const count = matrix.length;
  // ISO 18004 requires minimum 4-module quiet zone margin on all 4 sides
  const padding = 4;
  const totalUnits = count + padding * 2;
  const cellSize = sizePx / totalUnits;

  let pathD = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        // Merge horizontal contiguous runs of modules for minimal SVG footprint
        let endC = c;
        while (endC + 1 < count && matrix[r][endC + 1]) {
          endC++;
        }
        const runLen = endC - c + 1;
        const x = (c + padding) * cellSize;
        const y = (r + padding) * cellSize;
        const w = runLen * cellSize;
        pathD += `M${x.toFixed(2)},${y.toFixed(2)}h${w.toFixed(2)}v${cellSize.toFixed(2)}h-${w.toFixed(2)}z `;
        c = endC;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">
    <rect width="${sizePx}" height="${sizePx}" fill="#ffffff" />
    <path d="${pathD}" fill="${color}" />
  </svg>`;
}

/**
 * Generates a high-resolution PNG Data URL for downloading or printing.
 */
export async function generateQRDataURL(text: string, sizePx = 512): Promise<string> {
  return QRCode.toDataURL(text, {
    width: sizePx,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1c1917',
      light: '#ffffff',
    },
  });
}

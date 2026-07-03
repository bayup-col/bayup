import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

export async function GET() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Productos');

  ws.columns = [
    { header: 'nombre *', key: 'nombre', width: 32 },
    { header: 'precio *', key: 'precio', width: 16 },
    { header: 'descripcion', key: 'descripcion', width: 42 },
    { header: 'categoria', key: 'categoria', width: 22 },
    { header: 'sku', key: 'sku', width: 18 },
    { header: 'stock', key: 'stock', width: 12 },
  ];

  // Encabezado verde Bayup
  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004D4D' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF00BFC8' } } };
  });
  headerRow.height = 24;

  // Filas de ejemplo en gris itálico
  ws.addRow(['Camiseta Premium', 50000, 'Algodón 100%, talla M', 'Moda & Accesorios', 'CAM-001', 10]);
  ws.addRow(['Pantalón Slim', 89900, '', 'Moda & Accesorios', 'PAN-002', 5]);
  [ws.getRow(2), ws.getRow(3)].forEach(row => {
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FAFA' } };
      cell.font = { color: { argb: 'FF888888' }, italic: true, size: 10 };
    });
  });

  // Nota instructiva
  ws.addRow([]);
  const noteRow = ws.addRow(['👉 Borra las filas 2 y 3 (son ejemplos) y agrega tus productos desde la fila 2. Los campos con * son obligatorios.']);
  ws.mergeCells(`A5:F5`);
  noteRow.getCell(1).font = { color: { argb: 'FF555555' }, size: 9 };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-productos-bayup.xlsx"',
    },
  });
}

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ProductExportData {
    name: string;
    category: string;
    price: number;
    status: string;
    variants: any[];
}

export const exportProductsToExcel = async (products: ProductExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Catálogo de Productos');

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { header: 'PRODUCTO', key: 'name', width: 40 },
        { header: 'CATEGORÍA', key: 'category', width: 25 },
        { header: 'REFERENCIA (SKU)', key: 'sku', width: 20 },
        { header: 'STOCK TOTAL', key: 'stock', width: 15 },
        { header: 'PRECIO VENTA', key: 'price', width: 20 },
        { header: 'ESTADO', key: 'status', width: 15 },
    ];

    // 2. DISEÑO DEL ENCABEZADO (PLATINUM STYLE)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 40;
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'thick', color: { argb: '00F2FF' } } };
    });

    // 3. CARGA DE DATOS
    products.forEach((p, index) => {
        const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const row = worksheet.addRow({
            name: p.name.toUpperCase(),
            category: (p.category || 'GENERAL').toUpperCase(),
            sku: p.variants?.[0]?.sku || 'N/A',
            stock: totalStock,
            price: p.price,
            status: (p.status === 'active' ? 'ACTIVO' : 'BORRADOR')
        });

        row.height = 25;
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            if (colNumber === 5) cell.numFmt = '"$"#,##0';
            if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
        });
    });

    // 4. GENERACIÓN
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `CATALOGO_PRODUCTOS_${companyName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

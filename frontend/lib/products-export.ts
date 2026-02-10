import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ProductExportData {
    name: string;
    category?: string;
    cost?: number;
    wholesale_price?: number;
    price: number;
    status: string;
    variants: any[];
}

export const exportProductsToExcel = async (products: ProductExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Catálogo Maestro');

    // 1. CONFIGURACIÓN DE COLUMNAS PROFESIONALES
    worksheet.columns = [
        { header: 'PRODUCTO', key: 'name', width: 45 },
        { header: 'CATEGORÍA', key: 'category', width: 25 },
        { header: 'COSTO (INV)', key: 'cost', width: 18 },
        { header: 'PRECIO MAYORISTA', key: 'wholesale', width: 22 },
        { header: 'PRECIO FINAL', key: 'retail', width: 22 },
        { header: 'MARGEN %', key: 'margin', width: 12 },
        { header: 'STOCK TOTAL', key: 'stock', width: 15 },
        { header: 'ESTADO', key: 'status', width: 15 },
    ];

    // 2. DISEÑO DEL ENCABEZADO (ÉLITE)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } }; // Verde Bayup
        cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10, name: 'Segoe UI' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { 
            bottom: { style: 'medium', color: { argb: '00F2FF' } },
            right: { style: 'thin', color: { argb: 'FFFFFF' } }
        };
    });

    // 3. PROCESAMIENTO DE DATOS CON LÓGICA DE NEGOCIO
    products.forEach((p, index) => {
        const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const cost = p.cost || 0;
        const retail = p.price || 0;
        const wholesale = p.wholesale_price || 0;
        
        // Calcular margen aproximado (Retail vs Costo)
        const margin = retail > 0 ? (((retail - cost) / retail) * 100).toFixed(1) + '%' : '0%';

        const row = worksheet.addRow({
            name: p.name.toUpperCase(),
            category: (p.category || 'GENERAL').toUpperCase(),
            cost: cost,
            wholesale: wholesale,
            retail: retail,
            margin: margin,
            stock: totalStock,
            status: (p.status === 'active' ? 'ACTIVO' : 'BORRADOR')
        });

        // Diseño de la Fila
        row.height = 22;
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };
            
            // Colores alternos
            if (index % 2 !== 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
            }

            // Formatos de Moneda
            if ([3, 4, 5].includes(colNumber)) {
                cell.numFmt = '"$"#,##0';
                cell.font = { ...cell.font, bold: colNumber === 5 }; // Precio final en negrita
            }

            // Color del Estado
            if (colNumber === 8) {
                cell.font = { 
                    color: { argb: p.status === 'active' ? '059669' : '9CA3AF' },
                    bold: true,
                    size: 8
                };
            }
        });
    });

    // 4. GENERACIÓN Y DESCARGA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `AUDITORIA_CATALOGO_${companyName.toUpperCase().replace(/\s+/g, '_')}_${timestamp}.xlsx`);
};
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface OrderExportData {
    id: string;
    customer_name: string;
    total_price: number;
    status: string;
    source: string;
    created_at: string;
}

export const exportOrdersToExcel = async (orders: OrderExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Pedidos');

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { header: 'ID PEDIDO', key: 'id', width: 20 },
        { header: 'FECHA REGISTRO', key: 'date', width: 25 },
        { header: 'CLIENTE', key: 'customer', width: 35 },
        { header: 'CANAL DE VENTA', key: 'source', width: 20 },
        { header: 'ESTADO', key: 'status', width: 15 },
        { header: 'TOTAL VENTA', key: 'total', width: 25 },
    ];

    // 2. DISEÑO DEL ENCABEZADO (PLATINUM STYLE)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 40;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '004D4D' } // Petroleum Principal
        };
        cell.font = {
            color: { argb: 'FFFFFF' },
            bold: true,
            size: 11,
            name: 'Arial'
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            bottom: { style: 'thick', color: { argb: '00F2FF' } } // Borde Cian
        };
    });

    // 3. CARGA DE DATOS
    orders.forEach((o, index) => {
        const row = worksheet.addRow({
            id: o.id.slice(0, 8).toUpperCase(),
            date: new Date(o.created_at).toLocaleString('es-CO'),
            customer: o.customer_name.toUpperCase(),
            source: (o.source || 'TIENDA').toUpperCase(),
            status: o.status.toUpperCase(),
            total: o.total_price
        });

        row.height = 25;
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Estilo de celdas de datos
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            
            // Columna de Dinero
            if (colNumber === 6) {
                cell.numFmt = '"$"#,##0';
                cell.font = { bold: true, color: { argb: '004D4D' } };
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }

            // Filas Alternas para legibilidad
            if (index % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FAFAFA' }
                };
            }
        });
    });

    // 4. GENERACIÓN Y DESCARGA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `HISTORIAL_PEDIDOS_${companyName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

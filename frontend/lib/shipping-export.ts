import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ShipmentExportData {
    id: string;
    tracking_number: string;
    carrier: string;
    status: string;
    customer: { name: string; city: string };
}

export const exportShipmentsToExcel = async (shipments: ShipmentExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Logística de Envíos');

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { header: 'ID ENVÍO', key: 'id', width: 20 },
        { header: 'NÚMERO DE GUÍA', key: 'tracking', width: 25 },
        { header: 'TRANSPORTADORA', key: 'carrier', width: 20 },
        { header: 'DESTINATARIO', key: 'customer', width: 35 },
        { header: 'CIUDAD DESTINO', key: 'city', width: 20 },
        { header: 'ESTADO ACTUAL', key: 'status', width: 20 },
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
    shipments.forEach((shp, index) => {
        const row = worksheet.addRow({
            id: shp.id.toUpperCase(),
            tracking: shp.tracking_number,
            carrier: shp.carrier.toUpperCase(),
            customer: shp.customer.name.toUpperCase(),
            city: shp.customer.city.toUpperCase(),
            status: shp.status.toUpperCase().replace('_', ' ')
        });

        row.height = 25;
        row.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10 };
            if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
        });
    });

    // 4. GENERACIÓN
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `LOGISTICA_ENVIOS_${companyName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

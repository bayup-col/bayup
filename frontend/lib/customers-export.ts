import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface CustomerExportData {
    full_name: string;
    email: string;
    phone: string | null;
    city: string | null;
    customer_type: string;
    acquisition_channel: string;
    total_spent: number;
    status: string;
}

export const exportCustomersToExcel = async (customers: CustomerExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Base de Datos Clientes');

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { header: 'NOMBRE COMPLETO', key: 'name', width: 35 },
        { header: 'CORREO ELECTRÓNICO', key: 'email', width: 35 },
        { header: 'WHATSAPP / TEL', key: 'phone', width: 20 },
        { header: 'UBICACIÓN', key: 'city', width: 20 },
        { header: 'TIPO DE CLIENTE', key: 'type', width: 20 },
        { header: 'CANAL ORIGEN', key: 'channel', width: 20 },
        { header: 'TOTAL INVERTIDO', key: 'spent', width: 25 },
        { header: 'ESTADO CUENTA', key: 'status', width: 15 },
    ];

    // 2. DISEÑO DEL ENCABEZADO (PLATINUM STYLE)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 45;
    
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
            bottom: { style: 'thick', color: { argb: '00F2FF' } } // Borde Cian Singularidad
        };
    });

    // 3. CARGA DE DATOS
    customers.forEach((c, index) => {
        const row = worksheet.addRow({
            name: c.full_name.toUpperCase(),
            email: c.email.toLowerCase(),
            phone: c.phone || 'N/A',
            city: (c.city || 'NO REGISTRADA').toUpperCase(),
            type: c.customer_type === 'mayorista' ? 'MAYORISTA' : 'USUARIO FINAL',
            channel: (c.acquisition_channel || 'DIRECTO').toUpperCase(),
            spent: c.total_spent,
            status: c.status.toUpperCase()
        });

        row.height = 30;
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Estilo de celdas de datos
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'F3F4F6' } }
            };
            
            // Columna de Dinero
            if (colNumber === 7) {
                cell.numFmt = '"$"#,##0';
                cell.font = { bold: true, color: { argb: '004D4D' } };
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
    saveAs(blob, `BASEDATOS_CLIENTES_${companyName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

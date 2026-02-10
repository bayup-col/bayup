import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface InvoiceExportData {
    id: string;
    customer_name: string;
    customer_email: string;
    total: number;
    payment_method: string;
    created_at: string;
}

export const exportInvoicesToExcel = async (invoices: InvoiceExportData[], companyName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoría de Facturación');

    worksheet.columns = [
        { header: 'ID TRANSACCIÓN', key: 'id', width: 25 },
        { header: 'FECHA', key: 'date', width: 20 },
        { header: 'CLIENTE', key: 'customer', width: 35 },
        { header: 'MÉTODO PAGO', key: 'method', width: 20 },
        { header: 'TOTAL VENTA', key: 'total', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 40;
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'thick', color: { argb: '00F2FF' } } };
    });

    invoices.forEach((inv, index) => {
        const row = worksheet.addRow({
            id: inv.id.toUpperCase(),
            date: new Date(inv.created_at).toLocaleString('es-CO'),
            customer: inv.customer_name.toUpperCase(),
            method: inv.payment_method.toUpperCase(),
            total: inv.total
        });

        row.height = 25;
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            if (colNumber === 5) cell.numFmt = '"$"#,##0';
            if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `AUDITORIA_FACTURACION_${companyName.toUpperCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

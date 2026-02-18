/**
 * Export Utility Functions
 * Requires jsPDF, autoTable, and XLSX libraries loaded in HTML
 */

export function exportToPDF(title, filename, columns, data) {
    if (!window.jspdf) {
        console.error('jsPDF library not loaded');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Add title
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(title, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    const dateStr = new Date().toLocaleString('id-ID');
    doc.text(`Generated on: ${dateStr}`, 14, 22);

    // Prepare table data
    const headers = [columns.map(col => col.header)];
    const rows = data.map(item => columns.map(col => {
        let val = item[col.dataKey];
        // Format if it's a number and has a formatter
        if (col.formatter && typeof col.formatter === 'function') {
            return col.formatter(val);
        }
        return val;
    }));

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 28,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // Blue-500
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: columns.reduce((acc, col, idx) => {
            if (col.align) acc[idx] = { halign: col.align };
            return acc;
        }, {}),
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        }
    });

    doc.save(`${filename}.pdf`);
}

export function exportToExcel(filename, sheetName, columns, data) {
    if (!window.XLSX) {
        console.error('SheetJS library not loaded');
        return;
    }
    const XLSX = window.XLSX;

    // Map data to use headers as keys for better excel appearance
    const excelData = data.map(item => {
        const row = {};
        columns.forEach(col => {
            let val = item[col.dataKey];
            if (col.formatter && typeof col.formatter === 'function') {
                row[col.header] = col.formatter(val);
            } else {
                row[col.header] = val;
            }
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

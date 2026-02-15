const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../Declaración de renta 2024 - Camilo Piedrahita-2');
const files = [
    { name: 'Información Exógena - Nuevo Reporte 11_08.xlsx', sheet: 'Reporte', range: {s: 5, e: 20} },
    { name: 'Soportes Declaracion-1.xlsx', sheet: 'Consolidado', range: {s: 0, e: 20} }
];

function analyzeFile(fileConfig) {
    const filePath = path.join(baseDir, fileConfig.name);
    if (!fs.existsSync(filePath)) {
        console.log(`[!] Archivo no encontrado: ${fileConfig.name}`);
        return;
    }

    console.log(`\n=== Analizando: ${fileConfig.name} [${fileConfig.sheet}] ===`);
    try {
        const workbook = XLSX.readFile(filePath);
        if (!workbook.SheetNames.includes(fileConfig.sheet)) {
            console.log(`Hoja '${fileConfig.sheet}' no encontrada. Hojas disponibles: ${workbook.SheetNames.join(', ')}`);
            return;
        }

        const worksheet = workbook.Sheets[fileConfig.sheet];
        // Obtener rango específico
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Imprimir filas del rango solicitado
        const start = fileConfig.range.s;
        const end = Math.min(fileConfig.range.e, jsonData.length);
        
        for (let i = start; i < end; i++) {
            console.log(`Fila ${i + 1}:`, JSON.stringify(jsonData[i]));
        }

    } catch (error) {
        console.error(`Error leyendo ${fileConfig.name}:`, error.message);
    }
}

files.forEach(file => analyzeFile(file));

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(
  __dirname,
  "../Declaración de renta 2024 - Camilo Piedrahita-2",
);
const files = [
  "Soportes Declaracion-1.xlsx",
  "Información Exógena 2024.xlsx",
  "Información Exógena - Nuevo Reporte 11_08.xlsx",
];

function analyzeFile(filename) {
  const filePath = path.join(baseDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`[!] Archivo no encontrado: ${filename}`);
    return;
  }

  console.log(`\n=== Analizando: ${filename} ===`);
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`Hojas encontradas: ${workbook.SheetNames.join(", ")}`);

    workbook.SheetNames.slice(0, 5).forEach((sheetName) => {
      // Analizar primeras 5 hojas
      console.log(`\n--- Hoja: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array de arrays

      if (jsonData.length > 0) {
        console.log("Cabeceras:", jsonData[0]);
        console.log("Ejemplo fila 1:", jsonData[1] || "(vacía)");
        console.log("Ejemplo fila 2:", jsonData[2] || "(vacía)");
      } else {
        console.log("(Hoja vacía)");
      }
    });
  } catch (error) {
    console.error(`Error leyendo ${filename}:`, error.message);
  }
}

files.forEach((file) => analyzeFile(file));

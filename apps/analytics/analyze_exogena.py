import pandas as pd
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Declaración de renta 2024 - Camilo Piedrahita-2'))
FILE_PATH = os.path.join(BASE_DIR, 'Información Exógena - Nuevo Reporte 11_08.xlsx')

def analyze_exogena():
    if not os.path.exists(FILE_PATH):
        print(f"[!] Archivo no encontrado: {FILE_PATH}")
        return

    print(f"Analizando: {FILE_PATH} (Hoja: Reporte)")
    try:
        # Leer hoja Reporte sin encabezados
        df = pd.read_excel(FILE_PATH, sheet_name='Reporte', header=None)
        
        # Buscar la fila de encabezados. En el output anterior parecia ser la fila 14 (idx 13)
        # "NIT","Nombre / Razón Social","NIT","Nombre/Razón Social reportada por el tercero"...
        
        header_row_idx = 13
        headers = df.iloc[header_row_idx]
        print(f"\nPosibles Encabezados (Fila {header_row_idx+1}):")
        print(headers.tolist())
        
        print("\n--- Primeras 3 filas de datos ---")
        print(df.iloc[header_row_idx+1:header_row_idx+4].to_string())

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_exogena()

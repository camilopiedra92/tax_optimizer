import pandas as pd
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Declaración de renta 2024 - Camilo Piedrahita-2'))

FILES = {
    'Soportes': 'Soportes Declaracion-1.xlsx',
    'Exogena': 'Información Exógena - Nuevo Reporte 11_08.xlsx'
}

def analyze_file(name, filename):
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f"[!] Archivo no encontrado: {filename}")
        return

    print(f"\n{'='*10} Analizando: {name} ({filename}) {'='*10}")
    try:
        xl = pd.ExcelFile(filepath)
        print(f"Hojas encontradas: {xl.sheet_names}")
        
        # Analizar 'Soportes' -> 'Consolidado'
        if name == 'Soportes' and 'Consolidado' in xl.sheet_names:
            print(f"\n--- Hoja: Consolidado ---")
            df = pd.read_excel(filepath, sheet_name='Consolidado', header=None)
            
            # Buscar fila de encabezados reales (fila 6 en 0-index -> index 5)
            # Imprimir filas clave para identificar estructura
            print("Filas 5 a 20 (Índice Pandas 4-19):")
            print(df.iloc[4:20].to_string())

        # Analizar 'Exogena' -> 'Reporte'
        if name == 'Exogena' and 'Reporte' in xl.sheet_names:
            print(f"\n--- Hoja: Reporte ---")
            df = pd.read_excel(filepath, sheet_name='Reporte', header=None)
            
            # Buscar donde empiezan los datos (aprox fila 13 excel -> index 12)
            print("Filas 10 a 20 (Índice Pandas 9-19):")
            print(df.iloc[9:20].to_string())

    except Exception as e:
        print(f"Error analizando {name}: {e}")

if __name__ == "__main__":
    for name, filename in FILES.items():
        analyze_file(name, filename)

import pandas as pd
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Declaración de renta 2024 - Camilo Piedrahita-2'))
FILE_PATH = os.path.join(BASE_DIR, 'Soportes Declaracion-1.xlsx')

def analyze_consolidado():
    if not os.path.exists(FILE_PATH):
        print(f"[!] Archivo no encontrado: {FILE_PATH}")
        return

    print(f"Analizando: {FILE_PATH} (Hoja: Consolidado)")
    try:
        # Leer hoja Consolidado sin encabezados automáticos
        df = pd.read_excel(FILE_PATH, sheet_name='Consolidado', header=None)
        
        # Las filas de interés parecen estar entre la 6 y la 20 (índices 5-19)
        # La fila 5 contiene los encabezados reales de las columnas de datos
        # La columna 1 contiene las etiquetas de las filas (ej. "Ingresos Brutos")
        
        # Extraer sub-dataframe
        sub_df = df.iloc[5:21, :] # Desde fila 6 hasta 21
        
        print("\n--- Estructura Detectada (Primeras 5 col) ---")
        print(sub_df.iloc[:, :5].to_string())
        
        # Intentar mapear datos clave
        # Fila 7 (idx 6) = Ingresos Brutos
        # Col 3 (idx 3) = Rentas de trabajo
        try:
            ingresos_brutos_trabajo = df.iloc[6, 3]
            print(f"\n[DATO] Ingresos Brutos (Rentas de trabajo): {ingresos_brutos_trabajo}")
        except:
            print("[!] No se pudo extraer Ingresos Brutos Trabajo")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_consolidado()

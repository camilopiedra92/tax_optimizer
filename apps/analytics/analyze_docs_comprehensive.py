import os
import json
from pypdf import PdfReader
import pandas as pd

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Declaración de renta 2024 - Camilo Piedrahita-2'))

KEYWORDS = {
    'Ingresos Laborales (220)': ['Certificado de Ingresos y Retenciones', 'Formulario 220', 'Salarios y Pagos Laborales'],
    'Cuentas Bancarias / GMF': ['Gravamen a los Movimientos Financieros', 'GMF', '4x1000', 'Certificado Tributario', 'Saldo a 31 de diciembre', 'Rendimientos Pagados'],
    'Pensiones y Cesantías': ['Fondo de Pensiones', 'Cesantías', 'Porvenir', 'Protección', 'Colfondos', 'Skandia'],
    'Salud / Prepagada': ['Medicina Prepagada', 'Plan Complementario', 'Pagos por Salud', 'Certificado de Pagos'],
    'Vivienda': ['Intereses de Vivienda', 'Crédito Hipotecario', 'Leasing Habitacional'],
    'Dividendos': ['Certificado de Dividendos', 'Participación Accionaria'],
    'Impuestos Pagados': ['Retención en la fuente', 'Impuesto de Industria y Comercio', 'ICA'],
    'Información Exógena': ['Información reportada por terceros', 'Exógena']
}

def extract_text_from_pdf(filepath):
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages[:2]: # Leer solo las primeras 2 páginas para eficiencia
            text += page.extract_text() or ""
        return text
    except Exception as e:
        return ""

def classify_document(text, filename):
    found_categories = []
    text_lower = text.lower()
    filename_lower = filename.lower()
    
    for category, keywords in KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in text_lower or keyword.lower() in filename_lower:
                found_categories.append(category)
                break # Solo una vez por categoría
    
    return found_categories

def analyze_directory(directory):
    results = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.startswith('.') or file.startswith('~'): continue
            
            filepath = os.path.join(root, file)
            relpath = os.path.relpath(filepath, directory)
            ext = os.path.splitext(file)[1].lower()
            
            doc_info = {
                'path': relpath,
                'type': ext,
                'categories': [],
                'status': 'Unclassified'
            }

            if ext == '.pdf':
                text = extract_text_from_pdf(filepath)
                doc_info['categories'] = classify_document(text, file)
            elif ext in ['.xlsx', '.xls']:
                # Solo clasificar por nombre para Excel por ahora, ya tenemos scripts profundos
                doc_info['categories'] = classify_document("", file)
                if 'Declaracion' in file or 'Exogena' in file:
                     doc_info['categories'].append('Soporte Maestro')

            if doc_info['categories']:
                doc_info['status'] = 'Relevant'
            
            results.append(doc_info)
            
    return results

if __name__ == "__main__":
    print(f"Analizando directorio: {BASE_DIR}")
    analysis = analyze_directory(BASE_DIR)
    
    # Agrupar por categoría
    grouped = {}
    for item in analysis:
        if not item['categories']:
            cat = 'Sin Clasificar'
            if cat not in grouped: grouped[cat] = []
            grouped[cat].append(item['path'])
            continue
            
        for cat in item['categories']:
            if cat not in grouped: grouped[cat] = []
            grouped[cat].append(item['path'])

    print(json.dumps(grouped, indent=2, ensure_ascii=False))

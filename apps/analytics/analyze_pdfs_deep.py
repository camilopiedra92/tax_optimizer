"""
Análisis profundo de todos los PDFs para determinar:
1. Si el texto es extraíble (vs escaneado/imagen)
2. Qué palabras clave contienen para clasificación automática
3. Qué valores numéricos se pueden extraer con regex
"""
import os
import json
import re
from pypdf import PdfReader

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Declaración de renta 2024 - Camilo Piedrahita-2'))

def extract_pdf_info(filepath):
    """Extrae texto y metadatos de un PDF."""
    try:
        reader = PdfReader(filepath)
        pages_text = []
        for i, page in enumerate(reader.pages[:3]):  # Max 3 páginas
            text = page.extract_text() or ""
            pages_text.append(text)
        
        full_text = "\n".join(pages_text)
        
        # Extraer valores monetarios (patrones colombianos: $1.234.567 o 1,234,567.00)
        money_pattern = r'\$?\s*[\d.,]+(?:\.\d{2})?'
        money_values = re.findall(money_pattern, full_text)
        
        return {
            'extractable': len(full_text.strip()) > 50,
            'char_count': len(full_text),
            'first_500_chars': full_text[:500],
            'money_values_count': len(money_values),
            'pages': len(reader.pages)
        }
    except Exception as e:
        return {'extractable': False, 'error': str(e)}

def scan_all_pdfs():
    results = {}
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.lower().endswith('.pdf') and not f.startswith('.'):
                filepath = os.path.join(root, f)
                relpath = os.path.relpath(filepath, BASE_DIR)
                info = extract_pdf_info(filepath)
                results[relpath] = info
                
                status = "✅ EXTRACTABLE" if info.get('extractable') else "❌ NOT EXTRACTABLE"
                print(f"\n{'='*60}")
                print(f"{status} | {relpath}")
                print(f"  Chars: {info.get('char_count', 0)} | Pages: {info.get('pages', '?')} | Money values: {info.get('money_values_count', 0)}")
                if info.get('extractable'):
                    # Print first 300 chars for context
                    preview = info['first_500_chars'][:300].replace('\n', ' | ')
                    print(f"  Preview: {preview[:200]}...")
                    
    return results

if __name__ == "__main__":
    results = scan_all_pdfs()
    
    extractable = sum(1 for r in results.values() if r.get('extractable'))
    total = len(results)
    print(f"\n\n{'='*60}")
    print(f"RESUMEN: {extractable}/{total} PDFs son extraíbles automáticamente")

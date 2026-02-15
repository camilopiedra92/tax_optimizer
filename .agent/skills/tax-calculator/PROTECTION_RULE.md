---
name: Tax Engine Protection Rule
description: The Tax Engine (lib/tax-engine/) is READ-ONLY by default. No modifications allowed without explicit user request.
---

# ⚠️ Tax Engine Protection — READ-ONLY BY DEFAULT

## Rule

**DO NOT** modify any file under `lib/tax-engine/` unless the user **explicitly requests** it.

This applies to ALL files in the directory tree:

- `lib/tax-engine/rules.ts`
- `lib/tax-engine/types.ts`
- `lib/tax-engine/calculators/*.ts`
- Any other file within `lib/tax-engine/`

## What Counts as "Explicit"

| ✅ Explicit (OK to modify)                   | ❌ NOT explicit (ask first)        |
| -------------------------------------------- | ---------------------------------- |
| "Cambia el UVT en rules.ts"                  | "Arregla los bugs del proyecto"    |
| "Agrega un nuevo calculador de dividendos"   | "Refactoriza el código"            |
| "Actualiza la tabla progresiva del Art. 241" | "Mejora el rendimiento"            |
| "Modifica el cálculo de la renta líquida"    | "Haz que todo compile sin errores" |

## If Unsure

If a task seems to require Tax Engine changes but the user has not explicitly authorized it:

1. **Stop** before making changes
2. **Ask** the user for explicit permission
3. **Explain** what changes would be needed and why

## Rationale

The Tax Engine implements legally-mandated Colombian tax law (Estatuto Tributario, Decretos, Leyes). Any incorrect change can cause tax compliance violations with real legal and financial consequences for the user.

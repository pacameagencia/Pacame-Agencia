# Setup del Hook VISUAL-FIRST (Claude Code)

> **Estado**: REGLA DE CONFIGURACIÓN — replicar manualmente en cada máquina/worktree donde se trabaje el proyecto PACAME.
> **Última revisión**: 2026-04-28.
> **Por qué no se commitea automáticamente**: el hook vive en `.claude/settings.json`, archivo gitignored porque contiene tokens y permisos personales. Cada máquina lo configura una vez.

---

## Objetivo

Recordar al operador (humano o agente) el protocolo VISUAL-FIRST de PACAME (`CLAUDE.md`) cada vez que se intenta editar un archivo visual (`.tsx`, `.jsx`, `.css`, `.svg`).

El hook **NO bloquea** la edición — solo imprime un recordatorio. La regla cultural se mantiene; el hook es señalización.

## Contenido a añadir a `.claude/settings.json`

Si el archivo ya existe, **fusionar** la sección `hooks` sin tocar `permissions.allow` (tu allowlist personal y posibles tokens viven ahí):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "grep -qE '\"file_path\":\"[^\"]*\\.(tsx|jsx|css|svg)\"' && echo '⚠️ VISUAL-FIRST · PACAME · Estás editando un archivo visual. ¿Has invocado /pedir o las skills frontend-design / imagen (Gemini) / theme-factory antes? Si NO → para, invócalas y vuelve. Si SÍ → continúa. Protocolo completo en CLAUDE.md.' || true",
            "shell": "bash",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

## Cómo se ha verificado

El comando se ha probado en pipe-test antes de instalarse:

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"web/app/page.tsx"}}' \
  | grep -qE '"file_path":"[^"]*\.(tsx|jsx|css|svg)"' \
  && echo "⚠️ VISUAL-FIRST hit" || echo "no match"
# → ⚠️ VISUAL-FIRST hit (correcto)

echo '{"tool_name":"Edit","tool_input":{"file_path":"web/lib/api.ts"}}' \
  | grep -qE '"file_path":"[^"]*\.(tsx|jsx|css|svg)"' \
  && echo "⚠️ VISUAL-FIRST hit" || echo "no match"
# → no match (correcto, .ts no es visual)
```

Funciona también con paths Windows (`C:\\Users\\...\\Hero.tsx`) y matchea Write / Edit / MultiEdit por igual.

## Comportamiento esperado

Cada vez que se invoca Write/Edit/MultiEdit:

- **Sobre archivo visual** (`.tsx`, `.jsx`, `.css`, `.svg`): aparece línea de recordatorio en el sistema-message del agente.
- **Sobre cualquier otro archivo**: silencio absoluto, no interfiere.
- **Si grep no está** o el comando falla por cualquier razón: `|| true` evita que rompa el flow.

## Cómo desactivarlo temporalmente

Si necesitas pausar el hook (por ejemplo, edición masiva donde el ruido molesta):

1. Editar `.claude/settings.json`.
2. Comentar (en JSON no hay comentarios, así que renombra) la clave `hooks` a `_hooks` para deshabilitar.
3. Restaurar al terminar.

Alternativa: usar el menú `/hooks` de Claude Code.

## Nota sobre Windows

El comando usa `grep -qE`. En Windows estándar `grep` no existe. Pero **Claude Code en Windows usa Git Bash o WSL bajo el capó** (donde `grep` sí está). El campo `"shell": "bash"` fuerza ese intérprete. Confirmado funcional en la máquina del autor (`bash` desde Git for Windows).

Si en otra máquina Windows el hook no dispara, comprobar:
- Que Git Bash está instalado (`git --version`).
- Que `grep` responde desde una shell Bash.
- Que el matcher `Write|Edit|MultiEdit` corresponde a los nombres de tools en uso (no se llama `Editar` ni similar).

---

**Owner**: PACAME Agencia.
**Re-aplicar**: tras `git clone` fresco o nuevo worktree. Una vez por máquina.

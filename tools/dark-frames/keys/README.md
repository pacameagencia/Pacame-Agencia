# Visual Reviewer Signing Keys

Sistema de firma criptográfica Ed25519 para approvals del visual-reviewer subagent.

**Por qué existe**: el campo `meta.json::visual_reviewer_status='approved'` era editable a mano. Cualquiera podía bypass el visual review escribiendo "approved" en el JSON. El gate confiaba ciegamente. Para celebrity content esto es inaceptable.

**Solución**: cuando el visual-reviewer subagent aprueba, ejecuta `tools/dark-frames/sign-approval.mjs <folder>` que:
1. Calcula SHA-256 del `reel.mp4`.
2. Firma el hash con la clave privada Ed25519 (`PACAME_VISUAL_REVIEWER_PRIVATE_KEY` en `.env.local`).
3. Escribe `meta.visual_reviewer_signature = <base64-sig>` + `meta.visual_reviewer_mp4_sha256 = <hex>` en meta.json.

`enqueue-reel.mjs` (CHECK 4 visual_reviewer_approved) verifica:
1. `meta.visual_reviewer_status === 'approved'`
2. SHA-256 actual del MP4 coincide con `meta.visual_reviewer_mp4_sha256` (no se editó tras aprobación).
3. Firma `meta.visual_reviewer_signature` válida sobre el hash, verificada con `visual-reviewer.pub.pem`.

Si CUALQUIERA falla → bloquea con razón específica.

## Archivos

- `visual-reviewer.pub.pem` — clave pública Ed25519 (versionada en repo, sirve para verificar firmas).
- `visual-reviewer.priv.pem` — NO existe en repo. La clave privada vive en `web/.env.local` como `PACAME_VISUAL_REVIEWER_PRIVATE_KEY`.

## Rotación de claves

Si la clave privada se compromete:
1. Generar nuevo par: `node -e "const {generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('ed25519');console.log(privateKey.export({type:'pkcs8',format:'pem'}));console.log(publicKey.export({type:'spki',format:'pem'}))"`.
2. Actualizar `PACAME_VISUAL_REVIEWER_PRIVATE_KEY` en `.env.local`.
3. Reemplazar `visual-reviewer.pub.pem` con la nueva pública.
4. **TODOS los meta.json firmados con la clave vieja se invalidan**. Re-renderizar las piezas pendientes de publicar o re-firmar manualmente con la nueva clave.

## Por qué Ed25519

- Más rápido que RSA-2048 (firmar + verificar).
- Claves más cortas (32 bytes vs 256 bytes).
- Estándar moderno (RFC 8032, soportado nativo en Node.js crypto desde v12).
- Determinístico (misma entrada → misma firma, útil para auditoría).

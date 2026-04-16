# Gemma 4 — Guia tecnica para PACAME

> Ultima actualizacion oficial: 2026-04-02
> Fuente: https://ai.google.dev/gemma/docs/core
> Descargado y consolidado por Claude Code el 2026-04-16

---

## 1. Que es Gemma 4

Familia de modelos generativos open weights de Google DeepMind con **uso comercial responsable permitido**. Pensados para desplegar en infra propia, fine-tunear y combinar con Gemini/Claude.

**Lanzamiento Gemma 4**: Texto + audio + imagen + video como entrada; hasta **256K de contexto**.

### Tres arquitecturas (elige segun hardware)

| Arquitectura | Modelo | Caso de uso |
|--------------|--------|-------------|
| **Small** | E2B / E4B (2B y 4B parametros efectivos) | Edge, movil, Pixel, Chrome, on-device |
| **Dense** | 31B | Server-grade local, bridge entre laptop y datacenter |
| **Mixture-of-Experts** | 26B A4B (activa 4B por token de 26B totales) | Alto throughput, razonamiento avanzado |

---

## 2. Requisitos de memoria para inferencia

| Modelo | BF16 (16-bit) | SFP8 (8-bit) | Q4_0 (4-bit) |
|--------|--------------:|-------------:|-------------:|
| E2B | 9.6 GB | 4.6 GB | **3.2 GB** |
| E4B | 15 GB | 7.5 GB | 5 GB |
| 31B | 58.3 GB | 30.4 GB | 17.4 GB |
| 26B A4B (MoE) | 48 GB | 25 GB | 15.6 GB |

**Notas clave:**
- **E** = "effective" parameters. Los modelos pequenos usan Per-Layer Embeddings (PLE) para eficiencia on-device.
- MoE 26B: aunque solo activa 4B por token, hay que cargar los 26B en memoria.
- Estas cifras son **solo pesos estaticos**. Suma VRAM para el KV cache (context window) y el framework.
- Fine-tuning requiere drasticamente mas memoria. Usa **LoRA/PEFT** para entrenar con poca VRAM.

---

## 3. Capacidades que nos interesan en PACAME

1. **Razonamiento configurable** (modos de thinking explicitos).
2. **Multimodal nativo**: texto, imagen (aspect ratio variable), video, audio (E2B y E4B lo llevan nativo).
3. **Context window**: 128K en small, 256K en medium — suficiente para auditorias web completas, SOPs, codebases enteras.
4. **Coding & agentic**: function calling nativo, agentes autonomos, mejora notable en benchmarks de codigo.
5. **Native System Prompt**: soporte nativo para `system` role (antes solo turnos user/assistant).

### Donde encaja en PACAME

| Agente PACAME | Uso de Gemma 4 sugerido |
|---------------|-------------------------|
| **ATLAS (SEO)** | E4B on-device para clasificar keywords / generar meta descriptions por lotes sin gastar Claude |
| **COPY** | 31B fine-tuneado con el tono de cada cliente → copy en masa barato |
| **NEXUS (Ads)** | MoE 26B A4B para generar 100+ variantes de ads + optimizacion |
| **PIXEL / PULSE** | E2B embebido en widgets web/movil para chat de clientes (sin latencia API) |
| **LENS (Analytics)** | 31B leer 256K tokens de datos brutos y sacar insights |
| **Voice server** | E4B para STT/TTS local — reemplaza parte del stack Vapi/ElevenLabs en cliente premium |

---

## 4. Donde descargar

- **Kaggle**: https://www.kaggle.com/models/google/gemma-4
- **Hugging Face**: https://huggingface.co/collections/google/gemma-4
- **Ollama** (GGUF quantizado, mas facil): `ollama pull gemma4:4b` / `gemma4:31b`
- **Vertex AI** (Google Cloud managed)

Version anteriores siguen disponibles (Gemma 3, Gemma 3n, Gemma 2, Gemma 1) para proyectos legacy.

---

## 5. Setup rapido con Ollama (recomendado para VPS Hetzner)

```bash
# 1. Instalar Ollama en el VPS (200.234.238.94)
curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar el modelo (elige segun RAM/VRAM del VPS)
ollama pull gemma4:4b        # ~5 GB, funciona en CPU decente
ollama pull gemma4:31b       # requiere GPU o VPS grande

# 3. Probar
ollama run gemma4:4b "Resume este SOP de PACAME en 3 bullets: ..."

# 4. Usar como API (compatible OpenAI)
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4:4b",
    "messages": [{"role": "system", "content": "Eres ATLAS, experto SEO de PACAME."},
                 {"role": "user", "content": "Haz auditoria de pacameagencia.com"}]
  }'
```

**Por que Ollama**: drop-in replacement de OpenAI API. Cambiar de Claude → Gemma local solo cambia la URL y el modelo. Ahorro estimado en llamadas masivas: **90%+**.

---

## 6. Integracion via Hugging Face (Python)

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Carga en 4-bit para minimizar VRAM
tokenizer = AutoTokenizer.from_pretrained("google/gemma-4-4b-it")
model = AutoModelForCausalLM.from_pretrained(
    "google/gemma-4-4b-it",
    torch_dtype=torch.bfloat16,
    device_map="auto",
    load_in_4bit=True
)

# Inferencia con system prompt (NUEVO en Gemma 4)
messages = [
    {"role": "system", "content": "Eres NOVA, experto en branding de PACAME."},
    {"role": "user", "content": "Crea 5 nombres para una pasteleria artesanal"}
]
inputs = tokenizer.apply_chat_template(messages, return_tensors="pt").to(model.device)
out = model.generate(inputs, max_new_tokens=512)
print(tokenizer.decode(out[0]))
```

**Requisitos**:
- `pip install transformers accelerate bitsandbytes torch`
- Token de Hugging Face con acceso al modelo (aceptar licencia en HF)

---

## 7. Despliegue en Vertex AI (Google Cloud)

Casos de uso: clientes que ya viven en GCP, SLAs empresariales, escala impredecible.

1. Vertex AI → Model Garden → "Gemma 4"
2. Click **Deploy on Vertex AI** → elegir region y GPU (A100 / L4 / H100)
3. Endpoint expuesto como REST con autenticacion IAM
4. Pago por hora de GPU, no por token

Para PACAME solo tiene sentido en clientes enterprise. Caso general: **Ollama local** o **Hugging Face Inference API**.

---

## 8. Fine-tuning con LoRA (el camino que nos interesa)

LoRA congela el modelo base y solo entrena unos MB de pesos adicionales. Resultado: puedes tener **un Gemma 4 fine-tuneado por cliente** sin almacenar GBs por cliente (aislamiento de datos garantizado).

### Keras (mas simple)

```python
import os
os.environ["KERAS_BACKEND"] = "jax"  # o "torch" / "tensorflow"
os.environ["XLA_PYTHON_CLIENT_MEM_FRACTION"] = "1.00"

import keras
import keras_hub

# Cargar modelo preset
gemma_lm = keras_hub.models.Gemma3CausalLM.from_preset("gemma3_instruct_1b")
# Para Gemma 4: usar el preset cuando este disponible en KerasHub

# Activar LoRA con rank=4 (poca VRAM)
gemma_lm.backbone.enable_lora(rank=4)
gemma_lm.summary()

# Entrenar con dataset del cliente
gemma_lm.preprocessor.sequence_length = 512
optimizer = keras.optimizers.AdamW(learning_rate=5e-5, weight_decay=0.01)
gemma_lm.compile(
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    optimizer=optimizer,
    weighted_metrics=[keras.metrics.SparseCategoricalAccuracy()]
)
gemma_lm.fit(dataset_cliente, epochs=1, batch_size=1)

# Guardar solo los pesos LoRA (unos MB)
gemma_lm.backbone.save_lora_weights("cliente_xyz_lora.weights.h5")
```

### Alternativa: PEFT + Transformers

```bash
pip install peft transformers trl bitsandbytes
```

```python
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

lora_config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],
    task_type="CAUSAL_LM"
)
model = get_peft_model(base_model, lora_config)
trainer = SFTTrainer(model=model, train_dataset=ds, args=training_args)
trainer.train()
```

### Reglas PACAME para fine-tuning con datos de cliente

1. **NUNCA subir datos de cliente a Kaggle/HF publico**.
2. Entrenar **siempre en VPS propio** o Vertex AI privado.
3. Guardar solo los pesos LoRA (pocos MB), nunca el modelo completo.
4. Borrar dataset de entrenamiento tras el fine-tune (GDPR).
5. Metadata en Supabase: `client_id`, `lora_weights_path`, `fecha`, `metricas`.

---

## 9. Licencia y uso comercial

- Licencia: **Gemma Terms of Use** (similar a Apache 2.0 con responsible use).
- **Uso comercial permitido** tras aceptar los terminos en Kaggle/HF.
- Puedes redistribuir tu fine-tune pero con la licencia Gemma y una nota de que esta basado en Gemma.
- Lee la **Prohibited Use Policy** antes de productivizar para clientes (medico, legal, etc. tienen restricciones especificas).

---

## 10. Proximos pasos para PACAME

**Semana 1 — POC**
1. Instalar Ollama en VPS Hetzner.
2. Descargar `gemma4:4b` y probar con 3 prompts reales de ATLAS (SEO) y COPY.
3. Medir latencia vs Claude Haiku y coste por 1M tokens.

**Semana 2 — Integracion**
4. Crear endpoint `voice-server`/`gemma-server` en VPS con Ollama como backend.
5. Anadir router en `web/lib/llm.ts` que decida Claude vs Gemma vs Gemini segun tarea.
6. Anadir skill `.claude/skills/gemma-router.md` que explique cuando usar cada modelo.

**Semana 3 — Fine-tune piloto**
7. Fine-tunear Gemma 4 E4B con 200 piezas de copy del tono PACAME.
8. Evaluar contra prompts hold-out.
9. Si pasa benchmark, ofrecer como servicio premium: **"Tu propio GPT entrenado con tu marca, por 499 EUR/mes"**.

---

## Archivos descargados (referencia)

En `C:\Users\Pacame24\Downloads\PACAME AGENCIA\docs\gemma4\`:

- `gemma-core.md` — pagina principal Gemma 4
- `gemma-gemma3.md` — model card Gemma 3 (version anterior)
- `gemma3-model-card.md` — detalle tecnico Gemma 3
- `gemma3n.md` — variante Gemma 3n (edge/movil)
- `gemma-finetune.md` — tutorial LoRA en Keras
- `gemma-hf.md` — integracion Hugging Face
- `gemma-vertex.md` — despliegue Vertex AI
- `gemma-ollama.md` — guia Ollama
- `gemma-index.md` — landing de Gemma

Para actualizar: volver a descargar con `curl -sL -A "Mozilla/5.0" -o archivo.html URL` desde `docs/gemma4/`.

# Simulador Clínico de Monitor/Desfibrilador Philips Efficia DFM100
**Propiedad de Alberto Á. Garra**

Plataforma integral de simulación médica diseñada para la docencia y entrenamiento de médicos, enfermeros, técnicos de emergencias sanitarias (TES) y personal de soporte vital avanzado (SVA) en situaciones críticas: **Código Ictus, Código Infarto (IAM), Tromboembolismo Pulmonar (TEP), Fibrilación Auricular (FA), Síncope por Bloqueo AV, Politrauma y Parada Cardiorrespiratoria (PCR)**.

---

## 🚀 Inicio Rápido (3 Formas de Usar el Simulador)

### Opción 1: Modo Demo en Ordenador (Pantalla Dividida)
Para probar o ensayar el simulador en un único equipo sin necesidad de tablet ni móvil:
1. Haz doble clic en `start_simulator.bat` (o abre `split-demo.html` en tu navegador).
2. Verás a la izquierda el monitor Philips del alumno y a la derecha el teléfono móvil del instructor.
3. Al modificar cualquier constante vital o escenario en el móvil, el monitor responderá al instante.

### Opción 2: Conexión Inalámbrica Tablet (Alumno) + Smartphone (Instructor)
1. Abre `student.html` en la tablet (iPad, Samsung Galaxy Tab, etc.).
2. En la pantalla del monitor aparecerá un código PIN de sala (ej. `PIN: DFM-4821`) y un botón para mostrar el código QR.
3. En el smartphone del instructor:
   - **Escanea el código QR** con la cámara del móvil.
   - O bien abre la dirección web e introduce el código PIN de 4 letras.
4. Ambos dispositivos quedarán enlazados automáticamente en tiempo real mediante **WebRTC P2P** con latencia mínima (< 30ms).

### Opción 3: Red Local / Aula sin Conexión a Internet
1. En el ordenador del aula, ejecuta `start_simulator.bat`.
2. La consola mostrará la IP local del aula (por ejemplo: `http://192.168.1.45:8080`).
3. Conecta la tablet del alumno a: `http://192.168.1.45:8080/student.html`.
4. Conecta el smartphone del docente a: `http://192.168.1.45:8080/instructor.html`.

---

## 🎛️ Novedades y Características Fieles al Philips Efficia DFM100

### 1. Mando Selector Giratorio Central Físico (Rotary Knob)
- Reproducción del dial giratorio central del Philips DFM100 hospitalario con posiciones conmutables:
  - **APAGADO (OFF)**
  - **MONITOR**
  - **DEA (AED)**
  - **DESFIB MANUAL:** dial de Joules seleccionables directamente girando la rueda (**1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, 70, 100, 150, 200 J**).
  - **MARCAPASOS (PACER):** despliega los controles de marcapasos transcutáneo (Frecuencia en ppm, Intensidad en mA, Modo Demanda/Fijo y Pausa 4:1).
- Botones físicos complementarios: **2. CARGAR** (ámbar) y **3. DESCARGA** (botón luminoso rojo con rayo central) y **SINCRO**.

### 2. Sensores Desactivados por Defecto y Lógica de FC (Desacoplada)
- Al encender el monitor, **todos los sensores arrancan desactivados** (`--` en pantalla).
- El docente activa cada sensor en su visor unificado cuando el alumno coloque la sonda correspondiente en el paciente o maniquí:
  - Si el alumno coloca los **latiguillos/parches ECG**: se dibuja la onda ECG verde y la FC se obtiene del ECG.
  - Si el alumno coloca sólo el **pulsioxímetro (SpO2)**: la línea de ECG permanece desconectada, pero la curva de pletismografía se activa (cian) y la FC/Pulso se muestra obtenida de la pulsioximetría (`FP`), tal como ocurre en la práctica médica real.
  - Si no hay ningún sensor colocado: muestra `--`.

### 3. Presión No Invasiva (PANI) con Rampa de Inflado en mmHg
- Muestra el valor numérico dinámico en mmHg subiendo durante el inflado: `Inflando: 30 mmHg... 90 mmHg... 180 mmHg...`, seguido de deflación escalonada y cálculo final de Sistólica/Diastólica y Presión Arterial Media (PAM).
- Volumen atenuado y sonido neumático suave y realista.

### 4. Visor Unificado en el Móvil del Docente
- En una sola pantalla principal:
  - Visor en vivo con todas las constantes: **FC, SpO2, TAS, TAD, FR, EtCO2, Temp y Ritmo actual**.
  - Botones chips inmediatos para conectar/desconectar sensores (**Latiguillos ECG**, **Pulsioxímetro SpO2**, **Manguito PANI**, **Sensor FR**, **Capnógrafo**).
  - Selector de cambio: **⚡ Instantáneo (0s)** o **⏱️ Programado diferido** (10s a 120s con transición suave de 0s a 20s).

### 5. Catálogo Completo de Ritmos según Guías AHA / ERC / ESC
- Más de 30 ritmos cardiológicos:
  - **Sinusales:** Normal, Bradicardia, Taquicardia, Arritmia respiratoria, Paro sinusal (>2.5s).
  - **Auriculares:** FA Rápida (RVR > 150 lpm), FA controlada, FA lenta, Flutter auricular 2:1 y 3:1/4:1, TPSV / AVNRT, Ritmo de la unión.
  - **Bloqueos AV:** Bloqueo 1er grado, Mobitz I (Wenckebach), Mobitz II, Bloqueo 2:1 de alto grado, Bloqueo completo 3er grado (Stokes-Adams).
  - **Bloqueos de Rama:** Bloqueo de Rama Derecha (BRD / RBBB) y Bloqueo de Rama Izquierda (BRI / LBBB).
  - **Síndromes Coronarios Agudos:** SCACEST Anterior (ST elevado V1-V4), SCACEST Inferior (II, III, aVF con espejo en I, aVL), SCACEST Posterior, SCASEST con infradesnivel ST > 2mm e inversión de T, IAM con extrasístoles ventriculares.
  - **Ventriculares y PCR:** Taquicardia Ventricular Monomorfa, Torsades de Pointes, Fibrilación Ventricular Gruesa y Fina, Asistolia, Actividad Eléctrica Sin Pulso (AESP), Bigeminismo.
  - **Marcapasos:** Estimulación transcutánea con captura efectiva y fallo de captura.

### 6. Biblioteca de ECG de 12 Derivaciones (Papel Milimetrado)
- Módulo para el instructor con 12 electrocardiogramas completos de 12 derivaciones comentados clínicamente (Normal, SCACEST anterior, inferior con VD, posterior, SCASEST difuso, BCRI con Sgarbossa, BAV 3, TEP S1Q3T3, Pericarditis, Hiperpotasemia, Brugada, WPW).
- Botón **"📤 Enviar ECG 12D a la Tablet"** que despliega en la pantalla del alumno la tira completa impresa en papel milimetrado rosado estándar (25 mm/s, 10 mm/mV) para su interpretación diagnóstica.

### 7. Selector Funcional Adulto / Pediátrico
- Conmutador en tiempo real que adapta alarmas fisiológicas, límites de presión máxima de PANI (180 mmHg en adulto vs 130 mmHg en pediátrico) y escalas de descarga.

---

## ⚖️ Propiedad Intelectual
**Propiedad de Alberto Á. Garra**. Todos los derechos reservados. Diseñado para simulación y docencia clínica avanzada.

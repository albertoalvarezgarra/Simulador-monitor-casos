/**
 * Escenarios Clínicos de Emergencia, Ritmos AHA/ERC, Biblioteca ECG 12D,
 * Vía Aérea, Pupilas y Auscultación Cardiopulmonar
 * Propiedad de Alberto Á. Garra
 */

// Todos los sensores inician desactivados por defecto al encender el monitor
const DEFAULT_INITIAL_SENSORS = {
  ecg_leads: false,  // Latiguillos I, II, III
  defib_pads: false, // Palas manuales o parches de desfibrilación
  spo2: false,       // Pulsioxímetro
  nibp: false,       // Manguito de presión arterial
  resp: false,       // Frecuencia respiratoria
  etco2: false       // Capnografía
};

// =============================================================================
// CATÁLOGO COMPLETO DE RITMOS AHA / ERC / ESC
// =============================================================================
const ECG_RHYTHMS = [
  // 1. SINUSALES
  { id: 'sinus', name: 'Ritmo Sinusal Normal', category: 'Sinusales', defaultHr: 75, desc: 'P normal, PR 0.16s, QRS estrecho < 0.10s, regular' },
  { id: 'sinus_brady', name: 'Bradicardia Sinusal', category: 'Sinusales', defaultHr: 38, desc: 'Ritmo sinusal regular con FC < 50 lpm' },
  { id: 'sinus_tachy', name: 'Taquicardia Sinusal', category: 'Sinusales', defaultHr: 130, desc: 'Ritmo sinusal con FC > 100 lpm' },
  { id: 'sinus_arrhythmia', name: 'Arritmia Sinusal Respiratoria', category: 'Sinusales', defaultHr: 72, desc: 'Variación fisiológica cíclica del intervalo P-P con la respiración' },
  { id: 'sinus_arrest', name: 'Pausa / Paro Sinusal (>2.5s)', category: 'Sinusales', defaultHr: 45, desc: 'Fallo del nodo sinusal en generar impulsos con pausas prolongadas' },

  // 2. AURICULARES Y DE LA UNIÓN
  { id: 'afib', name: 'Fibrilación Auricular Rápida (RVR)', category: 'Auriculares', defaultHr: 155, desc: 'Ausencia de ondas P, línea f caótica, R-R totalmente irregular > 140 lpm' },
  { id: 'afib_controlled', name: 'Fibrilación Auricular Normal / Controlada', category: 'Auriculares', defaultHr: 82, desc: 'FA con respuesta ventricular normofrecuente 70-90 lpm' },
  { id: 'afib_slow', name: 'Fibrilación Auricular Lenta', category: 'Auriculares', defaultHr: 44, desc: 'Bradifibrilación auricular por fármacos o disfunción nodal' },
  { id: 'af_wpw', name: 'FA con Preexcitación (FBI: Fast, Broad, Irregular)', category: 'Auriculares', defaultHr: 210, desc: 'FA conducida por vía accesoria WPW: QRS ancho, irregular y FC > 200 lpm (Riesgo de FV)' },
  { id: 'aflutter_2_1', name: 'Flutter Auricular (Conducción 2:1)', category: 'Auriculares', defaultHr: 150, desc: 'Ondas F en dientes de sierra a 300/min y respuesta ventricular regular a 150 lpm' },
  { id: 'aflutter_variable', name: 'Flutter Auricular (Conducción 3:1 / 4:1)', category: 'Auriculares', defaultHr: 75, desc: 'Flutter auricular con conducción AV variable' },
  { id: 'svt', name: 'Taquicardia Supraventricular Rápida (TPSV)', category: 'Auriculares', defaultHr: 195, desc: 'Taquicardia regular de QRS estrecho a 180-220 lpm, onda P oculta' },
  { id: 'svt_adenosine', name: 'Apertura tras Adenosina (Pausa y Conversión)', category: 'Auriculares', defaultHr: 72, desc: 'Pausa transitoria por bloqueo AV inducido por adenosina que revela el ritmo de base' },
  { id: 'junctional', name: 'Ritmo de la Unión AV (Escape)', category: 'Auriculares', defaultHr: 46, desc: 'Ritmo regular a 40-50 lpm, onda P ausente o retrógrada' },

  // 3. BLOQUEOS AURÍCULO-VENTRICULARES (AV)
  { id: 'av_block_1', name: 'Bloqueo AV 1er Grado (PR largo)', category: 'Bloqueos AV', defaultHr: 68, desc: 'PR constante prolongado > 0.20s (240ms), todas las P conducen' },
  { id: 'av_block_2_1', name: 'Bloqueo AV 2º Grado (Mobitz I / Wenckebach)', category: 'Bloqueos AV', defaultHr: 54, desc: 'Alargamiento progresivo de PR hasta que una onda P se bloquea' },
  { id: 'av_block_2_2', name: 'Bloqueo AV 2º Grado (Mobitz II)', category: 'Bloqueos AV', defaultHr: 44, desc: 'Intervalo PR fijo constante con caída súbita de complejos QRS' },
  { id: 'av_block_2_high', name: 'Bloqueo AV 2º Grado Alto Grado (2:1)', category: 'Bloqueos AV', defaultHr: 40, desc: 'Dos ondas P por cada complejo QRS conducido' },
  { id: 'av_block_3', name: 'Bloqueo AV 3er Grado Completo', category: 'Bloqueos AV', defaultHr: 28, desc: 'Disociación AV total: P a 75 bpm y escape ventricular ancho a 28-32 bpm' },

  // 4. BLOQUEOS DE RAMA
  { id: 'rbbb', name: 'Bloqueo Completo Rama Derecha (BRD / RBBB)', category: 'Bloqueos de Rama', defaultHr: 76, desc: 'QRS ancho > 120ms con patrón rsR\' ("orejas de conejo")' },
  { id: 'lbbb', name: 'Bloqueo Completo Rama Izquierda (BRI / LBBB)', category: 'Bloqueos de Rama', defaultHr: 74, desc: 'QRS ancho > 130ms, QS ancho en V1 y R empastada en I/aVL' },

  // 5. ISQUEMIA Y SÍNDROMES CORONARIOS AGUDOS (AHA / ESC)
  { id: 'stemi_anterior', name: 'SCACEST Anterior Agudo (IAMCEST V1-V4)', category: 'Isquemia / IAM', defaultHr: 96, desc: 'Supradesnivel del ST marcado > 4mm con ondas T hiperagudas' },
  { id: 'stemi_inferior', name: 'SCACEST Inferior Agudo (II, III, aVF)', category: 'Isquemia / IAM', defaultHr: 88, desc: 'Elevación ST en cara diafragmática con infradesnivel especular en I y aVL' },
  { id: 'stemi_posterior', name: 'SCACEST Posterior Agudo (V7-V9)', category: 'Isquemia / IAM', defaultHr: 92, desc: 'Infradesnivel horizontal en V1-V3 con R altas prominentes' },
  { id: 'nstemi_diffuse', name: 'SCASEST Anterior / Isquemia Subendocárdica', category: 'Isquemia / IAM', defaultHr: 102, desc: 'Infradesnivel ST horizontal > 2mm e inversión simétrica de ondas T' },
  { id: 'stemi_pvc', name: 'IAM con Extrasístoles Ventriculares frecuentes', category: 'Isquemia / IAM', defaultHr: 108, desc: 'Elevación ST y fenómeno de R sobre T de alto riesgo arrítmico' },

  // 6. VENTRICULARES, REANIMACIÓN Y PARADA (PCR)
  { id: 'cpr_artifact', name: 'Compresiones RCP en curso (100 cpm)', category: 'Ventriculares / PCR', defaultHr: 100, desc: 'Artefactos mecánicos sinusoidales rítmicos por masaje cardíaco externo a 100-110 cpm' },
  { id: 'vt', name: 'Taquicardia Ventricular Monomorfa (TV)', category: 'Ventriculares / PCR', defaultHr: 185, desc: 'QRS aberrante ancho y regular a 180 lpm sin ondas P visibles' },
  { id: 'torsades', name: 'Torsades de Pointes (TV Polimorfa)', category: 'Ventriculares / PCR', defaultHr: 220, desc: 'QRS ancho con torsión helicoidal continua del eje y amplitud' },
  { id: 'vf_coarse', name: 'Fibrilación Ventricular Gruesa (FV)', category: 'Ventriculares / PCR', defaultHr: 0, desc: 'Actividad caótica desorganizada > 0.2 mV. Ritmo desfibrilable' },
  { id: 'vf_fine', name: 'Fibrilación Ventricular Fina', category: 'Ventriculares / PCR', defaultHr: 0, desc: 'Fibrilación de baja amplitud < 0.2 mV, requiere RCP de calidad' },
  { id: 'asystole', name: 'Asistolia', category: 'Ventriculares / PCR', defaultHr: 0, desc: 'Trazado isoeléctrico plano. Ritmo no desfibrilable' },
  { id: 'pea_brady', name: 'AESP (Actividad Eléctrica Sin Pulso)', category: 'Ventriculares / PCR', defaultHr: 34, desc: 'Complejos anchos y lentos en monitor sin pulso carotídeo palpable' },
  { id: 'pvc_bigeminy', name: 'Bigeminismo Ventricular', category: 'Ventriculares / PCR', defaultHr: 78, desc: 'Alternancia fija de un latido sinusal con una extrasístole ventricular' },
  { id: 'pvc_couplets', name: 'Dupletas / Parejas de EV', category: 'Ventriculares / PCR', defaultHr: 84, desc: 'Extrasístoles ventriculares acopladas de dos en dos' },

  // 7. RITMOS DE ESCAPE
  { id: 'junctional_escape', name: 'Escape de la Unión AV (40-60 lpm)', category: 'Ritmos de Escape', defaultHr: 45, desc: 'Ritmo regular 40-60 lpm, QRS estrecho, onda P ausente o retrógrada (PR corto <0.12s o tras QRS)' },
  { id: 'idioventricular', name: 'Ritmo Idioventricular (20-40 lpm)', category: 'Ritmos de Escape', defaultHr: 30, desc: 'Ritmo regular muy lento 20-40 lpm, QRS ancho >0.12s, morfología ventricular, sin ondas P' },
  { id: 'accelerated_idioventricular', name: 'Ritmo Idioventricular Acelerado / RIVA (60-100 lpm)', category: 'Ritmos de Escape', defaultHr: 80, desc: 'QRS ancho a 60-100 lpm sin ondas P, típico de reperfusión post-IAM' },

  // 8. MARCAPASOS
  { id: 'pacing_capture', name: 'Ritmo Marcapasos con Captura Efectiva', category: 'Marcapasos', defaultHr: 60, desc: 'Espícula afilada seguida de despolarización ventricular (QRS ancho) y onda T' },
  { id: 'pacing_fail', name: 'Ritmo Marcapasos con Fallo de Captura', category: 'Marcapasos', defaultHr: 32, desc: 'Espículas de estimulación que no producen activación miocárdica (por debajo del umbral)' }
];

// =============================================================================
// BIBLIOTECA CLÍNICA DE ECG 12 DERIVACIONES Y DERIVACIONES ESPECIALES
// (Imágenes médicas reales con nomenclatura técnica para el alumno sin pistas diagnósticas)
// =============================================================================
const ECG_12_LEAD_LIBRARY = [
  {
    id: 'ecg12_normal',
    title: 'ECG Normal de 12 Derivaciones',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Normal',
    clinicalCase: 'Varón de 28 años, control preanestésico rutinario. Asintomático.',
    findings: 'Ritmo sinusal regular a 72 lpm. Eje QRS +45º. Intervalo PR 0.15s, QRS 0.08s, QTc 410ms. Progresión fisiológica de la onda R en precordiales sin alteraciones en la repolarización.',
    imageType: 'normal',
    imageUrl: 'assets/ecg12/ecg_normal.jpg',
    rhythmMatch: ['sinus', 'sinus_arrhythmia']
  },
  {
    id: 'ecg12_sinus_brady',
    title: 'Bradicardia Sinusal Severa',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Sinusales',
    clinicalCase: 'Varón de 74 años en tratamiento con betabloqueantes y mareo postural.',
    findings: 'Ritmo sinusal regular a 38 lpm. Onda P idéntica a sinusal, conducción AV 1:1 conservada, repolarización sin cambios isquémicos agudos.',
    imageType: 'sinus_brady',
    imageUrl: 'assets/ecg12/ecg_sinus_brady.jpg',
    rhythmMatch: ['sinus_brady']
  },
  {
    id: 'ecg12_stemi_anterior',
    title: 'SCACEST Anterior Agudo (Código Infarto V1-V4)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Coronario Agudo',
    clinicalCase: 'Varón de 56 años con dolor opresivo retroesternal intenso irradiado a brazo izquierdo de 50 minutos de evolución.',
    findings: 'Supradesnivel del segmento ST de 4 a 6 mm en derivaciones V1, V2, V3 y V4 con morfología convexa ("Tombstone") y ondas T hiperagudas. Infradesnivel especular en II, III y aVF. Criterio de revascularización urgente.',
    imageType: 'stemi_anterior',
    imageUrl: 'assets/ecg12/ecg_stemi_anterior.jpg',
    rhythmMatch: ['stemi_anterior', 'stemi_pvc']
  },
  {
    id: 'ecg12_stemi_inferior',
    title: 'SCACEST Inferior Clásico (II, III, aVF)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Coronario Agudo',
    clinicalCase: 'Varón de 61 años con dolor epigástrico opresivo y sudoración profusa de 1 hora.',
    findings: 'Supradesnivel del segmento ST marcado en cara diafragmática (II, III y aVF, con elevación mayor en III que en II) e infradesnivel especular recíproco en I y aVL.',
    imageType: 'stemi_inferior',
    imageUrl: 'assets/ecg12/ecg_stemi_inferior_vd.jpg',
    rhythmMatch: ['stemi_inferior']
  },
  {
    id: 'ecg12_right_leads_elevated',
    title: 'SCACEST Inferior con Afectación de VD (V3R-V4R Elevadas)',
    studentTitle: 'Registro Electrocardiográfico — Derivaciones Derechas (V3R - V6R)',
    category: 'Coronario Agudo',
    clinicalCase: 'Mujer de 68 años con dolor epigástrico, mareo, hipotensión arterial 85/50 y cortejo vegetativo profuso.',
    findings: 'Supradesnivel del ST marcado en derivaciones inferiores (II, III, aVF). En derivaciones derechas: ELEVACIÓN DEL ST > 1mm en V3R y V4R confirmatoria de infarto de ventrículo derecho. Contraindicados nitratos y morfina por colapso de precarga.',
    imageType: 'stemi_inferior_vd_pos',
    imageUrl: 'assets/ecg12/ecg_stemi_inferior_vd.jpg',
    rhythmMatch: ['stemi_inferior'],
    isRightLeads: true,
    hasRvInfarct: true
  },
  {
    id: 'ecg12_right_leads_normal',
    title: 'Derivaciones Derechas Normales (V3R-V6R sin elevación)',
    studentTitle: 'Registro Electrocardiográfico — Derivaciones Derechas (V3R - V6R)',
    category: 'Coronario Agudo',
    clinicalCase: 'Varón de 54 años con infarto inferior pero normotenso (TA 130/80) para descarte de afectación de VD.',
    findings: 'Derivaciones derechas V3R y V4R isoeléctricas sin supradesnivel significativo. Ventrículo Derecho indemne.',
    imageType: 'stemi_inferior_vd_neg',
    imageUrl: 'assets/ecg12/ecg_stemi_inferior_vd.jpg',
    rhythmMatch: ['stemi_inferior'],
    isRightLeads: true,
    hasRvInfarct: false
  },
  {
    id: 'ecg12_stemi_posterior',
    title: 'SCACEST Posterior Agudo (Derivaciones Posteriores V7-V9)',
    studentTitle: 'Registro Electrocardiográfico — Derivaciones Posteriores (V7 - V9)',
    category: 'Coronario Agudo',
    clinicalCase: 'Varón de 62 años con sensación de ahogo y dolor interescapular.',
    findings: 'Infradesnivel horizontal del ST > 2mm en V1-V3 con ondas R altas dominantes (espejo). En derivaciones posteriores V7, V8 y V9: elevación concordante del ST confirmando SCACEST posterior.',
    imageType: 'stemi_posterior',
    imageUrl: 'assets/ecg12/ecg_posterior.png',
    rhythmMatch: ['stemi_posterior'],
    isPosteriorLeads: true
  },
  {
    id: 'ecg12_nste_anterior',
    title: 'SCASEST Anterior / Isquemia Aguda',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Coronario Agudo',
    clinicalCase: 'Mujer de 72 años con angina inestable de reposo y diaforesis.',
    findings: 'Infradesnivel marcado del segmento ST horizontal/descendente > 2.5 mm en cara anterior y lateral (V3-V6, I, aVL) indicativo de compromiso subendocárdico severo.',
    imageType: 'nste_acs',
    imageUrl: 'assets/ecg12/ecg_stemi_anterior.jpg',
    rhythmMatch: ['nstemi_diffuse']
  },
  {
    id: 'ecg12_svt_fast',
    title: 'Taquicardia Supraventricular Rápida (TPSV)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Auriculares',
    clinicalCase: 'Mujer de 29 años con palpitaciones bruscas en cuello y mareo.',
    findings: 'Taquicardia regular de QRS estrecho a 195 lpm sin ondas P identificables (reentrada intranodal típica AVNRT).',
    imageType: 'svt_fast',
    imageUrl: 'assets/ecg12/ecg_svt_fast.jpg',
    rhythmMatch: ['svt']
  },
  {
    id: 'ecg12_svt_adenosine',
    title: 'TSV con Conversión / Apertura tras Adenosina',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Auriculares',
    clinicalCase: 'Misma paciente tras bolo rápido de 6 mg de adenosina intravenosa.',
    findings: 'Tira de ritmo continua que muestra la desaceleración brusca, pausa asistólica transitoria con bloqueo AV transitorio y reinstauración de ritmo sinusal con onda P visible.',
    imageType: 'svt_adenosine',
    imageUrl: 'assets/ecg12/ecg_svt_adenosine.jpg',
    rhythmMatch: ['svt_adenosine']
  },
  {
    id: 'ecg12_vt',
    title: 'Taquicardia Ventricular Monomórfica Sostenida',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Ventriculares',
    clinicalCase: 'Varón de 64 años con antecedente de IAM antiguo, presíncope y sensación de palpitaciones rápidas.',
    findings: 'Taquicardia de QRS ancho > 160ms muy regular a 180 lpm con concordancia precordial y disociación aurículo-ventricular diagnóstica de TV.',
    imageType: 'vt',
    imageUrl: 'assets/ecg12/ecg_vt.jpg',
    rhythmMatch: ['vt']
  },
  {
    id: 'ecg12_torsades',
    title: 'Torsades de Pointes (TV Polimórfica Helicoidal)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Ventriculares',
    clinicalCase: 'Mujer de 52 años con hipopotasemia severa y QT largo farmacológico que sufre síncope recurrente.',
    findings: 'Taquicardia ventricular polimórfica caracterizada por complejos QRS anchos continuos que varían de polaridad rotando alrededor de la línea de base.',
    imageType: 'torsades',
    imageUrl: 'assets/ecg12/ecg_torsades.jpg',
    rhythmMatch: ['torsades']
  },
  {
    id: 'ecg12_af_normal',
    title: 'Fibrilación Auricular con Respuesta Ventricular Normal',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Auriculares',
    clinicalCase: 'Varón de 71 años con palpitaciones irregulares y astenia.',
    findings: 'Ausencia de ondas P, línea de base irregular con micro-ondas f, intervalos R-R completamente arrítmicos y FC media a 85 lpm.',
    imageType: 'af_normal',
    imageUrl: 'assets/ecg12/ecg_af_normal.jpg',
    rhythmMatch: ['afib', 'afib_controlled']
  },
  {
    id: 'ecg12_af_wpw',
    title: 'Fibrilación Auricular con Preexcitación (Síndrome de WPW)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Auriculares',
    clinicalCase: 'Varón de 23 años con taquicardia irregular extremadamente rápida y colapso presincopal.',
    findings: 'Ritmo rápido, ancho e irregular (FBI: Fast, Broad, Irregular) con FC superando los 220 lpm. Onda delta y fusión ventricular por conducción anterógrada por el haz de Kent.',
    imageType: 'af_wpw',
    imageUrl: 'assets/ecg12/ecg_wpw.png',
    rhythmMatch: ['af_wpw']
  },
  {
    id: 'ecg12_pacemaker',
    title: 'Ritmo de Marcapasos Ventricular con Captura Efectiva',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Marcapasos',
    clinicalCase: 'Varón de 80 años portador de marcapasos VVI programado a 60 ppm.',
    findings: 'Espículas afiladas de estimulación ventricular antes de cada complejo QRS, seguidas de despolarización ventricular ancha con morfología de BRI y onda T discordante.',
    imageType: 'pacemaker',
    imageUrl: 'assets/ecg12/ecg_pacemaker.jpg',
    rhythmMatch: ['pacing_capture']
  },
  {
    id: 'ecg12_mobitz_2',
    title: 'Bloqueo AV de 2º Grado Mobitz II',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Bloqueos de Conducción',
    clinicalCase: 'Mujer de 77 años con mareos súbitos intermitentes.',
    findings: 'Intervalo PR constante en los latidos conducidos con fallo súbito e inesperado de conducción de ondas P seleccionadas sin alargamiento previo del PR.',
    imageType: 'mobitz_2',
    imageUrl: 'assets/ecg12/ecg_mobitz_2.jpg',
    rhythmMatch: ['av_block_2_2']
  },
  {
    id: 'ecg12_av_block_3',
    title: 'Bloqueo AV Completo de 3er Grado (Stokes-Adams)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Bloqueos de Conducción',
    clinicalCase: 'Mujer de 84 años con mareo de giro y síncope de esfuerzo.',
    findings: 'Disociación aurículo-ventricular completa. Las ondas P desfilan con regularidad a 78 lpm independientes de los complejos QRS anchos de escape ventricular a 30 lpm.',
    imageType: 'av_block_3',
    imageUrl: 'assets/ecg12/ecg_av_block_3.jpg',
    rhythmMatch: ['av_block_3']
  },
  {
    id: 'ecg12_lbbb_sgarbossa',
    title: 'Bloqueo Completo de Rama Izquierda (Criterios Sgarbossa)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Bloqueos de Conducción',
    clinicalCase: 'Varón de 70 años con BCRI previo y dolor torácico sospechoso.',
    findings: 'QRS ancho > 140ms. Elevación concordante del segmento ST > 1 mm en derivaciones con QRS positivo (Criterio A de Sgarbossa, alta especificidad para IAM concomitante con BRI).',
    imageType: 'lbbb',
    imageUrl: 'assets/ecg12/ecg_lbbb.jpg',
    rhythmMatch: ['lbbb']
  },
  {
    id: 'ecg12_tep_s1q3t3',
    title: 'Tromboembolismo Pulmonar Agudo (Patrón S1Q3T3)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Emergencia Respiratoria',
    clinicalCase: 'Varón de 49 años con disnea brusca, taquipnea e hipoxemia tras viaje prolongado.',
    findings: 'Taquicardia sinusal a 124 lpm. Patrón McGinn-White clásico (S1Q3T3: onda S profunda en I, onda Q patológica en III e inversión de onda T en III). Inversión de ondas T de V1 a V4 por sobrecarga aguda de VD.',
    imageType: 'tep',
    imageUrl: 'assets/ecg12/ecg_tep.jpg',
    rhythmMatch: ['sinus_tachy']
  },
  {
    id: 'ecg12_pericarditis',
    title: 'Pericarditis Aguda (Estadio I)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Inflamatorio',
    clinicalCase: 'Joven de 24 años con dolor torácico que empeora con el decúbito y mejora al inclinarse hacia delante.',
    findings: 'Elevación cóncava difusa del segmento ST ("en silla de montar") en casi todas las derivaciones (I, II, aVF, V2-V6) con ausencia de cambios especulares y descenso patognomónico del PR.',
    imageType: 'pericarditis',
    imageUrl: 'assets/ecg12/ecg_pericarditis.jpg',
    rhythmMatch: []
  },
  {
    id: 'ecg12_hyperkalemia',
    title: 'Hiperpotasemia Severa (K > 7.5 mEq/L)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Metabólico / Toxicología',
    clinicalCase: 'Paciente en hemodiálisis con debilidad muscular progresiva y omisión de sesión de diálisis.',
    findings: 'Ondas T altas, estrechas, picudas y simétricas ("en tienda de campaña") de base angosta en derivaciones precordiales con ensanchamiento de QRS y aplanamiento de P.',
    imageType: 'hyperkalemia',
    imageUrl: 'assets/ecg12/ecg_hyperkalemia.png',
    rhythmMatch: []
  },
  {
    id: 'ecg12_brugada',
    title: 'Síndrome de Brugada (Patrón Tipo 1)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Canalopatías',
    clinicalCase: 'Varón de 37 años con antecedentes familiares de muerte súbita y episodio presincopal nocturno.',
    findings: 'Elevación del segmento ST cóncava/descendente en "aleta de tiburón" >= 2 mm en V1-V2, seguida de una onda T negativa simétrica.',
    imageType: 'brugada',
    imageUrl: 'assets/ecg12/ecg_brugada.jpg',
    rhythmMatch: []
  },
  {
    id: 'ecg12_junctional_escape',
    title: 'Ritmo de Escape de la Unión AV (45 lpm)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Ritmos de Escape',
    clinicalCase: 'Varón de 69 años con mareo y bradicardia tras disfunción del nodo sinusal o intoxicación farmacológica.',
    findings: 'Ritmo regular a 45 lpm con complejos QRS estrechos (<0.10s). Ausencia de ondas P sinusales normales; ondas P retrógradas negativas visibles en II, III y aVF. Repolarización ventricular conservada.',
    imageType: 'junctional',
    imageUrl: 'assets/ecg12/ecg_normal.jpg',
    rhythmMatch: ['junctional_escape', 'junctional']
  },
  {
    id: 'ecg12_idioventricular',
    title: 'Ritmo Idioventricular de Escape / RIVA (30-35 lpm)',
    studentTitle: 'Registro Electrocardiográfico de 12 Derivaciones',
    category: 'Ritmos de Escape',
    clinicalCase: 'Varón de 74 años con bloqueo AV completo distal o ritmo de escape ventricular de rescate.',
    findings: 'Ritmo ventricular regular lento a 32 lpm. Complejos QRS anchos y aberrantes (>0.15s) sin ondas P precedentes. Ondas T discordantes con la polaridad principal del QRS.',
    imageType: 'idioventricular',
    imageUrl: 'assets/ecg12/ecg_av_block_3.jpg',
    rhythmMatch: ['idioventricular', 'accelerated_idioventricular']
  }
];

// Función para obtener automáticamente el ECG de 12 derivaciones congruente
function getCongruent12LeadEcg(rhythmId) {
  const match = ECG_12_LEAD_LIBRARY.find(ecg => ecg.rhythmMatch && ecg.rhythmMatch.includes(rhythmId));
  return match || ECG_12_LEAD_LIBRARY[0];
}

// =============================================================================
// CATÁLOGO DE EXPLORACIÓN DE GARGANTA / OROFARINGE Y ÚVULA (ORL)
// =============================================================================
const AIRWAY_CONDITIONS = [
  {
    id: 'throat_normal',
    name: 'Orofaringe y Úvula Normal',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Paciente sin compromiso de vía aérea. Mucosa orofaríngea rosada y húmeda.',
    findings: 'Úvula centrada y eutrófica. Pilares amigdalinos y amígdalas palatinas simétricas sin exudados ni edema.',
    imageUrl: 'assets/airway/throat_normal.jpg'
  },
  {
    id: 'throat_edema_mild',
    name: 'Edema de Úvula Leve (Uvulitis alérgica)',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Reacción alérgica alimentaria incipiente con prurito orofaríngeo y sensación de cuerpo extraño.',
    findings: 'Úvula tumefacta y eritematosa con leve engrosamiento mucoso. Pilares anteriores sin obstrucción.',
    imageUrl: 'assets/airway/throat_edema_mild.jpg'
  },
  {
    id: 'throat_edema_mod',
    name: 'Edema de Úvula Moderado',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Angioedema por fármaco (IECA). Disfonía y sensación de opresión al tragar.',
    findings: 'Úvula globulosa muy engrosada y pálida/serosa con elongación que roza la base lingual.',
    imageUrl: 'assets/airway/throat_edema_mod.jpg'
  },
  {
    id: 'throat_edema_severe',
    name: 'Edema Severo de Úvula y Pilares (Edema de Quincke)',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Anafilaxia grave con estridor y compromiso inminente de la vía aérea.',
    findings: 'Gran edema traslúcido gelatinoso masivo de úvula ("úvula en badajo de campana gigante") y pilares con estenosis crítica del istmo de las fauces.',
    imageUrl: 'assets/airway/throat_edema_severe.jpg'
  },
  {
    id: 'throat_burn',
    name: 'Garganta Quemada / Lesión Térmica Orofaríngea',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Quemadura orofaríngea por ingestión accidental de líquido hirviendo / inhalación de vapor térmico.',
    findings: 'Eritema intenso generalizado en paladar blando, pilares y úvula con flictenas y desprendimiento epitelial blanquecino fibrinoso.',
    imageUrl: 'assets/airway/throat_burn.jpg'
  },
  {
    id: 'throat_abscess',
    name: 'Absceso Periamigdalino (Desviación Uvular)',
    studentTitle: 'Exploración de Orofaringe y Cavidad Oral',
    clinicalCase: 'Amigdalitis evolucionada con trismus doloroso, sialorrea y voz de "patata caliente".',
    findings: 'Abombamiento eritematoso marcado del pilar amigdalino con desplazamiento y desviación contralateral de la úvula.',
    imageUrl: 'assets/airway/throat_abscess.jpg'
  }
];

// =============================================================================
// CATÁLOGO DE SONIDOS VOCALES Y FRASES DEL PACIENTE (GLASGOW / VALORACIÓN)
// =============================================================================
const PATIENT_VOCAL_CATALOG = [
  { id: 'incomprehensible', name: 'Sonidos Incomprensibles / Quejidos', gcs: 'Verbal: 2 (Sonidos)', desc: 'Gemidos y quejidos con vibrato, tono bajo (audio + voz)' },
  { id: 'inappropriate', name: 'Palabras Inapropiadas / Balbuceo', gcs: 'Verbal: 3 (Palabras)', desc: 'Frases incoherentes sin sentido contextual ("Pero qué... si yo estaba... no sé dónde está mi madre...")' },
  { id: 'insults', name: 'Insultos / Paciente Agresivo', gcs: 'Verbal: 3-4 (Agresividad)', desc: 'Rechazo agresivo y hostilidad ("¡Suéltame! ¡No me toquéis!")' },
  { id: 'confused', name: 'Respuesta Confusa / Desorientada', gcs: 'Verbal: 4 (Confuso)', desc: 'Desorientado en tiempo y espacio ("¿Dónde estoy? ¿Qué me ha pasado? No me acuerdo de nada...")' },
  { id: 'oriented', name: 'Respuesta Orientada y Coherente', gcs: 'Verbal: 5 (Orientado)', desc: 'Explica dolor torácico opresivo, mareo y disnea de forma coherente' },
  { id: 'cough', name: 'Tos Severa Paroxística', gcs: 'Vía Aérea', desc: 'Accesos repetidos de tos seca (solo audio sintetizado)' },
  { id: 'asphyxia', name: 'Asfixia / Estridor Inspiratorio', gcs: 'Vía Aérea Obstruida', desc: 'Ruido de asfixia con estridor (solo audio sintetizado)' },
  { id: 'scream', name: 'Gritos de Dolor Agudo', gcs: 'Dolor Severo (EVA 10)', desc: 'Exclamaciones intensas de dolor ("¡Me duele muchísimo! ¡Por favor, hagan algo!")' },
  { id: 'cry', name: 'Llanto Puro y Sollozos', gcs: 'Angustia / Pánico', desc: 'Llanto con sollozos entrecortados y respiración agitada (solo audio sintetizado)' }
];

// =============================================================================
// CATÁLOGO DE AUSCULTACIÓN PULMONAR Y CARDÍACA
// =============================================================================
const AUSCULTATION_CATALOG = {
  pulmonary: [
    { id: 'normal', name: 'Murmullo Vesicular Normal', desc: 'Sonido suave y continuo durante la inspiración y primer tercio de la espiración' },
    { id: 'wheeze', name: 'Sibilancias Bilaterales (Broncoespasmo)', desc: 'Ruidos continuos de tono musical agudo producidos por el paso de aire a través de vías estrechas (Asma / EPOC)' },
    { id: 'crackles', name: 'Crepitantes Húmedos (EAP / Insuficiencia Cardíaca)', desc: 'Ruidos discontinuos cortos, explosivos y secos por despegamiento alveolar' },
    { id: 'stridor', name: 'Estridor Inspiratorio (Obstrucción Vía Aérea Alta)', desc: 'Ruido inspiratorio áspero y ruidoso de tono alto en cuello y laringe por edema de glotis' },
    { id: 'rhonchi', name: 'Roncus (Secreciones en Grandes Vías)', desc: 'Ruidos bronquiales graves de baja frecuencia semejantes al ronquido por acumulación mucosa' },
    { id: 'silent', name: 'Tórax Silente / Hipofonesis Severa', desc: 'Ausencia total o casi total de ruidos respiratorios por broncoespasmo extremo o neumotórax' }
  ],
  cardiac: [
    { id: 'normal', name: 'Tonos Cardíacos Normales (R1 y R2 rítmicos)', desc: 'Cierre de válvulas AV (R1) y semilunares (R2), ritmo regular y claro sin soplos' },
    { id: 'systolic_murmur', name: 'Soplo Sistólico Eyectivo', desc: 'Soplo rudo mesosistólico en foco aórtico irradiado a carótidas (Estenosis aórtica / sobrecarga)' },
    { id: 's3_gallop', name: 'Galope Ventricular por Tercer Tono (R3)', desc: 'Ritmo en tres tiempos con tono protodiastólico de baja frecuencia indicativo de fallo ventricular' },
    { id: 'pericardial_rub', name: 'Roce Pericárdico Superficial', desc: 'Ruido áspero y rascante semejante al cuero rozando durante sístole y diástole (Pericarditis aguda)' },
    { id: 'muffled', name: 'Tonos Cardíacos Apagados / Velados (Taponamiento)', desc: 'Tonos lejanos y de muy baja intensidad por acumulación de líquido pericárdico a tensión' }
  ]
};

// =============================================================================
// ESCENARIOS CLÍNICOS GUIADOS DE EMERGENCIA — GUÍA DEL INSTRUCTOR ERC 2025
// Ocho escenarios de prevención de la parada cardiaca y arritmias peri-parada
// =============================================================================
const CLINICAL_SCENARIOS = [
  // ─────────────────────────────────────────────────────────────────────────
  // CASO 1: SCACEST INFERIOR CON AFECTACIÓN DE VENTRÍCULO DERECHO (VD)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_scacest_vd',
    category: 'Coronario Agudo / Hemodinamia',
    code: 'ERC-2025 CASO 1',
    title: 'SCACEST Inferior con Afectación de Ventrículo Derecho',
    description: 'Varón de 62 años con dolor torácico opresivo de 1h de evolución e hipotensión arterial (88/56 mmHg). Campos pulmonares limpios sin crepitantes e ingurgitación yugular evidente. Elevación de ST en cara inferior (II, III, aVF) con gran dependencia de la precarga.',
    tags: ['SCACEST', 'Ventrículo Derecho', 'Hipotensión', 'V4R', 'Nitratos Contraindicados', 'Fluidos'],
    initialVitals: {
      rhythm: 'stemi_inferior',
      hr: 48,
      spo2: 93,
      bpSys: 88,
      bpDia: 56,
      rr: 18,
      etco2: 35,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    suggestRightLeads: true,
    guidedSteps: [
      {
        id: 'step_scacest_01',
        phase: '1. Valoración Inicial ABCDE',
        title: '¿El alumno sospecha afectación de VD y solicita derivaciones derechas (V3R/V4R)?',
        description: 'Paciente hipotenso con SCACEST inferior y campos pulmonares limpios. La presencia de ingurgitación yugular sin congestión pulmonar debe alertar inmediatamente de afectación del ventrículo derecho.',
        instructorAction: 'El alumno realiza ABCDE. Si pregunta por yugulares o auscultación: "Campos pulmonares limpios bilateralmente, ingurgitación yugular evidente a 45º".',
        expectedAction: 'Sospechar infarto de VD y solicitar ECG de 12 derivaciones con precordiales derechas (V3R y V4R).',
        hint: 'Pista clínica: Triada del infarto de VD = Hipotensión + Campos pulmonares limpios + Ingurgitación yugular. Solicitar V4R.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Sospecha confirmada: El registro en derivación V4R muestra elevación de ST >= 1 mm, diagnosticando SCACEST de VD.'
        },
        onSkip: {
          vitalsChange: { bpSys: 82, bpDia: 50 },
          message: '⚠️ Si no sospecha afectación de VD, el alumno corre riesgo inminente de cometer el error fatal de administrar nitratos.'
        }
      },
      {
        id: 'step_scacest_02',
        phase: '2. Manejo Farmacológico Crítico',
        title: '¿El alumno EVITA administrar nitroglicerina / vasodilatadores / morfina a dosis altas?',
        description: 'El ventrículo derecho infartado depende de presiones de llenado elevadas (precarga). Los nitratos reducen bruscamente el retorno venoso provocando shock cardiogénico profundo.',
        instructorAction: 'La enfermera simula: "¿Doctor, le pongo cafinitrina sublingual o un parche de nitroglicerina para calmar el dolor de pecho?"',
        expectedAction: 'Rechazar firmemente los nitratos y vasodilatadores porque suprimen la precarga del VD.',
        hint: 'Pista de seguridad: CONTRAINDICACIÓN FORMAL DE NITRATOS en infarto de ventrículo derecho por riesgo de colapso hemodinámico.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Excelente decisión: Se evita la venodilatación catastrófica y se preserva el escaso gasto cardíaco del ventrículo derecho.'
        },
        onSkip: {
          vitalsChange: { bpSys: 60, bpDia: 35, hr: 42, spo2: 89 },
          message: '❌ ERROR GRAVE: Administró nitroglicerina. Caída fulminante de la precarga: TA 60/35 mmHg, palidez cenicienta y presíncope.'
        }
      },
      {
        id: 'step_scacest_03',
        phase: '3. Optimización Hemodinámica con Volumen',
        title: '¿El alumno administra una carga prudente de volumen (cristaloides 250-500 ml IV)?',
        description: 'En ausencia de congestión pulmonar, la hipotensión del infarto de VD se trata con expansión prudente de volumen para elevar la presión venosa central y el llenado del VI.',
        instructorAction: '¿Cómo planea remontar la presión arterial de 88/56 en este paciente con pulmones secos?',
        expectedAction: 'Bolo inicial de 250 a 500 mL de cristaloides (suero salino fisiológico 0.9%) monitorizando auscultación pulmonar.',
        hint: 'Pista clínica: Infusión cautelosa de suero fisiológico 250-500 ml IV para restaurar la precarga del VD.',
        onSuccess: {
          vitalsChange: { bpSys: 104, bpDia: 64, hr: 56, spo2: 95 },
          message: '✅ Expansión de volumen efectiva: Aumenta el retorno venoso al VI y la presión arterial asciende a 104/64 mmHg.'
        },
        onSkip: {
          vitalsChange: { bpSys: 72, bpDia: 44 },
          message: '⚠️ Sin aporte cauteloso de volumen, el paciente permanece en shock hipodinámico por fallo de bomba derecha.'
        }
      },
      {
        id: 'step_scacest_04',
        phase: '4. Manejo de la Bradicardia Sintomática',
        title: '¿El alumno trata la bradicardia sinusal sintomática con Atropina (0.5 - 1 mg IV)?',
        description: 'La bradicardia es frecuente en el infarto inferior/VD por reflejo de Bezold-Jarisch o isquemia del nodo sinusal. Si causa hipoperfusión, requiere atropina.',
        instructorAction: 'La monitorización muestra bradicardia a 46-48 lpm con mareo y debilidad persistente.',
        expectedAction: 'Administrar Atropina 0.5-1 mg IV en bolo rápido (hasta un máximo de 3 mg) si persiste sintomático.',
        hint: 'Pista farmacológica: Atropina 0.5 a 1 mg IV para revertir el tono vagal excesivo y optimizar el gasto cardíaco.',
        onSuccess: {
          vitalsChange: { hr: 68, bpSys: 114, bpDia: 72 },
          message: '✅ Frecuencia cardíaca recuperada a 68 lpm. La combinación de volumen + atropina normaliza el gasto cardíaco.'
        },
        onSkip: {
          vitalsChange: { hr: 40, bpSys: 78, bpDia: 46 },
          message: '⚠️ Bradicardia extrema persistente a 40 lpm con bajo gasto mantenido e hipoperfusión cerebral.'
        }
      },
      {
        id: 'step_scacest_05',
        phase: '5. Reperfusión y Destino Final',
        title: '¿El alumno activa Código Infarto para angioplastia primaria y prescribe doble antiagregación?',
        description: 'El tratamiento definitivo es la reperfusión urgente mediante intervencionismo coronario percutáneo (ICP primario). Debe iniciarse antiagregación plaquetaria dual y heparina.',
        instructorAction: 'Preguntar: "¿Cuál es el destino definitivo del paciente y qué medicación prepara para el traslado?"',
        expectedAction: 'Activar red Código Infarto + AAS 300 mg vo + Ticagrelor 180 mg vo (o Clopidogrel 600 mg) + Heparina no fraccionada.',
        hint: 'Pista de gestión: Activación inmediata de angioplastia primaria (< 120 min) + doble antiagregación y anticoagulación.',
        onSuccess: {
          vitalsChange: { hr: 72, bpSys: 118, bpDia: 74, spo2: 97 },
          message: '🎉 ¡Caso completado con éxito! Paciente estabilizado y transferido para angioplastia primaria emergente.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Demora injustificada en la activación de hemodinámica: pérdida de miocardio viable por retraso de reperfusión.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 2: SHOCK ANAFILÁCTICO CON ESTRIDOR Y COLAPSO
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_anaphylaxis_shock',
    category: 'Shock / Vía Aérea',
    code: 'ERC-2025 CASO 2',
    title: 'Shock Anafiláctico Grave con Estridor y Colapso',
    description: 'Mujer de 32 años tras ingesta alimentaria/fármaco. Presenta de forma súbita habones urticarianos pruriginosos generalizados, angioedema labial y lingual, disnea asfíctica con estridor inspiratorio y colapso hipotensivo 78/48 mmHg. Shock distributivo con compromiso de vía aérea.',
    tags: ['Anafilaxia', 'Adrenalina IM', 'Estridor', 'Angioedema', 'Shock Distributivo', 'Vía Aérea'],
    initialVitals: {
      rhythm: 'sinus_tachy',
      hr: 122,
      spo2: 90,
      bpSys: 78,
      bpDia: 48,
      rr: 28,
      etco2: 44,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    suggestAirway: 'airway_edema_severe',
    suggestAuscultation: 'stridor',
    guidedSteps: [
      {
        id: 'step_anaf_01',
        phase: '1. Reconocimiento Precoz',
        title: '¿El alumno reconoce los signos de anafilaxia grave con riesgo vital inminente (A-B-C)?',
        description: 'La anafilaxia se define por afectación multisistémica de rápida instauración tras exposición alérgena: vía aérea (estridor), respiratorio (disnea/sibilancias) y circulatorio (shock/hipotensión).',
        instructorAction: 'Exponer: "Estridor laríngeo inspiratorio audible, rash urticariano con prurito y TA 78/48". Preguntar: "¿Diagnóstico y prioridad?"',
        expectedAction: 'Reconocer anafilaxia con compromiso de vía aérea alta y shock distributivo.',
        hint: 'Pista clínica: Estridor + Habones + Hipotensión = Shock anafiláctico grave con indicación de adrenalina inmediata.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Diagnóstico precoz acertado: Shock anafiláctico grado IV que requiere tratamiento inmediato.'
        },
        onSkip: {
          vitalsChange: { bpSys: 70, bpDia: 42, spo2: 86 },
          message: '⚠️ La demora diagnóstica permite que el edema laríngeo progrese hacia la obstrucción completa de la vía aérea.'
        }
      },
      {
        id: 'step_anaf_02',
        phase: '2. Fármaco de 1ª Elección',
        title: '¿El alumno administra ADRENALINA 0.5 mg IM en cara anterolateral del muslo de inmediato?',
        description: 'La adrenalina IM es el único tratamiento que salva vidas en la anafilaxia. Dosis adultos: 0.5 mg (0.5 mL 1:1000) IM en muslo. Los antihistamínicos y corticoides NO deben retrasarla.',
        instructorAction: 'La enfermera simula: "¿Doctor, le preparo primero Polaramine y Urbasón IV para no usar adrenalina?"',
        expectedAction: 'Ordenar de inmediato ADRENALINA 0.5 mg IM en el muslo. Rechazar esperar a corticoides.',
        hint: 'Pista vital: ADRENALINA 0.5 mg IM muslo (1:1000). Es el primer fármaco que debe entrar en el cuerpo del paciente.',
        onSuccess: {
          vitalsChange: { hr: 110, bpSys: 96, bpDia: 58, spo2: 94, rr: 22 },
          message: '✅ Adrenalina IM administrada: Estimulación alfa-1 vasoconstrictora y beta-2 broncodilatadora. Hemodinamia en ascenso.'
        },
        onSkip: {
          vitalsChange: { bpSys: 62, bpDia: 36, hr: 140, spo2: 82, rr: 34 },
          message: '❌ ERROR CRÍTICO: Usar antihistamínicos en vez de adrenalina no detiene el shock ni el edema de glotis. Deterioro asfíctico grave.'
        }
      },
      {
        id: 'step_anaf_03',
        phase: '3. Soporte Respiratorio y Posicionamiento',
        title: '¿El alumno aplica O2 de alto flujo con reservorio y mantiene posición decúbito supino?',
        description: 'Oxígeno a 15 L/min con mascarilla reservorio. Mantener al paciente tumbado con piernas elevadas si la disnea lo tolera. PROHIBIDO sentar o poner de pie por colapso cardíaco postural ("empty heart syndrome").',
        instructorAction: 'Observar cómo coloca al paciente y la mascarilla de oxígeno.',
        expectedAction: 'O2 a 15 L/min con reservorio + decúbito supino con piernas elevadas. Evitar ortostatismo.',
        hint: 'Pista de seguridad: NUNCA permitir que el paciente en anafilaxia se ponga de pie (riesgo de parada súbita por ventrículo vacío).',
        onSuccess: {
          vitalsChange: { spo2: 97 },
          message: '✅ Oxigenación óptima y protección frente a la pérdida de precarga por ortostatismo.'
        },
        onSkip: {
          vitalsChange: { bpSys: 55, bpDia: 30, spo2: 78, hr: 150 },
          message: '❌ El paciente se desvanece por caída brusca del retorno venoso al adoptar bipedestación o sedestación forzada.'
        }
      },
      {
        id: 'step_anaf_04',
        phase: '4. Reposición de Volumen Intravascular',
        title: '¿El alumno canaliza VVP gruesa e infunde un bolo rápido de cristaloides (500-1000 ml SF)?',
        description: 'La fuga capilar masiva puede secuestrar hasta el 35% del volumen intravascular en minutos. Se requiere reposición enérgica con cristaloides isotónicos.',
        instructorAction: '¿Qué volumen y fluido pauta para tratar la hipotensión refractaria?',
        expectedAction: 'Bolo de 500 a 1000 mL de suero salino fisiológico 0.9% o Ringer Lactato IV a chorro.',
        hint: 'Pista de reanimación: Cristaloides 500-1000 ml en infusión rápida para rellenar el lecho vascular dilatado.',
        onSuccess: {
          vitalsChange: { bpSys: 112, bpDia: 68, hr: 96 },
          message: '✅ Expansión intravascular eficaz: La presión arterial se normaliza a 112/68 mmHg y la taquicardia refleja cede.'
        },
        onSkip: {
          vitalsChange: { bpSys: 74, bpDia: 42 },
          message: '⚠️ Sin volumen rápido, la hipotensión distributiva persiste a pesar de la respuesta vasomotora a la adrenalina.'
        }
      },
      {
        id: 'step_anaf_05',
        phase: '5. Reevaluación a los 5 minutos',
        title: '¿El alumno reevalúa a los 5 minutos y conoce la pauta de repetir adrenalina IM si no hay mejoría?',
        description: 'Si tras 5 minutos persisten signos de shock o dificultad respiratoria, debe administrarse una segunda dosis de Adrenalina 0.5 mg IM en el muslo.',
        instructorAction: 'Han pasado 5 minutos desde la primera dosis. Preguntar: "¿Cómo reevalúa al paciente y qué haría si persiste estridor?"',
        expectedAction: 'Reevaluar ABCDE y saber que puede repetirse Adrenalina 0.5 mg IM a los 5 minutos si la respuesta es incompleta.',
        hint: 'Pista de algoritmo ERC: Repetir Adrenalina IM cada 5 minutos si los síntomas de vía aérea o shock no remiten.',
        onSuccess: {
          vitalsChange: { hr: 88, bpSys: 120, bpDia: 74, spo2: 98, rr: 18 },
          message: '✅ Reevaluación completada: La paciente muestra remisión completa del estridor, habones en regresión y hemodinámica estable.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ La falta de reevaluación protocolizada retrasa segundas dosis en pacientes con anafilaxia refractaria.'
        }
      },
      {
        id: 'step_anaf_06',
        phase: '6. Fármacos Coadyuvantes y Observación',
        title: '¿El alumno prescribe corticoides/antihistamínicos y pauta observación mínima de 6-8 horas?',
        description: 'Metilprednisolona 1-2 mg/kg IV + Dexclorfeniramina 5 mg IV lento. Ayudan a prevenir reacciones bifásicas (que ocurren en hasta el 20% de casos). Observación mínima 6-8 horas + autoinyector de adrenalina al alta.',
        instructorAction: 'Preguntar: "¿Qué medicación complementaria prescribe y cuál es el plan de observación y alta?"',
        expectedAction: 'Corticoides + antihistamínicos (segunda línea) + observación 6-8h + receta de autoinyector de adrenalina para el domicilio.',
        hint: 'Pista de prevención: Prevenir reacción bifásica con corticoides y observación hospitalaria prolongada.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Manejo impecable del shock anafiláctico conforme a la Guía ERC 2025!'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Alta precoz sin observación ni autoinyector expone a la paciente a muerte súbita por reacción bifásica tardía.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 3: TORSADES DE POINTES (TV POLIMÓRFICA) CON INESTABILIDAD
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_torsades_pointes',
    category: 'Arritmias Peri-Parada / Ventriculares',
    code: 'ERC-2025 CASO 3',
    title: 'Torsades de Pointes (TV Polimórfica Helicoidal)',
    description: 'Mujer de 58 años en tratamiento con psicofármacos y diuréticos con intervalo QT largo adquirido. Presenta episodios recurrentes de mareo presincopal y palpitaciones rápidas. Monitor muestra TV polimórfica continua (Torsades de Pointes) con rotación helicoidal de los complejos QRS. Presión 92/58 mmHg, hemodinámicamente inestable con pulso.',
    tags: ['Torsades de Pointes', 'TV Polimórfica', 'QT Largo', 'Sulfato de Magnesio', 'Desfibrilación', 'Amiodarona Contraindicada'],
    initialVitals: {
      rhythm: 'torsades',
      hr: 175,
      spo2: 94,
      bpSys: 92,
      bpDia: 58,
      rr: 22,
      etco2: 32,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    guidedSteps: [
      {
        id: 'step_torsades_01',
        phase: '1. Reconocimiento Electrocardiográfico',
        title: '¿El alumno identifica Torsades de Pointes / TV Polimórfica en el monitor?',
        description: 'La taquicardia ventricular polimórfica helicoidal (Torsades) se caracteriza por complejos QRS anchos que rotan periódicamente su eje y amplitud alrededor de la línea isoeléctrica.',
        instructorAction: 'Mostrar el trazado del monitor al alumno y preguntar: "¿Qué arritmia identifica y cuál es su morfología?"',
        expectedAction: 'Reconocer Taquicardia Ventricular Polimórfica / Torsades de Pointes.',
        hint: 'Pista ECG: Complejos QRS cambiantes con torsión sobre la línea de base a frecuencia rápida (Torsades de Pointes).',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Diagnóstico correcto: Torsades de Pointes, arritmia de alto riesgo arrítmico ligada a prolongación del intervalo QT.'
        },
        onSkip: {
          vitalsChange: { bpSys: 80, bpDia: 48, hr: 190 },
          message: '⚠️ Confundir la arritmia retrasa el tratamiento farmacológico específico y aumenta el riesgo de FV sin pulso.'
        }
      },
      {
        id: 'step_torsades_02',
        phase: '2. Valoración de Pulso e Inestabilidad',
        title: '¿El alumno comprueba inmediatamente la presencia de pulso carotídeo y signos de shock?',
        description: 'El abordaje depende de si hay pulso o no. Con pulso presente e inestabilidad (presión 92/58, presíncope) se requiere tratamiento médico-eléctrico emergente antes del colapso.',
        instructorAction: 'El alumno palpa pulso: "Pulso carotídeo palpable pero débil y muy rápido. Paciente obnubilada y pálida".',
        expectedAction: 'Confirmar pulso presente pero con signos de inestabilidad hemodinámica peri-parada.',
        hint: 'Pista clínica: Comprobar pulso central: si no hay pulso = algoritmo de parada cardíaca desfibrilable.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Situación clasificada: Taquicardia ventricular polimórfica inestable CON pulso. Alto riesgo de parada.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'vf_coarse', hr: 0, bpSys: 0, bpDia: 0, spo2: 0, rr: 0, etco2: 12 },
          message: '❌ La inacción causa colapso total: Degeneración a Fibrilación Ventricular (FV) sin pulso. ¡PARADA CARDÍACA!'
        }
      },
      {
        id: 'step_torsades_03',
        phase: '3. Fármaco de Elección: Magnesio IV',
        title: '¿El alumno administra SULFATO DE MAGNESIO 2 g (8 mmol) IV en infusión rápida (10-15 min)?',
        description: 'El sulfato de magnesio es el fármaco de primera línea para Torsades de Pointes, incluso con niveles normales de magnesio en sangre. Bloquea las postdespolarizaciones precoces.',
        instructorAction: 'Preguntar: "¿Cuál es el fármaco específico de primera elección para revertir y suprimir las Torsades de Pointes?"',
        expectedAction: 'Administrar Sulfato de Magnesio 2 g IV (diluido en 100 ml de SG5% o SF en 10-15 min, o bolo rápido si parada).',
        hint: 'Pista farmacológica: Sulfato de Magnesio 2 g IV. Es el único fármaco con indicación clase I en Torsades de Pointes.',
        onSuccess: {
          vitalsChange: { hr: 140, bpSys: 100, bpDia: 62 },
          message: '✅ Magnesio infundido: Estabilización de la membrana ventricular y supresión de las postdespolarizaciones precoces.'
        },
        onSkip: {
          vitalsChange: { bpSys: 70, bpDia: 40 },
          message: '⚠️ Sin magnesio, los episodios polimórficos continúan de forma repetitiva y prolongada.'
        }
      },
      {
        id: 'step_torsades_04',
        phase: '4. Contraindicación Crítica de Antiarrítmicos',
        title: '¿El alumno EVITA taxativamente la Amiodarona y antiarrítmicos que prolongan el QT?',
        description: 'La amiodarona, procainamida y fármacos de clases IA y III prolongan el intervalo QT y precipitan tormenta arrítmica o FV irreversible en pacientes con Torsades de Pointes.',
        instructorAction: 'La enfermera ofrece: "¿Le paso un bolo de 300 mg de amiodarona como en las otras taquicardias ventriculares?"',
        expectedAction: 'Rechazar tajantemente la Amiodarona porque empeora críticamente el QT largo.',
        hint: 'Pista de seguridad: NUNCA usar amiodarona en Torsades de Pointes ni en QT largo adquirido.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Decisión experta: Se evita la administración de un fármaco proarrítmico letal en este contexto.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'vf_coarse', hr: 0, bpSys: 0, bpDia: 0, spo2: 0, rr: 0, etco2: 10 },
          message: '❌ ERROR LETAL: Administró amiodarona. Se prolonga aún más el intervalo QT provocando Fibrilación Ventricular incoercible y PCR.'
        }
      },
      {
        id: 'step_torsades_05',
        phase: '5. Terapia Eléctrica de Rescate',
        title: '¿El alumno aplica choque asincrónico (desfibrilación 150-200 J) si persiste inestable o se deteriora?',
        description: 'En TV polimórfica, el desfibrilador suele ser incapaz de sincronizar con una onda R regular (el sincronizador salta o se bloquea). Si el paciente está inestable, se debe aplicar choque ASINCRÓNICO (desfibrilación).',
        instructorAction: 'La paciente sufre un síncope con PA 60/30 en el monitor. ¿Qué terapia eléctrica administra y en qué modo?',
        expectedAction: 'Desfibrilación asincrónica inmediata (150-200 J bifásico) cargando con palas o parches.',
        hint: 'Pista técnica: En TV polimórfica el modo sincronizado no suele disparar; utilizar choque ASINCRÓNICO (desfibrilación).',
        onSuccess: {
          vitalsChange: { rhythm: 'sinus', hr: 76, bpSys: 118, bpDia: 74, spo2: 98, rr: 16, etco2: 36 },
          message: '✅ Choque efectivo: Reversión inmediata a Ritmo Sinusal a 76 lpm. Presión arterial recuperada a 118/74 mmHg.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'vf_coarse', hr: 0, bpSys: 0, bpDia: 0 },
          message: '⚠️ Sin choque inmediato, la hipoperfusión cerebral induce paro anóxico y asistolia secundaria.'
        }
      },
      {
        id: 'step_torsades_06',
        phase: '6. Prevención de Recurrencias',
        title: '¿El alumno retira fármacos causales, corrige hipopotasemia (K > 4.5) y planifica sobreestimulación?',
        description: 'Retirar fármacos que alargan QT, reponer potasio (> 4.5 mEq/L) y si recurre bradicardia/pausas desencadenantes, considerar marcapasos transitorio de sobreestimulación (overdrive pacing a 90-100 ppm) o isoproterenol.',
        instructorAction: 'Preguntar: "¿Qué medidas adopta a continuación para evitar que la arritmia se repita?"',
        expectedAction: 'Suspender psicofármacos/fármacos QT-prolongadores + optimizar K+ > 4.5 + magnesio de mantenimiento + pacing si bradicardia.',
        hint: 'Pista etiológica: Retirar tóxicos causales, mantener potasio alto y sobreestimular con marcapasos si hay bradicardia.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Caso completado con máxima distinción clínica según el algoritmo ERC 2025!'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Sin corregir la hipopotasemia ni retirar fármacos, la arritmia recidivará en pocas horas.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 4: INTOXICACIÓN MIXTA (BZD, OPIOIDES Y ALCOHOL)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_mixed_intoxication',
    category: 'Toxicología / Depresión Respiratoria',
    code: 'ERC-2025 CASO 4',
    title: 'Intoxicación Mixta por Opioides, Benzodiacepinas y Alcohol',
    description: 'Varón de 40 años encontrado estuporoso en vía pública. Presenta bradipnea extrema a 6 rpm, saturación 84% con cianosis perioral, pupilas mióticas puntiformes de 1.5 mm bilaterales, hiporreflexia y Glasgow 5 (E1V1M3). Hipoventilación crítica de riesgo vital inminente.',
    tags: ['Intoxicación Mixta', 'Opioides', 'Naloxona Titulada', 'Flumazenilo Contraindicado', 'Ventilación Previa', 'Miosis'],
    initialVitals: {
      rhythm: 'sinus',
      hr: 58,
      spo2: 84,
      bpSys: 96,
      bpDia: 58,
      rr: 6,
      etco2: 58,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    suggestPupils: { leftSize: 1.5, leftReactive: true, rightSize: 1.5, rightReactive: true },
    guidedSteps: [
      {
        id: 'step_intox_01',
        phase: '1. Prioridad Vía Aérea y Ventilación (A-B)',
        title: '¿El alumno abre la vía aérea y VENTILA con bolsa-mascarilla con O2 al 100% ANTES de buscar fármacos?',
        description: 'La causa inmediata de muerte en sobredosis de depresores es la hipoxia cerebral y la parada cardiorrespiratoria por acidosis respiratoria. La ventilación asistida con balón-mascarilla debe preceder a la farmacoterapia.',
        instructorAction: 'Paciente cianótico con FR 6 y SpO2 84%. Observar si coge la bolsa-reservorio de ventilación o si busca antídotos.',
        expectedAction: 'Ventilar activamente con bolsa-mascarilla (Ambú) con reservorio a 15 L/min inmediatamente.',
        hint: 'Pista de prioridad A-B: La hipoxemia mata en minutos. Ventilar al paciente primero antes de perder tiempo preparando fármacos.',
        onSuccess: {
          vitalsChange: { spo2: 93, etco2: 50 },
          message: '✅ Excelente abordaje ABC: La ventilación manual oxigena los tejidos y estabiliza al paciente antes de la farmacoterapia.'
        },
        onSkip: {
          vitalsChange: { spo2: 74, hr: 40, rhythm: 'sinus_brady' },
          message: '❌ ERROR GRAVE: Retrasar la ventilación para preparar antídotos provoca hipoxemia severa, bradicardia extrema y riesgo de parada.'
        }
      },
      {
        id: 'step_intox_02',
        phase: '2. Reconocimiento del Toxíndrome Opioide',
        title: '¿El alumno explora las pupilas, detecta miosis puntiforme e identifica toxíndrome opioide?',
        description: 'La tríada clásica de depresión del SNC, bradipnea/apnea y miosis puntiforme (< 2 mm) es diagnóstica de intoxicación por opioides y guía el uso de naloxona.',
        instructorAction: 'Si explora pupilas: "Pupilas mióticas puntiformes de 1.5 mm simétricas, escasamente reactivas".',
        expectedAction: 'Identificar el toxíndrome opioide como factor reversible prioritario.',
        hint: 'Pista clínica: Pupilas puntiformes + depresión respiratoria = Sobredosis de opioides confirmada.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Toxíndrome opioide identificado con precisión como diana terapéutica inicial.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Omitir la exploración pupilar conduce a diagnósticos erróneos y dilata el tratamiento específico.'
        }
      },
      {
        id: 'step_intox_03',
        phase: '3. Titulación de Naloxona a Dosis Bajas',
        title: '¿El alumno administra Naloxona IV TITULADA a dosis bajas (100 - 200 mcg cada 60-90 segundos)?',
        description: 'El objetivo de la naloxona NO es despertar al paciente por completo, sino restaurar una ventilación espontánea adecuada (FR >= 10-12 rpm). Bolos altos (> 0.8-2 mg) provocan síndrome de abstinencia fulminante, vómitos masivos y edema agudo de pulmón no cardiogénico.',
        instructorAction: '¿Qué dosis de naloxona prescribe y cuál es el objetivo clínico buscado?',
        expectedAction: 'Naloxona 100-200 mcg (0.1-0.2 mg) IV cada 60-90 segundos hasta recuperar FR >= 10-12 rpm.',
        hint: 'Pista de titulación: Naloxona en bolos bajos de 100-200 mcg. Objetivo: recuperar respiración espontánea, NO despertar con agitación.',
        onSuccess: {
          vitalsChange: { rr: 12, spo2: 96, hr: 68, etco2: 44, bpSys: 108, bpDia: 66 },
          message: '✅ Titulación magistral: El paciente reanuda ventilación espontánea eficaz (12 rpm) sin vómitos ni abstinencia agresiva.'
        },
        onSkip: {
          vitalsChange: { hr: 135, bpSys: 165, bpDia: 105, rr: 28, spo2: 88 },
          message: '❌ Bolo excesivo (2 mg IV rápido): Despertar súbito con vómitos masivos, agitación violenta, síndrome de abstinencia y broncoaspiración.'
        }
      },
      {
        id: 'step_intox_04',
        phase: '4. Contraindicación de Flumazenilo',
        title: '¿El alumno EVITA taxativamente el Flumazenilo por riesgo de convulsiones refractarias?',
        description: 'En intoxicaciones mixtas (benzodiacepinas + alcohol o fármacos potencialmente proconvulsivantes como antidepresivos), el flumazenilo desencadena convulsiones intratables por abstinencia aguda de BZD y arritmias ventriculares.',
        instructorAction: 'El acompañante dice: "También se tomó varias cajas de pastillas para dormir y whisky". La enfermera: "¿Le ponemos flumazenilo para despertarle del todo?"',
        expectedAction: 'Rechazar absolutamente el flumazenilo. El soporte ventilatorio es suficiente para las benzodiacepinas; el flumazenilo tiene alto riesgo letal.',
        hint: 'Pista de seguridad ERC: FLUMAZENILO CONTRAINDICADO en intoxicaciones mixtas o pacientes con consumo habitual de benzodiacepinas.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Decisión de máxima seguridad: Se previene la aparición de estatus epiléptico convulsivo refractario.'
        },
        onSkip: {
          vitalsChange: { hr: 145, bpSys: 150, bpDia: 95, rr: 8, spo2: 80 },
          message: '❌ ERROR CRÍTICO: Administró flumazenilo. El paciente desencadena convulsiones tónico-clónicas generalizadas refractarias.'
        }
      },
      {
        id: 'step_intox_05',
        phase: '5. Vigilancia de la Renarcotización',
        title: '¿El alumno pauta observación continua de al menos 4-6 horas por la corta vida media de la naloxona?',
        description: 'La vida media de la naloxona es de 30 a 60 minutos, mientras que la mayoría de los opioides duran de 3 a 6 horas (o más con metadona/fentanilo). Al agotarse el antídoto, el paciente recae en coma y apnea.',
        instructorAction: 'El paciente ventila bien y balbucea. Preguntar: "¿Le damos el alta voluntaria o qué plan de vigilancia establece?"',
        expectedAction: 'Mantener en observación monitorizada continua un mínimo de 4 a 6 horas y preparar bomba de perfusión o dosis de rescate.',
        hint: 'Pista farmacocinética: La naloxona dura menos que el opioide. Riesgo elevado de parada respiratoria tardía por renarcotización.',
        onSuccess: {
          vitalsChange: { rr: 14, spo2: 98, hr: 72, bpSys: 118, bpDia: 74, etco2: 38 },
          message: '🎉 ¡Caso resuelto con éxito! Paciente protegido, ventilación asegurada y protocolo toxicológico completado.'
        },
        onSkip: {
          vitalsChange: { rr: 5, spo2: 82, hr: 50 },
          message: '⚠️ Alta prematura: A los 45 minutos la naloxona se metaboliza y el paciente vuelve a entrar en coma apneico en la sala de espera.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 5: BLOQUEO AV DE 2º GRADO MOBITZ II CON BRADICARDIA CRÍTICA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_mobitz2_block',
    category: 'Cardiovascular / Marcapasos',
    code: 'ERC-2025 CASO 5',
    title: 'Bloqueo AV de 2º Grado Mobitz II con Riesgo de Asistolia',
    description: 'Varón de 74 años con mareos de giro intensos, síncope al esfuerzo e hipotensión arterial (84/50 mmHg). ECG muestra bradicardia a 36 lpm con Bloqueo AV 2º grado Mobitz II (intervalo PR constante en latidos conducidos y pausas de 3 a 4 segundos por ondas P súbitamente bloqueadas). Alto riesgo inminente de asistolia o parada.',
    tags: ['Mobitz II', 'Marcapasos Transcutáneo', 'Bradicardia Sintomática', 'Captura Eléctrica y Mecánica', 'Atropina Ineficaz'],
    initialVitals: {
      rhythm: 'av_block_2_2',
      hr: 36,
      spo2: 94,
      bpSys: 84,
      bpDia: 50,
      rr: 16,
      etco2: 33,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    pacerCaptureThresholdMa: 60,
    guidedSteps: [
      {
        id: 'step_mobitz_01',
        phase: '1. Reconocimiento Electrocardiográfico del Mobitz II',
        title: '¿El alumno distingue Mobitz II de Mobitz I y reconoce el alto riesgo de asistolia?',
        description: 'A diferencia de Mobitz I (Wenckebach, nodal, benigno), el Mobitz II es un bloqueo infranodal (haz de His o ramas) con PR fijo y fallo súbito. Tiene indicación de marcapasos por riesgo inminente de parada.',
        instructorAction: 'Preguntar: "¿Qué tipo de bloqueo AV observa y cuál es su implicación clínica y pronóstica?"',
        expectedAction: 'Identificar Bloqueo AV 2º grado Mobitz II y reconocer alto riesgo de progresión a bloqueo completo o asistolia.',
        hint: 'Pista de ECG: Intervalo PR constante antes de las ondas P que se bloquean súbitamente (Mobitz II).',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Diagnóstico preciso: Mobitz II infranodal de alto riesgo arrítmico. Indicación formal de marcapasos.'
        },
        onSkip: {
          vitalsChange: { bpSys: 76, bpDia: 46, hr: 32 },
          message: '⚠️ Confundir con Mobitz I lleva a infraestimar el peligro y demorar la preparación del marcapasos.'
        }
      },
      {
        id: 'step_mobitz_02',
        phase: '2. Colocación Inmediata de Parches de Marcapasos',
        title: '¿El alumno coloca de inmediato los parches de marcapasos transcutáneo en el tórax?',
        description: 'En bradicardia con signos adversos (shock, síncope, hipotensión) y ritmos con riesgo de asistolia (Mobitz II, BAV 3º con QRS ancho), se deben colocar los electrodos de marcapasos de inmediato.',
        instructorAction: 'El paciente se queja de mareo intenso y palidez con PA 84/50. Observar si prepara los parches adhesivos.',
        expectedAction: 'Colocar parches multifunción en posición antero-posterior (o antero-apical) y conectarlos al desfibrilador.',
        hint: 'Pista de equipo: Colocar parches de marcapasos transcutáneo de inmediato en stand-by antes de que ocurra la asistolia.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Parches colocados y conectados precozmente. Preparado para estimulación eléctrica de rescate.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'av_block_3', hr: 24, bpSys: 60, bpDia: 35 },
          message: '❌ El ritmo degenera a Bloqueo AV Completo con escape idioventricular a 24 lpm e hipotensión profunda por retrasar los parches.'
        }
      },
      {
        id: 'step_mobitz_03',
        phase: '3. Prueba de Atropina sin Retrasar el Marcapasos',
        title: '¿El alumno sabe que la Atropina rara vez es eficaz en Mobitz II y no demora el marcapasos?',
        description: 'La atropina actúa a nivel del nodo AV y tiene escasa o nula respuesta en bloqueos infranodales (Mobitz II). Puede intentarse una dosis de 0.5 mg IV pero NUNCA demorar la estimulación eléctrica externa.',
        instructorAction: 'El alumno administra Atropina 0.5 mg IV. "¿Ha aumentado la frecuencia ventricular tras la atropina?"',
        expectedAction: 'Saber que la atropina no suele funcionar en Mobitz II y pasar de inmediato al marcapasos externo.',
        hint: 'Pista farmacológica: Atropina ineficaz en bloqueos infranodales. No perder tiempo esperando repeticiones de dosis.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Atropina sin efecto (esperable en Mobitz II). El alumno no pierde tiempo y activa el marcapasos externo.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'asystole', hr: 0, bpSys: 0, bpDia: 0 },
          message: '❌ Esperar dosis repetidas de atropina mientras el paciente sufre una pausa asistólica prolongada y síncope.'
        }
      },
      {
        id: 'step_mobitz_04',
        phase: '4. Activación y Titulación del Marcapasos (mA)',
        title: '¿El alumno activa el marcapasos a 60-70 ppm y titula corriente (mA) hasta captura eléctrica?',
        description: 'Girar selector a Marcapasos, frecuencia a 60-70 ppm, e incrementar paulatinamente los miliamperios (mA) hasta que cada espícula vaya seguida de un complejo QRS ancho y onda T (umbral 60 mA).',
        instructorAction: 'El alumno activa el modo marcapasos. Preguntar: "¿Qué frecuencia fija y cómo gradúa la corriente?"',
        expectedAction: 'Fijar 60-70 ppm y subir intensidad desde 30-40 mA hasta lograr captura eléctrica a 60 mA (+ 10% margen de seguridad).',
        hint: 'Pista técnica: Seleccionar modo MARCAPASOS a 60-70 ppm y elevar mA hasta ver espícula seguida de QRS ancho.',
        onSuccess: {
          vitalsChange: { rhythm: 'pacing_capture', hr: 70, bpSys: 115, bpDia: 70, spo2: 98 },
          message: '✅ Captura eléctrica conseguida a 60 mA: Espícula nítida antes de cada complejo QRS ancho.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'pacing_fail', hr: 36, bpSys: 78, bpDia: 46 },
          message: '⚠️ Fallo de captura: Corriente insuficiente (< 60 mA). Las espículas se disparan sin producir contracción miocárdica.'
        }
      },
      {
        id: 'step_mobitz_05',
        phase: '5. Verificación de la Captura Mecánica',
        title: '¿El alumno comprueba la CAPTURA MECÁNICA palpando el pulso periférico (femoral/radial)?',
        description: 'La captura eléctrica en pantalla no garantiza pulso mecánico. Se debe palpar pulso femoral o radial (evitar el carotídeo porque la contracción de la musculatura del cuello inducida por el marcapasos puede simular pulso falso).',
        instructorAction: '¿Cómo comprueba que el corazón está bombeando sangre con la estimulación eléctrica?',
        expectedAction: 'Palpar pulso periférico (femoral o radial) simultáneo con las espículas del monitor.',
        hint: 'Pista de seguridad: NUNCA palpar pulso carotídeo para verificar captura mecánica (el espasmo muscular del cuello engaña). Palpar femoral o radial.',
        onSuccess: {
          vitalsChange: { bpSys: 124, bpDia: 76, hr: 70 },
          message: '✅ Captura mecánica confirmada: Pulso femoral lleno y rítmico a 70 lpm. Presión arterial recuperada a 124/76 mmHg.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Asumir captura mecánica solo por ver el ECG sin palpar pulso periférico es un error crítico de monitorización.'
        }
      },
      {
        id: 'step_mobitz_06',
        phase: '6. Sedoanalgesia y Traslado para Marcapasos Definitivo',
        title: '¿El alumno administra sedoanalgesia para el dolor y contacta con UCI/Cardiología?',
        description: 'La estimulación transcutánea es dolorosa por la contracción muscular del tórax. Se requiere fentanilo/midazolam a dosis bajas tituladas y traslado para implante de marcapasos endocavitario urgente.',
        instructorAction: 'El paciente consciente manifiesta dolor intenso por los impulsos eléctricos.',
        expectedAction: 'Administrar analgesia/sedación (fentanilo + midazolam) y activar traslado urgente para marcapasos definitivo.',
        hint: 'Pista de confort y destino: Sedoanalgesia compasiva precoz y derivación urgente a Hemodinámica/UCI.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Excelente manejo del Mobitz II conforme al protocolo oficial de bradiarritmias ERC 2025!'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Mantener marcapasos transcutáneo en paciente despierto sin analgesia provoca dolor intolerable y agitación.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 6: EMBOLIA PULMONAR DE ALTO RIESGO (TEP MASIVO CON SHOCK)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_pulmonary_embolism',
    category: 'Respiratorio / Shock Obstructivo',
    code: 'ERC-2025 CASO 6',
    title: 'Embolia Pulmonar de Alto Riesgo (TEP Masivo con Shock)',
    description: 'Mujer de 66 años intervenida de prótesis total de cadera hace 10 días. Presenta disnea súbita catastrófica, dolor torácico pleurítico e hipotensión arterial (82/52 mmHg). Taquicardia sinusal a 128 lpm, saturación 88% con O2 a 15 L/min con mascarilla con reservorio, ingurgitación yugular y patrón S1Q3T3. Shock obstructivo por claudicación aguda del ventrículo derecho.',
    tags: ['TEP de Alto Riesgo', 'Shock Obstructivo', 'S1Q3T3', 'Restricción Hídrica', 'Noradrenalina', 'Fibrinólisis'],
    initialVitals: {
      rhythm: 'sinus_tachy',
      hr: 128,
      spo2: 88,
      bpSys: 82,
      bpDia: 52,
      rr: 30,
      etco2: 22,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    guidedSteps: [
      {
        id: 'step_tep_01',
        phase: '1. Reconocimiento de TEP de Alto Riesgo',
        title: '¿El alumno identifica TEP de alto riesgo por la presencia de shock obstructivo?',
        description: 'La presencia de inestabilidad hemodinámica (PAS < 90 mmHg o shock) define el TEP como de "Alto Riesgo" (masivo), con mortalidad precoz > 30% y necesidad de reperfusión urgente.',
        instructorAction: 'Presentar caso: "Disnea súbita, taquicardia 128 lpm, PAS 82 mmHg y cirugía ortopédica reciente". Preguntar categoría de riesgo.',
        expectedAction: 'Diagnosticar TEP de alto riesgo / masivo con shock obstructivo.',
        hint: 'Pista clínica: Hipotensión + Disnea súbita + Factor de riesgo = TEP de alto riesgo (candidato a fibrinólisis).',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Clasificación correcta: TEP de alto riesgo. Se activa inmediatamente el protocolo de reperfusión emergente.'
        },
        onSkip: {
          vitalsChange: { bpSys: 74, bpDia: 46, hr: 135 },
          message: '⚠️ No catalogar como alto riesgo retrasa el tratamiento fibrinolítico y conduce al fallo irreversible del VD.'
        }
      },
      {
        id: 'step_tep_02',
        phase: '2. Manejo de Fluidos: RESTRICCIÓN HÍDRICA',
        title: '¿El alumno EVITA administrar sobrecargas masivas de fluidos (> 500 ml) para no colapsar el VD?',
        description: 'En el fallo agudo del ventrículo derecho por TEP masivo, los bolos masivos de fluidos aumentan la dilatación del VD, desvían el tabique interventricular hacia la izquierda, comprimen el VI y empeoran drásticamente el shock (interdependencia ventricular). Límite estricto: <= 500 mL.',
        instructorAction: 'La enfermera pregunta: "Está hipotensa a 82/52, ¿le pongo un suero de 2000 ml a chorro rápido?"',
        expectedAction: 'Rechazar la sobrecarga hídrica masiva. Limitar a un bolo prudente de como máximo 500 mL de cristaloides.',
        hint: 'Pista fisiopatológica: NUNCA encharcar el ventrículo derecho. Máximo 500 ml de cristaloides; el exceso colapsa el corazón izquierdo.',
        onSuccess: {
          vitalsChange: { bpSys: 86, bpDia: 54 },
          message: '✅ Decisión experta: Se evita la sobredistensión aguda del ventrículo derecho y el colapso del VI.'
        },
        onSkip: {
          vitalsChange: { bpSys: 64, bpDia: 38, hr: 142, spo2: 82 },
          message: '❌ ERROR GRAVE: Infundió 2000 ml. El tabique interventricular protruye hacia el VI, el gasto cardíaco cae a plomo y la TA baja a 64/38 mmHg.'
        }
      },
      {
        id: 'step_tep_03',
        phase: '3. Soporte Vasopresor con Noradrenalina',
        title: '¿El alumno inicia Noradrenalina precoz para restaurar la PAM > 65 mmHg y perfundir el VD?',
        description: 'La noradrenalina eleva la presión aórtica, restaurando el gradiente de perfusión coronaria hacia la pared libre isquémica del ventrículo derecho y mejorando la contractilidad inotrópica.',
        instructorAction: 'La presión arterial se mantiene límite. ¿Qué soporte hemodinámico utiliza de elección?',
        expectedAction: 'Iniciar perfusión de Noradrenalina IV titulada para objetivo de PAM >= 65 mmHg.',
        hint: 'Pista vasopresora: Noradrenalina IV para restablecer la perfusión de las coronarias del ventrículo derecho.',
        onSuccess: {
          vitalsChange: { bpSys: 98, bpDia: 60, hr: 115 },
          message: '✅ Noradrenalina iniciada: PAM asciende a 73 mmHg, restaurando la perfusión miocárdica del VD claudicado.'
        },
        onSkip: {
          vitalsChange: { bpSys: 70, bpDia: 40 },
          message: '⚠️ Sin vasopresor, la isquemia miocárdica del ventrículo derecho se perpetúa en un círculo vicioso de muerte.'
        }
      },
      {
        id: 'step_tep_04',
        phase: '4. Anticoagulación Parenteral Inmediata',
        title: '¿El alumno administra Heparina no fraccionada en bolo IV (80 UI/kg)?',
        description: 'La Heparina no fraccionada (HNF) en bolo IV es la de elección en TEP de alto riesgo por su rápido inicio de acción y fácil reversibilidad con protamina si se requiere fibrinólisis o embolectomía quirúrgica.',
        instructorAction: '¿Qué fármaco anticoagulante pauta de inmediato mientras se prepara la reperfusión?',
        expectedAction: 'Heparina no fraccionada (HNF) bolo IV de 80 UI/kg (o 5000 UI) seguido de perfusión.',
        hint: 'Pista de anticoagulación: Heparina no fraccionada IV de elección en TEP inestable por su reversibilidad con protamina.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Anticoagulación iniciada precozmente: Se detiene la aposición de nuevo trombo en el lecho vascular pulmonar.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Omitir la heparina permite que el tromboembolismo continúe progresando.'
        }
      },
      {
        id: 'step_tep_05',
        phase: '5. Fibrinólisis Sistémica de Rescate',
        title: '¿El alumno indica y administra Fibrinólisis Sistémica de rescate (Alteplasa 100 mg / 50 mg)?',
        description: 'En el TEP de alto riesgo con shock, la fibrinólisis sistémica es el tratamiento de elección para restaurar la permeabilidad del árbol vascular pulmonar y evitar la parada cardíaca. Dosis: Alteplasa (r-tPA) 100 mg en 2h o 50 mg en 15 min si PCR inminente.',
        instructorAction: 'Paciente en shock persistente refractario. Preguntar: "¿Cuál es el tratamiento definitivo para desobstruir la arteria pulmonar?"',
        expectedAction: 'Indicar Fibrinólisis sistémica con Alteplasa (r-tPA) 100 mg IV (o 50 mg en bolo si parada).',
        hint: 'Pista de reperfusión: Fibrinólisis sistémica con r-tPA. Tratamiento de rescate de primera línea en TEP de alto riesgo.',
        onSuccess: {
          vitalsChange: { hr: 94, bpSys: 114, bpDia: 70, spo2: 95, rr: 20, etco2: 32 },
          message: '✅ Fibrinólisis infundida con éxito: La postcarga del VD cae bruscamente. Recuperación hemodinámica espectacular (114/70 mmHg).'
        },
        onSkip: {
          vitalsChange: { rhythm: 'pea_brady', hr: 32, bpSys: 0, bpDia: 0, spo2: 0, rr: 0, etco2: 12 },
          message: '❌ Sin fibrinólisis, el VD fracasa por completo: Parada cardíaca en Actividad Eléctrica Sin Pulso (AESP).'
        }
      },
      {
        id: 'step_tep_06',
        phase: '6. Ingreso en UCI y Vigilancia',
        title: '¿El alumno transfiere a UCI para vigilancia hemodinámica y control de sangrado?',
        description: 'Ingreso en UCI para monitorización intensiva, control de hemorragias mayores post-fibrinólisis y ecocardiograma de control para evaluar la función del ventrículo derecho.',
        instructorAction: 'Preguntar: "¿Cuál es el destino del paciente y qué complicaciones vigilará activamente?"',
        expectedAction: 'Ingreso en UCI, control neurológico y hematimétrico estricto y ecocardiograma de control.',
        hint: 'Pista de cuidados intensivos: Traslado a UCI y vigilancia estrecha de complicaciones hemorrágicas.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Caso completado con excelencia clínica según las recomendaciones ERC 2025!'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Falta de vigilancia en UCI compromete la detección temprana de hemorragia mayor.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 7: HIPOGLUCEMIA GRAVE CON ALTERACIÓN DE CONCIENCIA (GCS 7)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_severe_hypoglycemia',
    category: 'Metabólico / Coma',
    code: 'ERC-2025 CASO 7',
    title: 'Hipoglucemia Grave con Alteración de Conciencia (Glasgow 7)',
    description: 'Mujer de 54 años con diabetes tratada con insulina y sulfonilureas. Hallada en domicilio estuporosa, con sudoración profusa fría y pegajosa y palidez mucocutánea. Glucemia capilar de 38 mg/dl (2.1 mmol/L). Glasgow 7 (E2V2M3: no habla, localiza vagamente el dolor). Incapacidad absoluta para la deglución segura.',
    tags: ['Hipoglucemia', 'Glucosa IV', 'Glucagón', 'Contraindicación Vía Oral', 'Broncoaspiración', 'Coma'],
    initialVitals: {
      rhythm: 'sinus_tachy',
      hr: 104,
      spo2: 96,
      bpSys: 118,
      bpDia: 70,
      rr: 16,
      etco2: 36,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    suggestPupils: { leftSize: 3.5, leftReactive: true, rightSize: 3.5, rightReactive: true },
    guidedSteps: [
      {
        id: 'step_hypo_01',
        phase: '1. Reconocimiento y Medición de Glucemia',
        title: '¿El alumno realiza tira de glucemia capilar inmediata ante paciente con Glasgow alterado?',
        description: 'La hipoglucemia es una causa metabólica reversible de coma y parada cardíaca (H de las 4H y 4T). Debe medirse de forma sistemática e inmediata en todo paciente con deterioro neurológico.',
        instructorAction: 'Paciente estuporosa con Glasgow 7. Preguntar: "¿Qué determinación rápida realiza dentro de la D del ABCDE?"',
        expectedAction: 'Realizar glucemia capilar inmediata + calcular escala de coma de Glasgow.',
        hint: 'Pista de ABCDE: En la D de Discapacidad neurológica, la glucemia capilar es mandatoria e inmediata.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Glucemia capilar medida: 38 mg/dl. Hipoglucemia grave neuroglucopénica confirmada.'
        },
        onSkip: {
          vitalsChange: { hr: 115, bpSys: 110, bpDia: 68 },
          message: '⚠️ Confundir con ictus o intoxicación sin medir glucemia prolonga el daño cerebral irreversible por neuroglucopenia.'
        }
      },
      {
        id: 'step_hypo_02',
        phase: '2. CONTRAINDICACIÓN DE LA VÍA ORAL',
        title: '¿El alumno EVITA administrar azúcares, zumos o geles por vía oral por riesgo de broncoaspiración?',
        description: 'En pacientes con alteración del nivel de conciencia (GCS < 9) o sin reflejo deglutorio protector, la administración oral de líquidos o alimentos está estrictamente PROHIBIDA por alto riesgo de broncoaspiración masiva y asfixia.',
        instructorAction: 'El familiar insiste: "Tengo un zumo con azúcar y miel, ¿se lo meto en la boca con una cucharita?"',
        expectedAction: 'Prohibir taxativamente la vía oral por riesgo de aspiración respiratoria.',
        hint: 'Pista de seguridad de vía aérea: NUNCA dar nada por boca a un paciente con bajo nivel de consciencia (GCS < 9).',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Excelente protección de la vía aérea: Se evita una broncoaspiración potencialmente letal.'
        },
        onSkip: {
          vitalsChange: { spo2: 76, rr: 30, hr: 130, rhythm: 'sinus_tachy' },
          message: '❌ ERROR GRAVE: El intento de administración oral provoca broncoaspiración masiva, tos inefectiva y desaturación a 76%.'
        }
      },
      {
        id: 'step_hypo_03',
        phase: '3. Aporte Parenteral: Glucosa Hipertónica IV',
        title: '¿El alumno canaliza VVP y administra Glucosa Hipertónica IV (100-200 ml al 10% o 50-100 ml al 20%)?',
        description: 'La vía intravenosa es el tratamiento de elección. Se prefiere Glucosa al 10% (100-200 mL) o al 20% (50-100 mL) en perfusión rápida frente a la clásica glucosa al 50% por menor riesgo de flebitis, necrosis tisular y rebote hiperglucémico.',
        instructorAction: 'Canalizada vía venosa periférica. ¿Qué concentración de glucosa y qué volumen pauta?',
        expectedAction: 'Glucosa al 10% (100-200 ml) o Glucosa al 20% (50-100 ml) IV en infusión rápida.',
        hint: 'Pista terapéutica: Glucosa hipertónica IV (100-200 ml de G10% o 50-100 ml de G20%) en infusión rápida.',
        onSuccess: {
          vitalsChange: { hr: 84, bpSys: 122, bpDia: 74, rr: 15 },
          message: '✅ Glucosa infundida: El aporte parenteral de glucosa normaliza la glucemia capilar en pocos minutos a 110 mg/dl.'
        },
        onSkip: {
          vitalsChange: { hr: 125, bpSys: 100, bpDia: 60 },
          message: '⚠️ Demorar la glucosa IV perpetúa el coma hipoglucémico y el riesgo de convulsiones.'
        }
      },
      {
        id: 'step_hypo_04',
        phase: '4. Alternativa sin Vía Venosa: Glucagón IM',
        title: '¿El alumno conoce y utiliza Glucagón 1 mg IM si no se logra acceso venoso inmediato?',
        description: 'Si no es posible canalizar una vía venosa periférica en menos de 1-2 minutos, debe administrarse Glucagón 1 mg por vía intramuscular o subcutánea para movilizar reservas hepáticas de glucógeno.',
        instructorAction: 'Simular: "Las venas están muy colapsadas y no se logra vía en 2 minutos. ¿Qué alternativa inmediata utiliza?"',
        expectedAction: 'Glucagón 1 mg IM (o subcutáneo) de rescate sin perder tiempo intentando vías complejas.',
        hint: 'Pista de rescate: Glucagón 1 mg IM cuando el acceso venoso no es inmediato.',
        onSuccess: {
          vitalsChange: { hr: 88, bpSys: 120, bpDia: 72 },
          message: '✅ Conocimiento farmacológico de rescate: Glucagón 1 mg IM administrado con éxito.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Desconocer la alternativa del glucagón IM hace perder minutos críticos intentando punciones infructuosas.'
        }
      },
      {
        id: 'step_hypo_05',
        phase: '5. Reevaluación de Glucemia y Conciencia a los 10-15 min',
        title: '¿El alumno reevalúa la glucemia capilar y el estado neurológico a los 10-15 minutos?',
        description: 'Se debe confirmar que la glucemia ha ascendido por encima de 90-100 mg/dl y que el paciente recupera el nivel de consciencia previo (Glasgow 15). Si persiste < 70 mg/dl, repetir bolo.',
        instructorAction: 'Han pasado 10 minutos desde el tratamiento. ¿Qué comprobación clínica realiza?',
        expectedAction: 'Repetir glucemia capilar y evaluar escala de Glasgow y orientación temporoespacial.',
        hint: 'Pista de control: Comprobar glucemia capilar de control a los 10-15 min y verificar despertar completo.',
        onSuccess: {
          vitalsChange: { hr: 74, bpSys: 124, bpDia: 76, spo2: 98, rr: 14, etco2: 37 },
          message: '✅ Reevaluación completada: Glucemia 118 mg/dl. Paciente totalmente despierta y orientada (Glasgow 15).'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ No reevaluar impide detectar hipoglucemias refractarias que necesitan segundos bolos de glucosa.'
        }
      },
      {
        id: 'step_hypo_06',
        phase: '6. Prevención de Recidivas y Hospitalización en Sulfonilureas',
        title: '¿El alumno administra hidratos complejos orales y hospitaliza a la paciente por toma de sulfonilureas?',
        description: 'Una vez despierta, ofrecer hidratos de carbono de absorción lenta. Las sulfonilureas tienen vidas medias largas (hasta 24-48h); el alta inmediata está contraindicada por riesgo de recaída comatosa en casa.',
        instructorAction: 'La paciente está perfecta y pide irse a casa. "¿Le da el alta o cuál es la indicación de ingreso?"',
        expectedAction: 'Ofrecer hidratos complejos vo + ingreso hospitalario en observación obligatoria por hipoglucemia inducida por sulfonilureas.',
        hint: 'Pista de disposición: Las sulfonilureas producen hipoglucemias prolongadas o recurrentes; requieren ingreso hospitalario.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Caso completado con rigor según el protocolo oficial ERC 2025!'
        },
        onSkip: {
          vitalsChange: { hr: 98, bpSys: 112, bpDia: 68 },
          message: '⚠️ Alta negligente: A las 4 horas en su domicilio, la paciente recae en coma hipoglucémico profundo.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 8: TAQUICARDIA SUPRAVENTRICULAR PAROXÍSTICA (TPSV) A 188 LPM
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_paroxysmal_svt',
    category: 'Arritmias Peri-Parada / Auriculares',
    code: 'ERC-2025 CASO 8',
    title: 'Taquicardia Supraventricular Paroxística (TPSV) a 188 lpm',
    description: 'Varón de 32 años sin cardiopatía conocida. Presenta inicio súbito de palpitaciones muy rápidas y regulares en reposo ("un vuelco en el pecho"), sensación de pulsación en cuello y ansiedad. Monitor muestra taquicardia regular de QRS estrecho (< 0.10s) a 188 lpm sin ondas P visibles. Presión arterial 96/62 mmHg, consciente y alerta (Glasgow 15). Paciente hemodinámicamente estable.',
    tags: ['TPSV', 'QRS Estrecho', 'Valsalva Modificada', 'Adenosina IV Rápida', 'Cardioversión Sincronizada', 'WPW'],
    initialVitals: {
      rhythm: 'svt',
      hr: 188,
      spo2: 98,
      bpSys: 96,
      bpDia: 62,
      rr: 22,
      etco2: 36,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    guidedSteps: [
      {
        id: 'step_svt_01',
        phase: '1. Evaluación de Criterios de Inestabilidad',
        title: '¿El alumno clasifica la taquicardia como QRS estrecho regular y descarta criterios de gravedad?',
        description: 'En el algoritmo de taquicardias ERC 2025, el primer paso es valorar signos de riesgo vital: ① Shock, ② Síncope, ③ Isquemia miocárdica, ④ Insuficiencia cardíaca aguda. Este paciente está estable (TA 96/62, sin dolor ni disnea grave).',
        instructorAction: 'Preguntar: "¿Qué tipo de taquicardia observa en el monitor y qué signos adversos de inestabilidad presenta el paciente?"',
        expectedAction: 'Confirmar taquicardia regular de QRS estrecho (< 120 ms) a 188 lpm y constatar estabilidad hemodinámica.',
        hint: 'Pista de algoritmo ERC: QRS estrecho regular sin signos de shock = proceder a maniobras vagales y adenosina.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Clasificación correcta: Taquicardia de QRS estrecho regular hemodinámicamente estable. Procede abordaje escalonado.'
        },
        onSkip: {
          vitalsChange: { bpSys: 90, bpDia: 58 },
          message: '⚠️ La falta de clasificación diagnóstica clara lleva a intervenciones precipitadas o demoras injustificadas.'
        }
      },
      {
        id: 'step_svt_02',
        phase: '2. Maniobra Vagal de 1ª Línea: Valsalva Modificada',
        title: '¿El alumno realiza la Maniobra de Valsalva Modificada (espiración 15s + 45º piernas)?',
        description: 'La Maniobra de Valsalva Modificada (ensayo REVERT) tiene una eficacia > 40% frente al 17% de la clásica: espiración forzada en decúbito (40 mmHg durante 15s en jeringa de 10 ml), seguido de colocación en supino con elevación pasiva de piernas a 45º durante 15s.',
        instructorAction: '¿Qué intervención no farmacológica de primera línea realiza y cómo la describe paso a paso?',
        expectedAction: 'Realizar la maniobra de Valsalva modificada con registro continuo en monitor ECG.',
        hint: 'Pista de técnica: Valsalva modificada: soplar 15s en jeringa y luego tumbar elevando las piernas 45º durante 15s.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Técnica de Valsalva modificada ejecutada a la perfección con monitorización continua (se simula fracaso en 1º intento para pasar a fármacos).'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Omitir las maniobras vagales priva al paciente de una técnica no invasiva altamente efectiva y segura.'
        }
      },
      {
        id: 'step_svt_03',
        phase: '3. Primera Dosis de Adenosina IV Rápida (6 mg)',
        title: '¿El alumno administra Adenosina 6 mg IV en bolo rápido (1-2s) proximal con lavado de 20 ml SF?',
        description: 'La adenosina tiene una vida media inferior a 10 segundos. Requiere canalizar vena grande proximal (fosa antecubital), inyección en bolo ultrarrápido (1-2s) e inmediatamente bolo de lavado con 20 mL de suero salino con elevación del brazo. Advertir de opresión precordial transitoria.',
        instructorAction: 'La maniobra vagal no revirtió la arritmia. "¿Qué fármaco administra, qué dosis y qué técnica de administración exige?"',
        expectedAction: 'Adenosina 6 mg IV rápida (< 2s) en vena antecubital + bolo lavado 20 ml SF + brazo elevado + avisar al paciente.',
        hint: 'Pista de administración: Adenosina 6 mg IV en bolo de 1-2 segundos + lavado inmediato con 20 ml de suero salino a chorro.',
        onSuccess: {
          vitalsChange: { rhythm: 'svt_adenosine', hr: 60, bpSys: 92, bpDia: 60 },
          message: '✅ Adenosina 6 mg administrada: Pausa transitoria y desaceleración en el monitor, pero la taquicardia reinicia a 188 lpm (requiere 2ª dosis).'
        },
        onSkip: {
          vitalsChange: { rhythm: 'svt', hr: 188, bpSys: 94, bpDia: 60 },
          message: '❌ ERROR DE TÉCNICA: Infundir la adenosina lentamente o por vía distal degrada el fármaco antes de alcanzar el nódulo AV.'
        }
      },
      {
        id: 'step_svt_04',
        phase: '4. Segunda Dosis de Adenosina (12 mg)',
        title: '¿El alumno administra Adenosina 12 mg IV en bolo rápido tras 1-2 minutos si persiste la TPSV?',
        description: 'Si la dosis de 6 mg no revierte la taquicardia tras 1-2 minutos, se administra un segundo bolo de 12 mg IV con la misma técnica de lavado rápido. (Si aún fallase, puede darse un tercer bolo de 12 mg).',
        instructorAction: 'La taquicardia persiste a 188 lpm tras la primera dosis. "¿Cuál es el siguiente paso farmacológico?"',
        expectedAction: 'Administrar Adenosina 12 mg IV en bolo ultrarrápido con lavado de 20 ml de SF.',
        hint: 'Pista de dosificación: Escalar a Adenosina 12 mg IV en bolo ultrarrápido con 20 ml de suero salino.',
        onSuccess: {
          vitalsChange: { rhythm: 'sinus', hr: 75, bpSys: 122, bpDia: 78, rr: 15, etco2: 38 },
          message: '✅ ¡Reversión exitosa! Pausa nodal breve en el monitor seguida de conversión inmediata a Ritmo Sinusal a 75 lpm con ondas P normales.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'svt', hr: 195, bpSys: 84, bpDia: 52 },
          message: '⚠️ Sin escalado de dosis, la taquicardia persistente agota la reserva hemodinámica y deteriora la presión arterial.'
        }
      },
      {
        id: 'step_svt_05',
        phase: '5. Seguridad Eléctrica: Cardioversión SINCRONIZADA',
        title: '¿El alumno sabe que si el paciente se vuelve inestable requiere Cardioversión SINCRONIZADA?',
        description: 'Si en cualquier momento el paciente desarrolla signos adversos (shock, dolor anginoso, pérdida de consciencia), se debe realizar Cardioversión Eléctrica SINCRONIZADA (70-120 J bifásico) con botón SINCRO activado para no descargar sobre la onda T.',
        instructorAction: 'Simular: "Si el paciente súbitamente se desmayase con PA 65/40, ¿qué terapia eléctrica aplicaría y qué botón debe verificar en el monitor?"',
        expectedAction: 'Cardioversión eléctrica SINCRONIZADA (70-120 J) con el botón SINCRO activado en el panel.',
        hint: 'Pista de desfibrilador: Verificar SIEMPRE el modo SINCRO activo (marcas en ondas R) para evitar inducir Fibrilación Ventricular.',
        onSuccess: {
          vitalsChange: { rhythm: 'sinus', hr: 72, bpSys: 120, bpDia: 76 },
          message: '✅ Conocimiento de seguridad fundamental: Sincronización verificada antes de la descarga en paciente inestable.'
        },
        onSkip: {
          vitalsChange: { rhythm: 'vf_coarse', hr: 0, bpSys: 0, bpDia: 0 },
          message: '❌ Descarga ASINCRÓNICA sobre la onda T (fenómeno de R sobre T) desencadena Fibrilación Ventricular y parada cardíaca letal.'
        }
      },
      {
        id: 'step_svt_06',
        phase: '6. ECG de 12 Derivaciones en Ritmo Sinusal',
        title: '¿El alumno realiza un ECG de 12 derivaciones en ritmo sinusal para descartar preexcitación (WPW)?',
        description: 'Tras la cardioversión o reversión química, es imperativo registrar un ECG de 12 derivaciones en ritmo sinusal para descartar la presencia de onda delta y PR corto compatibles con síndrome de Wolff-Parkinson-White (WPW).',
        instructorAction: 'El paciente está asintomático en ritmo sinusal normal. "¿Qué prueba diagnóstica realiza ahora y qué busca?"',
        expectedAction: 'ECG de 12 derivaciones completo para evaluar PR corto y onda delta (síndrome de WPW).',
        hint: 'Pista de seguimiento: ECG de 12 derivaciones tras la reversión para descartar vía accesoria (WPW) que precise ablación.',
        onSuccess: {
          vitalsChange: null,
          message: '🎉 ¡Caso de taquicardia completado con máxima calificación clínica según la Guía ERC 2025!'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Omitir el ECG de 12 derivaciones en ritmo sinusal impide diagnosticar el síndrome de WPW subyacente.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 9: PARADA CARDIORRESPIRATORIA (PCR) — FV REFRACTARIA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_pcr_vf',
    category: 'Soporte Vital Avanzado / Parada',
    code: 'CÓDIGO PARADA',
    title: 'Parada Cardiorrespiratoria (PCR): Fibrilación Ventricular Refractaria',
    description: 'Varón de 59 años con desplome presenciado en vía pública. Sin pulso, sin respiración agónica. FV gruesa inicial que requiere desfibrilación inmediata, compresiones RCP de alta calidad, adrenalina tras 2º choque y amiodarona tras 3er choque.',
    tags: ['PCR', 'SVA', 'Desfibrilador', 'FV', 'RCP', 'Adrenalina', 'Amiodarona'],
    initialVitals: {
      rhythm: 'vf_coarse',
      hr: 0,
      spo2: 0,
      bpSys: 0,
      bpDia: 0,
      rr: 0,
      etco2: 12,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    pacerCaptureThresholdMa: 70,
    guidedSteps: [
      {
        id: 'step_pcr_01',
        phase: '1. Reconocimiento y Seguridad',
        title: '¿El alumno comprueba consciencia, respiración y pulso carotídeo en < 10 segundos?',
        description: 'Comprobar respuesta y respiración simultáneamente. Si no respira o solo boquea (gasping) y no hay pulso firme en 10s: CÓDIGO PARADA.',
        instructorAction: 'Paciente inconsciente en el suelo. Observar evaluación inicial y llamada de auxilio.',
        expectedAction: 'Comprobar ausencia de pulso en < 10s, pedir ayuda e iniciar RCP de alta calidad.',
        hint: 'Pista: Comprobación simultánea respiración y pulso carotídeo en menos de 10 segundos.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Parada cardiorrespiratoria confirmada. Inicio inmediato de algoritmo SVA.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Demora en el diagnóstico de PCR disminuye la probabilidad de supervivencia un 10% por minuto.'
        }
      },
      {
        id: 'step_pcr_02',
        phase: '2. Desfibrilación Precoz (1er Choque)',
        title: '¿El alumno administra 1er choque de 150-200 J bifásico inmediatamente y reanuda RCP?',
        description: 'En FV/TVSP, cada segundo de retraso en la desfibrilación reduce la supervivencia. Descargar y reanudar inmediatamente las compresiones durante 2 minutos.',
        instructorAction: 'El monitor muestra FV gruesa. ¿Qué energía selecciona y qué hace justo tras la descarga?',
        expectedAction: 'Cargar 150-200 J, seguridad ("¡fuera todos!"), descargar y reiniciar RCP 30:2 de inmediato.',
        hint: 'Pista: Desfibrilar sin demora y reanudar compresiones inmediatamente sin parar a palpar pulso.',
        onSuccess: {
          vitalsChange: { etco2: 20 },
          message: '✅ Descarga limpia administrada y RCP de calidad reanudada de inmediato.'
        },
        onSkip: {
          vitalsChange: { etco2: 8 },
          message: '❌ Parar compresiones tras la descarga o demorar el choque compromete la perfusión coronaria.'
        }
      },
      {
        id: 'step_pcr_03',
        phase: '3. Segundo Choque y Adrenalina',
        title: '¿El alumno administra 2º choque y Adrenalina 1 mg IV tras el segundo ciclo?',
        description: 'Tras 2 minutos de RCP, pausar brevemente (< 5s), comprobar ritmo: persiste FV. Segundo choque (150-200J) + Adrenalina 1 mg IV durante el ciclo.',
        instructorAction: 'Fin de 2 min de RCP: persiste FV. Observar secuencia de choque y fármaco.',
        expectedAction: '2º choque + reanudar RCP + Adrenalina 1 mg IV con lavado.',
        hint: 'Pista: Adrenalina 1 mg IV tras el segundo choque en ritmos desfibrilables, repitiendo cada 3-5 min.',
        onSuccess: {
          vitalsChange: { etco2: 24 },
          message: '✅ Adrenalina administrada y segundo choque completado.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Olvido de la adrenalina o retraso en su administración.'
        }
      },
      {
        id: 'step_pcr_04',
        phase: '4. Tercer Choque y Amiodarona',
        title: '¿El alumno administra 3er choque y Amiodarona 300 mg IV en bolo?',
        description: 'Tras el 3er choque en FV refractaria, se administra el primer antiarrítmico: Amiodarona 300 mg IV en bolo (o Lidocaína 100 mg).',
        instructorAction: 'Persiste FV tras 2 ciclos completos. ¿Qué antiarrítmico prescribe?',
        expectedAction: '3er choque + Amiodarona 300 mg IV bolo diluido en 20 ml SG5%.',
        hint: 'Pista: Amiodarona 300 mg tras el 3er choque en FV/TVSP refractaria.',
        onSuccess: {
          vitalsChange: { etco2: 28 },
          message: '✅ Amiodarona 300 mg administrada tras el tercer choque.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ No administrar amiodarona en FV refractaria reduce las tasas de recuperación de pulso.'
        }
      },
      {
        id: 'step_pcr_05',
        phase: '5. RCE (Recuperación de Circulación Espontánea)',
        title: '¿El alumno detecta RCE (salto brusco de EtCO2 > 40 mmHg y pulso palpable)?',
        description: 'La elevación brusca del EtCO2 por encima de 40 mmHg es el signo precoz más fiable de RCE. Comprobar pulso y ritmo organizado.',
        instructorAction: 'El EtCO2 salta bruscamente a 45 mmHg. Preguntar al alumno qué sospecha y qué maniobra realiza.',
        expectedAction: 'Identificar RCE por aumento de EtCO2, palpar pulso carotídeo y confirmar ritmo sinusal.',
        hint: 'Pista: Salto brusco de EtCO2 > 40 mmHg = Recuperación de Circulación Espontánea (RCE).',
        onSuccess: {
          vitalsChange: { rhythm: 'sinus', hr: 84, bpSys: 110, bpDia: 68, spo2: 96, rr: 14, etco2: 42 },
          message: '🎉 ¡RCE CONSEGUIDO! Ritmo Sinusal a 84 lpm, PA 110/68 mmHg y pulso carotídeo firme palpable.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ No advertir el salto de EtCO2 hace continuar compresiones innecesarias sobre corazón latiendo.'
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CASO 10: CÓDIGO SEPSIS CON SHOCK SÉPTICO
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sc_sepsis',
    category: 'Infección / Shock',
    code: 'CÓDIGO SEPSIS',
    title: 'Código Sepsis: Infección Urinaria con Shock Séptico',
    description: 'Mujer de 72 años con fiebre de 38.9°C, confusión mental aguda, taquipnea a 26 rpm e hipotensión 82/48 mmHg. Criterios de qSOFA 3/3. Sepsis de foco urológico con hipoperfusión tisular y shock séptico incipiente.',
    tags: ['Sepsis', 'Shock séptico', 'qSOFA', 'Lactato', 'Hemocultivos', 'Noradrenalina'],
    initialVitals: {
      rhythm: 'sinus_tachy',
      hr: 118,
      spo2: 92,
      bpSys: 82,
      bpDia: 48,
      rr: 26,
      etco2: 28,
      activeSensors: { ecg_leads: false, defib_pads: false, spo2: false, nibp: false, resp: false, etco2: false }
    },
    suggestPupils: { leftSize: 4, leftReactive: true, rightSize: 4, rightReactive: true },
    guidedSteps: [
      {
        id: 'step_sep_01',
        phase: '1. Reconocimiento qSOFA',
        title: '¿El alumno identifica criterios de sepsis mediante qSOFA (>= 2 criterios)?',
        description: 'qSOFA: ① Alteración del estado mental (Glasgow < 15), ② Frecuencia respiratoria >= 22 rpm, ③ Presión arterial sistólica <= 100 mmHg. Puntaje 3/3 = Alta sospecha de sepsis.',
        instructorAction: 'Preguntar: "¿Cuántos criterios qSOFA cumple y qué protocolo debe activarse?"',
        expectedAction: 'Calcular qSOFA 3/3 y activar CÓDIGO SEPSIS inmediatamente.',
        hint: 'Pista: qSOFA = GCS alterado + FR >= 22 + TAS <= 100.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ qSOFA 3/3 identificado: Código Sepsis activado.'
        },
        onSkip: {
          vitalsChange: { hr: 130, bpSys: 70, bpDia: 38 },
          message: '⚠️ Retrasar el diagnóstico permite que el shock séptico progrese a fracaso multiorgánico.'
        }
      },
      {
        id: 'step_sep_02',
        phase: '2. Hemocultivos y Lactato',
        title: '¿El alumno extrae hemocultivos ANTES de iniciar antibióticos y solicita lactato sérico?',
        description: 'Dos sets de hemocultivos antes de antibioterapia empírica. Determinación urgente de lactato sérico (marcador de hipoperfusión celular).',
        instructorAction: '¿Qué pruebas diagnósticas y analíticas urgentes solicita?',
        expectedAction: 'Hemocultivos x 2 sets antes de antibiótico + lactato sérico urgente.',
        hint: 'Pista: Hemocultivos SIEMPRE antes del antibiótico. Lactato > 2 mmol/L indica hipoperfusión.',
        onSuccess: {
          vitalsChange: null,
          message: '✅ Hemocultivos extraídos y lactato cursado (valor 3.8 mmol/L: shock séptico).'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ Administrar antibióticos antes de hemocultivos negativiza los cultivos en el 50% de los casos.'
        }
      },
      {
        id: 'step_sep_03',
        phase: '3. Antibiótico Precoz (< 1h)',
        title: '¿El alumno prescribe antibiótico de amplio espectro en la primera hora ("Hour-1 Bundle")?',
        description: 'Piperacilina-tazobactam o Cefepima IV en menos de 60 minutos del reconocimiento. Cada hora de demora incrementa la mortalidad.',
        instructorAction: '¿Qué antibiótico elige y en qué plazo debe estar infundiéndose?',
        expectedAction: 'Antibiótico de amplio espectro IV en < 60 minutos.',
        hint: 'Pista: Antibiótico IV de amplio espectro en la primera hora ("Hour-1 Bundle").',
        onSuccess: {
          vitalsChange: { hr: 108, spo2: 94 },
          message: '✅ Antibiótico pautado e infundido en tiempo récord.'
        },
        onSkip: {
          vitalsChange: { hr: 138, bpSys: 68, bpDia: 35, spo2: 88 },
          message: '❌ Retrasar el antibiótico más de 1 hora incrementa sustancialmente la mortalidad.'
        }
      },
      {
        id: 'step_sep_04',
        phase: '4. Reanimación Inicial con Fluidos',
        title: '¿El alumno inicia fluidoterapia con cristaloides a 30 ml/kg en las primeras 3 horas?',
        description: 'Cristaloides isotónicos (SF 0.9% o Ringer) a 30 mL/kg (aprox. 2000 mL para 70 kg) en perfusión rápida, reevaluando respuesta hemodinámica.',
        instructorAction: '¿Qué volumen de fluidos indica para la reanimación inicial?',
        expectedAction: 'Cristaloides isotónicos 30 mL/kg en < 3 horas con reevaluación continua.',
        hint: 'Pista: 30 ml/kg de cristaloides IV guiado por objetivos hemodinámicos.',
        onSuccess: {
          vitalsChange: { hr: 96, bpSys: 98, bpDia: 58, spo2: 96 },
          message: '✅ Reanimación hídrica adecuada: Presión arterial en ascenso.'
        },
        onSkip: {
          vitalsChange: { hr: 145, bpSys: 62, bpDia: 30, spo2: 85 },
          message: '❌ Sin reposición de volumen, el shock hipovolémico/distributivo se hace refractario.'
        }
      },
      {
        id: 'step_sep_05',
        phase: '5. Vasopresores si PAM < 65 mmHg',
        title: '¿El alumno inicia Noradrenalina si la PAM persiste < 65 mmHg tras fluidoterapia?',
        description: 'Noradrenalina es el vasopresor de 1ª elección en shock séptico para mantener PAM >= 65 mmHg y perfusión de órganos diana.',
        instructorAction: 'PAM permanece en 56 mmHg tras 1500 ml de suero. ¿Qué fármaco inicia?',
        expectedAction: 'Noradrenalina IV en perfusión continua titulada para PAM >= 65 mmHg.',
        hint: 'Pista: Noradrenalina de primera línea para mantener PAM >= 65 mmHg.',
        onSuccess: {
          vitalsChange: { bpSys: 110, bpDia: 68, hr: 88 },
          message: '✅ Noradrenalina iniciada: PAM 82 mmHg. Perfusión tisular preservada.'
        },
        onSkip: {
          vitalsChange: { hr: 158, bpSys: 55, bpDia: 25 },
          message: '⚠️ Retrasar los vasopresores en shock dependiente perpetúa la hipoperfusión multiorgánica.'
        }
      },
      {
        id: 'step_sep_06',
        phase: '6. Monitorización y Control de Foco',
        title: '¿El alumno pauta sondaje vesical para control de diuresis y deriva a UCI?',
        description: 'Sondaje vesical (objetivo diuresis > 0.5 mL/kg/h), control de aclaramiento de lactato a las 2-4 horas y traslado a UCI.',
        instructorAction: 'Preguntar monitorización de diuresis y destino final de la paciente.',
        expectedAction: 'Sondaje vesical + control de lactato + traslado a UCI.',
        hint: 'Pista: Diuresis horaria + lactato de control a las 2h + ingreso en UCI.',
        onSuccess: {
          vitalsChange: { hr: 82, spo2: 97, bpSys: 114, bpDia: 70, rr: 18 },
          message: '🎉 ¡Código Sepsis completado con éxito! Respuesta clínica y hemodinámica favorable.'
        },
        onSkip: {
          vitalsChange: null,
          message: '⚠️ La falta de monitorización de diuresis impide detectar fracaso renal agudo precoz.'
        }
      }
    ]
  }
];


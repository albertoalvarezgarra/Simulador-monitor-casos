/**
 * Motor Electrocardiográfico y de Señales Fisiológicas en Tiempo Real
 * Simulación matemática vectorial rigurosa según la Ley de Einthoven (AHA / ERC / ESC).
 * Propiedad de Alberto Á. Garra
 */

class EcgEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Configuración de pantalla y barrido
    this.width = canvas.width;
    this.height = canvas.height;
    this.sweepX = 0;
    this.sweepSpeed = 2.2;
    this.gapWidth = 18;

    // Estado fisiológico inicial (SENSORES DESACTIVADOS POR DEFECTO)
    this.state = {
      rhythm: 'sinus',
      hr: 75,
      spo2: 98,
      bpSys: 120,
      bpDia: 80,
      rr: 16,
      etco2: 38,
      temp: 36.6,
      lead: 'II', // 'I', 'II', 'III', 'palas'
      gain: 1.0,
      syncMode: false,
      artifact: 'none',
      patientCategory: 'adult',
      // Marcapasos transcutáneo
      pacerActive: false,
      pacerRate: 60,
      pacerCurrentMa: 0,
      pacerMode: 'demand',
      pacerCaptureThresholdMa: 50, // Umbral de captura configurable por el instructor
      // Sensores independientes (conectados por defecto en monitorización estándar)
      activeSensors: {
        ecg_leads: true,  // Latiguillos I, II, III
        defib_pads: true, // Palas manuales o parches de desfibrilación
        spo2: true,
        nibp: true,
        resp: true,
        etco2: true
      }
    };

    this.time = 0;
    this.beatPhase = 0;
    this.nextBeatInterval = 60 / 75;
    this.torsadesAngle = 0;
    this.cprPhase = 0;
    this.sinusArrestUntil = 0;
    
    this.onQrsDetected = null;

    this.prevEcgY = null;
    this.prevPlethY = null;
    this.prevRespY = null;

    this.updateChannelLayout();
  }

  updateChannelLayout() {
    this.ch1Top = 0;
    this.ch1Height = this.height * 0.44; // Canal 1: ECG (I, II, III o Palas)
    this.ch2Top = this.ch1Height;
    this.ch2Height = this.height * 0.28; // Canal 2: SpO2
    this.ch3Top = this.ch2Top + this.ch2Height;
    this.ch3Height = this.height * 0.28; // Canal 3: FR / Capnografía
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.updateChannelLayout();
    this.sweepX = 0;
    this.prevEcgY = null;
    this.prevPlethY = null;
    this.prevRespY = null;
    this.ctx.fillStyle = '#06090e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  setState(newState) {
    if (!newState) return;
    const oldHr = this.state.hr;
    this.state = { ...this.state, ...newState };
    if (newState.activeSensors) {
      this.state.activeSensors = { ...this.state.activeSensors, ...newState.activeSensors };
    }
    if (this.state.hr !== oldHr && this.state.hr > 0) {
      this.nextBeatInterval = 60 / Math.max(20, Math.min(300, this.state.hr));
    }
  }

  /**
   * Generación de la muestra de ECG según derivación seleccionada y Ley de Einthoven
   */
  sampleEcg(lead, rhythm, phase, dt) {
    // 1. Verificación de conexión según tipo de sensor:
    // Las derivaciones I, II, III requieren "ecg_leads" (latiguillos).
    // La derivación Palas requiere "defib_pads" (palas/parches).
    if (lead === 'palas') {
      if (!this.state.activeSensors.defib_pads) {
        return (Math.random() - 0.5) * 0.02; // Línea plana si las palas no están apoyadas
      }
    } else {
      if (!this.state.activeSensors.ecg_leads) {
        return (Math.random() - 0.5) * 0.02; // Línea plana si los latiguillos no están puestos
      }
    }

    if (this.state.artifact === 'loose_lead') {
      return (Math.random() - 0.5) * 1.6 + Math.sin(this.time * 2.2) * 0.8;
    }

    // 2. ARTEFACTO DE RCP (COMPRESIONES TORÁCICAS A 100 CPM)
    let cprArtifact = 0;
    if (rhythm === 'cpr_artifact') {
      // Compresiones mecánicas rítmicas a 1.7 Hz (102 compresiones por minuto)
      const cprFreq = 1.7;
      const cprTime = this.time * cprFreq * Math.PI * 2;
      // Onda de compresión profunda con rebote elástico
      cprArtifact = (Math.sin(cprTime) * 1.4) + (Math.sin(cprTime * 2) * 0.45) + ((Math.random() - 0.5) * 0.15);
    }

    let baselineNoise = (this.state.artifact === 'tremor') ? (Math.random() - 0.5) * 0.28 : (Math.random() - 0.5) * 0.015;

    // Si hay paro sinusal activo
    if (rhythm === 'sinus_arrest' && this.time < this.sinusArrestUntil) {
      return baselineNoise + cprArtifact;
    }

    // 3. MODELADO VECTORIAL EINTHOVEN PARA CADA DERIVACIÓN
    let sample = 0;

    switch (rhythm) {
      case 'cpr_artifact':
        // Fondo de asistolia o FV fina bajo las compresiones
        sample = (Math.sin(this.time * 18) * 0.12) + cprArtifact;
        break;

      case 'sinus':
      case 'sinus_tachy':
      case 'sinus_brady':
      case 'sinus_arrhythmia':
      case 'sinus_arrest':
        sample = this.generateEinthovenSinus(lead, phase, 0, 0);
        if (rhythm === 'sinus_arrest' && Math.random() < 0.08 && this.time > this.sinusArrestUntil) {
          this.sinusArrestUntil = this.time + 2.8;
        }
        break;

      case 'stemi_inferior':
        // SCACEST INFERIOR (II, III, aVF con espejo en I)
        // En DIII: elevación ST máxima (+4.5 mm)
        // En DII: elevación ST marcada (+3.5 mm)
        // En DI: INFRADESNIVEL RECÍPROCO (-2.5 mm)
        sample = this.generateStemiInferiorByLead(lead, phase);
        break;

      case 'stemi_anterior':
        // SCACEST ANTERIOR (V1-V4, I, aVL con espejo en III)
        // En DI: supradesnivel (+2.6 mm)
        // En DII: isoeléctrico o leve elevación (+0.6 mm)
        // En DIII: INFRADESNIVEL RECÍPROCO (-2.0 mm)
        sample = this.generateStemiAnteriorByLead(lead, phase);
        break;

      case 'stemi_posterior':
        // En DII/DIII: cambios discretos o elevación leve; en precordiales espejo
        sample = this.generateEinthovenSinus(lead, phase, -0.25, 0);
        break;

      case 'nstemi_diffuse':
        // SCASEST: Infradesnivel difuso en I y II
        sample = this.generateNstemiByLead(lead, phase);
        break;

      case 'stemi_pvc':
        if (Math.floor(this.time / 3.5) % 2 === 1 && phase > 0.35 && phase < 0.8) {
          sample = this.generatePvcComplex(phase, lead);
        } else {
          sample = this.generateStemiInferiorByLead(lead, phase);
        }
        break;

      case 'afib':
      case 'afib_controlled':
      case 'afib_slow':
        const fWave = (Math.sin(this.time * 36) * 0.08) + (Math.sin(this.time * 24 + 0.4) * 0.06) + ((Math.random() - 0.5) * 0.05);
        sample = this.generateEinthovenSinus(lead, phase, 0, 0, true) + fWave;
        break;

      case 'aflutter_2_1':
      case 'aflutter_variable':
        // En DII y DIII las ondas F en sierra son muy prominentes
        const flutterFactor = (lead === 'II' || lead === 'III' || lead === 'palas') ? 0.42 : 0.18;
        const saw = ((this.time * 5.0) % 1.0) * flutterFactor - (flutterFactor / 2);
        sample = this.generateQrsOnly(phase, lead) + saw;
        break;

      case 'svt':
        sample = this.generateEinthovenSinus(lead, phase, -0.05, 0, true);
        break;

      case 'junctional':
      case 'junctional_escape':
        sample = this.generateJunctionalEscape(phase, lead);
        break;

      case 'idioventricular':
      case 'accelerated_idioventricular':
        sample = this.generateIdioventricular(phase, lead);
        break;

      case 'av_block_1':
        sample = this.generateEinthovenSinus(lead, phase, 0, 0.10); // PR largo (+100ms)
        break;

      case 'av_block_2_1':
        sample = this.generateWenckebach(lead, phase);
        break;

      case 'av_block_2_2':
      case 'av_block_2_high':
        sample = (Math.floor(this.time / 2.0) % 2 === 0) ? this.generateEinthovenSinus(lead, phase, 0, 0) : this.generatePWaveOnly(phase);
        break;

      case 'av_block_3':
        sample = this.generateAvBlock3(lead, phase);
        break;

      case 'rbbb':
        sample = this.generateRbbbByLead(lead, phase);
        break;

      case 'lbbb':
        sample = this.generateLbbbByLead(lead, phase);
        break;

      case 'af_wpw':
        // FA con preexcitación (FBI: Fast, Broad, Irregular)
        sample = this.generatePvcComplex(phase, lead) * 0.95 + (Math.sin(this.time * 26) * 0.08);
        break;

      case 'svt_adenosine':
        // Simulación de conversión por adenosina: taquicardia rápida -> pausa asistólica transitoria -> ritmo sinusal
        const cycle = this.time % 14;
        if (cycle < 4.5) {
          sample = this.generateEinthovenSinus(lead, (this.time * 3.3) % 1.0, 0, -0.05);
        } else if (cycle < 7.5) {
          sample = this.generatePWaveOnly(phase * 1.4) + (Math.random() - 0.5) * 0.02;
        } else {
          sample = this.generateEinthovenSinus(lead, phase, 0, 0);
        }
        break;

      case 'av_block_2_2':
      case 'mobitz_2':
        // Bloqueo Mobitz II: PR constante y caída brusca periódica del QRS
        const mobitzIdx = Math.floor(this.time / this.nextBeatInterval) % 3;
        if (mobitzIdx === 2) {
          sample = this.generatePWaveOnly(phase);
        } else {
          sample = this.generateEinthovenSinus(lead, phase, 0, 0);
        }
        break;

      case 'vt':
        sample = this.generateVtComplex(phase, lead);
        break;

      case 'torsades':
        sample = this.generateTorsadesComplex(phase, lead, dt);
        break;

      case 'vf_coarse':
        sample = Math.sin(this.time * 17) * 0.46 + Math.sin(this.time * 29 + 1.2) * 0.36 + (Math.random() - 0.5) * 0.38;
        break;

      case 'vf_fine':
        sample = Math.sin(this.time * 23) * 0.13 + Math.sin(this.time * 33) * 0.10 + (Math.random() - 0.5) * 0.10;
        break;

      case 'asystole':
        sample = (Math.random() - 0.5) * 0.03 + Math.sin(this.time * 0.3) * 0.02;
        break;

      case 'pea_brady':
        sample = this.generatePvcComplex(phase * 0.85, lead);
        break;

      case 'pvc_bigeminy':
        const isOdd = Math.floor(this.time / this.nextBeatInterval) % 2 === 1;
        sample = isOdd ? this.generatePvcComplex(phase, lead) : this.generateEinthovenSinus(lead, phase, 0, 0);
        break;

      case 'pacing_capture':
        sample = this.generatePacingSpike(phase, lead, true);
        break;

      case 'pacing_fail':
        sample = this.generatePacingSpike(phase, lead, false);
        break;

      default:
        sample = this.generateEinthovenSinus(lead, phase, 0, 0);
    }

    // Si el modo marcapasos físico está activo en el monitor y emitiendo corriente:
    if (this.state.pacerActive && this.state.pacerCurrentMa > 0) {
      const hasCap = (this.state.pacerCurrentMa >= (this.state.pacerCaptureThresholdMa || 50));
      sample = this.generatePacingSpike(phase, lead, hasCap);
    }

    if (lead === 'palas') {
      // Señal de palas: mayor ganancia y pequeña deriva de contacto
      sample = (sample * 1.25) + (Math.sin(this.time * 2.8) * 0.05);
    }

    return (sample * this.state.gain) + baselineNoise;
  }

  /**
   * Genera complejo Sinusal con cálculo vectorial exacto según la Ley de Einthoven:
   * Eje eléctrico medio a +60º: Lead II es la máxima proyección; Lead I es menor; Lead III = II - I.
   */
  generateEinthovenSinus(lead, p, stShift = 0, prExtra = 0, suppressP = false) {
    let rAmp = 1.25;
    let pAmp = 0.16;
    let sAmp = 0.30;
    let tAmp = 0.28;

    if (lead === 'I') {
      rAmp = 0.85; // Proyección en 0º
      pAmp = 0.12;
      sAmp = 0.15;
      tAmp = 0.22;
    } else if (lead === 'III') {
      rAmp = 0.65; // Proyección en +120º
      pAmp = 0.08;
      sAmp = 0.40;
      tAmp = 0.14;
    } else if (lead === 'palas') {
      rAmp = 1.35;
      pAmp = 0.18;
      sAmp = 0.35;
      tAmp = 0.30;
    }

    let y = 0;
    // Onda P
    if (!suppressP) {
      const pCenter = 0.14 - prExtra;
      if (p >= pCenter - 0.05 && p <= pCenter + 0.05) {
        const u = (p - pCenter) / 0.05;
        y += Math.exp(-u * u * 4) * pAmp;
      }
    }
    // Onda Q
    if (p >= 0.23 && p <= 0.26) {
      y -= Math.exp(-Math.pow((p - 0.245) / 0.015, 2) * 5) * 0.10;
    }
    // Onda R
    if (p >= 0.25 && p <= 0.30) {
      y += Math.exp(-Math.pow((p - 0.272) / 0.016, 2) * 6) * rAmp;
    }
    // Onda S
    if (p >= 0.285 && p <= 0.33) {
      y -= Math.exp(-Math.pow((p - 0.305) / 0.02, 2) * 5) * sAmp;
    }
    // Segmento ST & Onda T
    if (p >= 0.32 && p <= 0.62) {
      const tVal = Math.exp(-Math.pow((p - 0.46) / 0.09, 2) * 3) * (tAmp + Math.max(0, stShift));
      let stLevel = 0;
      if (stShift !== 0 && p >= 0.31 && p <= 0.44) {
        stLevel = stShift * Math.sin(((p - 0.31) / 0.13) * (Math.PI / 2));
      }
      y += tVal + stLevel;
    }
    return y;
  }

  /**
   * IAMCEST INFERIOR POR DERIVACIÓN:
   * DIII: Supradesnivel marcado (+4.5 mm)
   * DII: Supradesnivel marcado (+3.5 mm)
   * DI: Infradesnivel especular recíproco (-2.5 mm)
   * Palas: Elevación similar a DII
   */
  generateStemiInferiorByLead(lead, p) {
    if (lead === 'III') {
      return this.generateEinthovenSinus('III', p, 0.52); // +5.2mm ST en DIII
    } else if (lead === 'II' || lead === 'palas') {
      return this.generateEinthovenSinus('II', p, 0.40); // +4.0mm ST en DII
    } else if (lead === 'I') {
      // INFRADESNIVEL RECÍPROCO EN DI
      return this.generateEinthovenSinus('I', p, -0.32);
    }
    return this.generateEinthovenSinus('II', p, 0.40);
  }

  /**
   * IAMCEST ANTERIOR POR DERIVACIÓN:
   * DI: Supradesnivel (+2.6 mm)
   * DII: Isoeléctrico (+0.6 mm)
   * DIII: Infradesnivel recíproco (-2.2 mm)
   */
  generateStemiAnteriorByLead(lead, p) {
    if (lead === 'I') {
      return this.generateEinthovenSinus('I', p, 0.35); // Supradesnivel en cara lateral alta
    } else if (lead === 'III') {
      return this.generateEinthovenSinus('III', p, -0.28); // Descenso especular en DIII
    } else {
      return this.generateEinthovenSinus('II', p, 0.08); // Casi isoeléctrico en DII
    }
  }

  generateNstemiByLead(lead, p) {
    const depth = (lead === 'II' || lead === 'palas') ? -0.30 : (lead === 'I' ? -0.22 : -0.15);
    return this.generateEinthovenSinus(lead, p, depth);
  }

  generateRbbbByLead(lead, p) {
    let y = 0;
    if (p >= 0.09 && p <= 0.19) y += Math.exp(-Math.pow((p - 0.14) / 0.05, 2) * 4) * 0.15;
    if (p >= 0.24 && p <= 0.27) y += Math.exp(-Math.pow((p - 0.255) / 0.014, 2) * 5) * 0.65;
    if (p >= 0.265 && p <= 0.295) y -= 0.25;
    if (p >= 0.29 && p <= 0.35) y += Math.exp(-Math.pow((p - 0.32) / 0.022, 2) * 5) * 1.15;
    if (p >= 0.42 && p <= 0.62) y -= Math.exp(-Math.pow((p - 0.52) / 0.08, 2) * 3) * 0.30;
    return y;
  }

  generateLbbbByLead(lead, p) {
    let y = 0;
    if (p >= 0.09 && p <= 0.19) y += Math.exp(-Math.pow((p - 0.14) / 0.05, 2) * 4) * 0.15;
    if (p >= 0.24 && p <= 0.42) {
      const u = (p - 0.33) / 0.08;
      y += (Math.sin(u * Math.PI) * 1.2) - (Math.cos(u * Math.PI * 2) * 0.35);
    }
    if (p >= 0.44 && p <= 0.66) {
      y -= Math.exp(-Math.pow((p - 0.54) / 0.09, 2) * 3) * 0.45;
    }
    return y;
  }

  generatePvcComplex(p, lead) {
    let y = 0;
    if (p >= 0.20 && p <= 0.44) {
      const u = (p - 0.30) / 0.09;
      y += (Math.sin(u * Math.PI) * 1.3) - (Math.cos(u * Math.PI * 2) * 0.4);
    }
    if (p >= 0.42 && p <= 0.70) {
      const u = (p - 0.54) / 0.10;
      y -= Math.exp(-u * u * 3) * 0.5;
    }
    return y;
  }

  generateQrsOnly(p, lead) {
    let y = 0;
    if (p >= 0.25 && p <= 0.30) y += Math.exp(-Math.pow((p - 0.272) / 0.016, 2) * 6) * 1.1;
    if (p >= 0.285 && p <= 0.33) y -= Math.exp(-Math.pow((p - 0.305) / 0.02, 2) * 5) * 0.25;
    if (p >= 0.35 && p <= 0.55) y += Math.exp(-Math.pow((p - 0.44) / 0.08, 2) * 3) * 0.2;
    return y;
  }

  generatePWaveOnly(p) {
    if (p >= 0.09 && p <= 0.19) {
      const u = (p - 0.14) / 0.05;
      return Math.exp(-u * u * 4) * 0.16;
    }
    return 0;
  }

  generateWenckebach(lead, p) {
    const beatIndex = Math.floor(this.time / this.nextBeatInterval) % 4;
    if (beatIndex === 3) return this.generatePWaveOnly(p);
    const extraPr = beatIndex * 0.045;
    return this.generateEinthovenSinus(lead, p, 0, extraPr);
  }

  generateAvBlock3(lead, p) {
    let y = 0;
    const pPhase = (this.time * (75 / 60)) % 1.0;
    if (pPhase >= 0.1 && pPhase <= 0.22) {
      const u = (pPhase - 0.16) / 0.05;
      y += Math.exp(-u * u * 4) * 0.18;
    }
    y += this.generatePvcComplex(p * 0.9, lead);
    return y;
  }

  generatePacingSpike(p, lead, hasCapture = true) {
    let y = 0;

    // Espícula del marcapasos: una sola línea vertical ultra-estrecha (<1ms)
    // En ritmo cardíaco: la fase va 0..1 en cada latido
    // La espícula ocupa una ventana mínima de fase para parecer una línea vertical
    if (p >= 0.220 && p < 0.2225) {
      // Pico único positivo del pulso de estimulación transcutánea
      // Sin rebound ni artefacto posterior
      y = 3.2;
    }

    if (hasCapture) {
      // Captura ventricular: complejo QRS ancho tipo BRI (estimulación apical derecha)
      // Empieza 20ms después del spike
      if (p >= 0.228 && p <= 0.52) {
        const u = (p - 0.375) / 0.145;
        y -= (Math.sin(u * Math.PI) * 1.3) + (Math.cos(u * Math.PI * 2) * 0.22);
      }
      // Onda T discordante (ancha y positiva en DII)
      if (p >= 0.50 && p <= 0.74) {
        const u = (p - 0.60) / 0.10;
        y += Math.exp(-u * u * 3.0) * 0.50;
      }
    }
    // Sin captura: solo la espícula, sin QRS posterior (ya está en el if de arriba)
    return y;
  }



  /**
   * Taquicardia Ventricular Monomórfica:
   * Complejo QRS ancho aberrante (>160ms), regular, con empastamiento inicial y onda T discordante
   */
  generateVtComplex(p, lead) {
    let y = 0;
    const polarity = (lead === 'I' || lead === 'palas') ? 1.0 : -1.0;
    if (p >= 0.15 && p <= 0.58) {
      const u = (p - 0.36) / 0.16;
      // QRS ancho monofásico con muesca típica en la cúspide (signo de Brugada / Josephson)
      const mainWave = Math.sin(u * Math.PI) * 1.45;
      const notch = Math.sin(u * Math.PI * 3) * 0.18;
      y += (mainWave + notch) * polarity;
    }
    // Repolarización ventricular secundaria discordante
    if (p >= 0.54 && p <= 0.88) {
      const u = (p - 0.70) / 0.14;
      y -= Math.exp(-u * u * 3.2) * 0.55 * polarity;
    }
    return y;
  }

  /**
   * Torsades de Pointes (TV Polimorfa con torsión helicoidal):
   * Modulación progresiva en huso sinusoidal continuo con inversión cíclica del eje
   */
  generateTorsadesComplex(p, lead, dt) {
    this.torsadesAngle += dt * 1.8;
    // Envolvente de torsión con ciclo de 4 a 6 segundos
    const envelope = Math.sin(this.torsadesAngle) * 1.35;
    const u = (p % 1.0) * Math.PI * 2;
    const polymorph = (Math.sin(u) * 0.95) + (Math.sin(u * 2 + 0.3) * 0.35);
    return polymorph * envelope + ((Math.random() - 0.5) * 0.05);
  }

  /**
   * Ritmo de Escape de la Unión AV:
   * QRS estrecho (<100ms), regular (40-60 lpm), con onda P retrógrada (negativa en II, III, aVF)
   */
  generateJunctionalEscape(p, lead) {
    let y = 0;
    const polarity = (lead === 'aVR') ? -1.0 : 1.0;
    // Onda P retrógrada: pequeña deflexión negativa inmediatamente antes del QRS (intervalo PR muy corto)
    if (p >= 0.22 && p <= 0.30) {
      const u = (p - 0.26) / 0.04;
      y -= Math.exp(-u * u * 3.5) * 0.16 * polarity;
    }
    // Complejo QRS estrecho fisiológico
    if (p >= 0.33 && p <= 0.43) {
      const u = (p - 0.37) / 0.035;
      if (u < -0.4) y -= 0.12 * polarity; // Q
      else if (u >= -0.4 && u <= 0.6) y += Math.cos(u * Math.PI) * 1.5 * polarity; // R
      else y -= 0.35 * polarity; // S
    }
    // Onda T concordante normal
    if (p >= 0.52 && p <= 0.72) {
      const u = (p - 0.61) / 0.075;
      y += Math.exp(-u * u * 2.8) * 0.32 * polarity;
    }
    return y;
  }

  /**
   * Ritmo Idioventricular de Escape (o RIVA):
   * QRS ancho y aberrante (>150ms), regular, lento (20-40 lpm o 60-100 en RIVA), sin ondas P y onda T discordante
   */
  generateIdioventricular(p, lead) {
    let y = 0;
    const polarity = (lead === 'aVR' || lead === 'III') ? -1.0 : 1.0;
    // Complejo QRS ancho y aberrante con muesca empastada
    if (p >= 0.20 && p <= 0.48) {
      const u = (p - 0.32) / 0.12;
      const mainQrs = Math.sin(u * Math.PI) * 1.55;
      const notch = Math.sin(u * Math.PI * 3.2) * 0.15;
      y += (mainQrs + notch) * polarity;
    }
    // Onda T discordante amplia (polaridad opuesta al QRS)
    if (p >= 0.48 && p <= 0.78) {
      const u = (p - 0.62) / 0.12;
      y -= Math.exp(-u * u * 3.0) * 0.45 * polarity;
    }
    return y;
  }

  samplePleth(phase) {
    if (!this.state.activeSensors.spo2 || this.state.spo2 <= 0) return 0;
    const perfFactor = Math.min(1.0, Math.max(0.15, (this.state.spo2 - 50) / 45));
    let y = 0;
    if (phase >= 0.28 && phase <= 0.46) {
      const u = (phase - 0.28) / 0.18;
      y = Math.sin(u * (Math.PI / 2));
    } else if (phase > 0.46 && phase <= 0.95) {
      const u = (phase - 0.46) / 0.49;
      const decay = Math.cos(u * (Math.PI / 2));
      const dicrotic = (phase >= 0.56 && phase <= 0.68) ? Math.sin(((phase - 0.56) / 0.12) * Math.PI) * 0.15 : 0;
      y = (decay * 0.9) + dicrotic;
    }
    return y * perfFactor;
  }

  sampleResp(respPhase) {
    if (!this.state.activeSensors.resp && !this.state.activeSensors.etco2) return 0;
    if (this.state.activeSensors.etco2) {
      const maxEtCO2 = (this.state.etco2 / 60);
      if (respPhase < 0.25 || respPhase > 0.75) return 0;
      else if (respPhase >= 0.25 && respPhase < 0.35) return ((respPhase - 0.25) / 0.10) * maxEtCO2 * 0.85;
      else if (respPhase >= 0.35 && respPhase <= 0.65) return (0.85 + ((respPhase - 0.35) / 0.30) * 0.15) * maxEtCO2;
      else if (respPhase > 0.65 && respPhase <= 0.75) return (1 - ((respPhase - 0.65) / 0.10)) * maxEtCO2;
      return 0;
    } else {
      return (Math.sin(respPhase * Math.PI * 2) * 0.5 + 0.5);
    }
  }

  renderStep(dt) {
    this.time += dt;

    const hasHeartActivity = this.state.hr > 0 && !['asystole', 'vf_coarse', 'vf_fine'].includes(this.state.rhythm);

    if (hasHeartActivity) {
      if (this.state.rhythm.startsWith('afib') && this.beatPhase >= 0.98) {
        const randomVariation = (Math.random() - 0.5) * 0.5;
        this.nextBeatInterval = (60 / this.state.hr) * (1 + randomVariation);
      }

      this.beatPhase += dt / this.nextBeatInterval;

      if (this.beatPhase >= 0.27 && this.beatPhase - (dt / this.nextBeatInterval) < 0.27) {
        if (this.onQrsDetected) {
          const hasEcgSource = (this.state.lead === 'palas' && this.state.activeSensors.defib_pads) ||
                               (this.state.lead !== 'palas' && this.state.activeSensors.ecg_leads);
          this.onQrsDetected(this.state.spo2, this.state.syncMode, this.sweepX, hasEcgSource ? 'ecg' : 'spo2');
        }
      }

      if (this.beatPhase >= 1.0) this.beatPhase = 0;
    } else {
      this.beatPhase = 0;
    }

    const rrInterval = (this.state.rr > 0) ? (60 / this.state.rr) : 10;
    const respPhase = (this.time / rrInterval) % 1.0;

    const ecgSample = this.sampleEcg(this.state.lead, this.state.rhythm, this.beatPhase, dt);
    const plethSample = this.samplePleth(this.beatPhase);
    const respSample = this.sampleResp(respPhase);

    const ecgMidY = this.ch1Top + (this.ch1Height * 0.52);
    const ecgY = ecgMidY - (ecgSample * (this.ch1Height * 0.38));

    const plethBaseY = this.ch2Top + (this.ch2Height * 0.82);
    const plethY = plethBaseY - (plethSample * (this.ch2Height * 0.65));

    const respBaseY = this.ch3Top + (this.ch3Height * 0.85);
    const respY = respBaseY - (respSample * (this.ch3Height * 0.68));

    const nextSweepX = (this.sweepX + this.sweepSpeed) % this.width;

    this.ctx.fillStyle = '#06090e';
    this.ctx.fillRect(nextSweepX, 0, this.gapWidth, this.height);
    this.drawBackgroundGridSlice(nextSweepX, this.gapWidth);

    if (nextSweepX < this.sweepX) {
      this.prevEcgY = null;
      this.prevPlethY = null;
      this.prevRespY = null;
    }

    // 1. Trazado Canal 1: ECG (Verde)
    const hasLeadSignal = (this.state.lead === 'palas' && this.state.activeSensors.defib_pads) ||
                          (this.state.lead !== 'palas' && this.state.activeSensors.ecg_leads);

    if (this.prevEcgY !== null) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.sweepX, this.prevEcgY);
      this.ctx.lineTo(nextSweepX, ecgY);
      this.ctx.strokeStyle = hasLeadSignal ? '#00ff66' : 'rgba(0, 255, 102, 0.15)';
      this.ctx.lineWidth = 2.4;
      this.ctx.stroke();

      if (hasLeadSignal && this.state.syncMode && this.beatPhase >= 0.265 && this.beatPhase <= 0.285) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(nextSweepX, ecgY - 14);
        this.ctx.lineTo(nextSweepX - 5, ecgY - 24);
        this.ctx.lineTo(nextSweepX + 5, ecgY - 24);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // 2. Trazado Canal 2: SpO2 (Cian)
    if (this.prevPlethY !== null) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.sweepX, this.prevPlethY);
      this.ctx.lineTo(nextSweepX, plethY);
      this.ctx.strokeStyle = this.state.activeSensors.spo2 ? '#00f0ff' : 'rgba(0, 240, 255, 0.15)';
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();
    }

    // 3. Trazado Canal 3: Respiración (Amarillo)
    if (this.prevRespY !== null) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.sweepX, this.prevRespY);
      this.ctx.lineTo(nextSweepX, respY);
      this.ctx.strokeStyle = (this.state.activeSensors.resp || this.state.activeSensors.etco2) ? '#ffd700' : 'rgba(255, 215, 0, 0.15)';
      this.ctx.lineWidth = 2.0;
      this.ctx.stroke();
    }

    this.sweepX = nextSweepX;
    this.prevEcgY = ecgY;
    this.prevPlethY = plethY;
    this.prevRespY = respY;
  }

  drawBackgroundGridSlice(startX, width) {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, this.ch1Height);
    this.ctx.lineTo(startX + width, this.ch1Height);
    this.ctx.moveTo(startX, this.ch1Height + this.ch2Height);
    this.ctx.lineTo(startX + width, this.ch1Height + this.ch2Height);
    this.ctx.stroke();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EcgEngine };
}

/**
 * Sintetizador de Sonidos MÃ©dicos Philips Efficia DFM100 mediante Web Audio API
 * AcÃºstica suave de grado clÃ­nico con volumen optimizado y atenuado.
 * Propiedad de Alberto Ã. Garra
 */

class PhilipsAudioSynth {
  constructor() {
    this.ctx = null;
    this.isAudioEnabled = false;
    this.isMuted = false;
    this.alarmMutedUntil = 0;
    this.isCharging = false;
    this.isCharged = false;
    this.chargeOsc = null;
    this.chargeGain = null;
    this.chargedOsc = null;
    this.activeAlarmInterval = null;

    // Control de volumen maestro atenuado (45% del nivel estÃ¡ndar para mayor realismo y confort en aula)
    this.masterVolume = 0.45;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isAudioEnabled = true;
    this.isMuted = false;
  }

  muteAll() {
    this.isMuted = true;
    this.stopDefibrillatorCharging();
    this.stopAuscultation();
    if (this.ctx && this.ctx.state === 'running') {
      try { this.ctx.suspend(); } catch(e) {}
    }
  }

  unmuteAll() {
    this.isMuted = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch(e) {}
    }
  }

  /**
   * Beep de QRS con modulaciÃ³n de frecuencia segÃºn SpO2
   * AcÃºstica suave y no estridente
   */
  playQrsBeep(spo2 = 98) {
    if (!this.isAudioEnabled || this.isMuted || !this.ctx) return;

    const clampedSpo2 = Math.max(65, Math.min(100, spo2));
    const minFreq = 380;
    const maxFreq = 840;
    const freq = minFreq + Math.pow((clampedSpo2 - 65) / 35, 1.3) * (maxFreq - minFreq);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Envolvente suave, volumen moderado
    const targetGain = 0.08 * this.masterVolume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(targetGain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Alarma acÃºstica de alta prioridad Philips (atenuada)
   */
  playHighPriorityAlarm() {
    if (!this.isAudioEnabled || !this.ctx) return;
    if (Date.now() < this.alarmMutedUntil) return;

    const notes = [880, 880, 880, 698, 880];
    const step = 0.10;
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + (idx * step);

      osc.type = 'sine'; // Sine mÃ¡s suave que triangle
      osc.frequency.setValueAtTime(freq, t);

      const targetGain = 0.12 * this.masterVolume;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(targetGain, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + step - 0.01);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + step);
    });
  }

  startAlarmLoop() {
    if (this.activeAlarmInterval) clearInterval(this.activeAlarmInterval);
    this.playHighPriorityAlarm();
    this.activeAlarmInterval = setInterval(() => {
      this.playHighPriorityAlarm();
    }, 3200);
  }

  stopAlarmLoop() {
    if (this.activeAlarmInterval) {
      clearInterval(this.activeAlarmInterval);
      this.activeAlarmInterval = null;
    }
  }

  silenceAlarmsFor2Minutes() {
    this.alarmMutedUntil = Date.now() + (2 * 60 * 1000);
    this.stopAlarmLoop();
  }

  unsilenceAlarms() {
    this.alarmMutedUntil = 0;
  }

  toggleAlarmSilence() {
    if (this.isAlarmSilenced()) {
      this.unsilenceAlarms();
      return false; // ahora no silenciado
    } else {
      this.silenceAlarmsFor2Minutes();
      return true; // ahora silenciado
    }
  }

  /**
   * Carga de condensador del Desfibrilador DFM100 (sonido ascendente suave)
   */
  startDefibrillatorCharging(onChargedCallback) {
    if (!this.isAudioEnabled || !this.ctx) return;
    this.stopDefibrillatorCharging();

    this.isCharging = true;
    this.isCharged = false;
    const now = this.ctx.currentTime;
    const duration = 3.0;

    this.chargeOsc = this.ctx.createOscillator();
    this.chargeGain = this.ctx.createGain();

    this.chargeOsc.type = 'sawtooth';
    this.chargeOsc.frequency.setValueAtTime(260, now);
    this.chargeOsc.frequency.exponentialRampToValueAtTime(1350, now + duration);

    const targetGain = 0.07 * this.masterVolume;
    this.chargeGain.gain.setValueAtTime(0.001, now);
    this.chargeGain.gain.linearRampToValueAtTime(targetGain, now + 0.3);
    this.chargeGain.gain.setValueAtTime(targetGain, now + duration);

    this.chargeOsc.connect(this.chargeGain);
    this.chargeGain.connect(this.ctx.destination);

    this.chargeOsc.start(now);

    setTimeout(() => {
      if (this.isCharging) {
        this.stopDefibrillatorCharging();
        this.startChargedReadyTone();
        if (onChargedCallback) onChargedCallback();
      }
    }, duration * 1000);
  }

  startChargedReadyTone() {
    if (!this.isAudioEnabled || !this.ctx) return;
    this.isCharged = true;

    const now = this.ctx.currentTime;
    this.chargedOsc = this.ctx.createOscillator();
    this.chargedGain = this.ctx.createGain();

    this.chargedOsc.type = 'sine';
    this.chargedOsc.frequency.setValueAtTime(1380, now);

    this.chargedGain.gain.setValueAtTime(0.04 * this.masterVolume, now);

    this.chargedOsc.connect(this.chargedGain);
    this.chargedGain.connect(this.ctx.destination);

    this.chargedOsc.start(now);
  }

  stopDefibrillatorCharging() {
    this.isCharging = false;
    this.isCharged = false;
    if (this.chargeOsc) {
      try { this.chargeOsc.stop(); this.chargeOsc.disconnect(); } catch (e) {}
      this.chargeOsc = null;
    }
    if (this.chargedOsc) {
      try { this.chargedOsc.stop(); this.chargedOsc.disconnect(); } catch (e) {}
      this.chargedOsc = null;
    }
  }

  playShockDischarge() {
    this.stopDefibrillatorCharging();
    if (!this.isAudioEnabled || !this.ctx) return;

    const now = this.ctx.currentTime;

    // RelÃ© mecÃ¡nico y golpe elÃ©ctrico
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    thudGain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    thud.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thud.start(now);
    thud.stop(now + 0.18);
  }

  /**
   * Compresor de PANI mÃ¡s suave y realista
   */
  playNibpCycle(durationSec = 7, onProgressCallback, onCompleteCallback) {
    if (!this.isAudioEnabled || !this.ctx) {
      if (onCompleteCallback) setTimeout(onCompleteCallback, durationSec * 1000);
      return;
    }

    const now = this.ctx.currentTime;

    // Zumbido neumÃ¡tico a volumen muy moderado
    const motorOsc = this.ctx.createOscillator();
    const motorGain = this.ctx.createGain();
    motorOsc.type = 'triangle'; // Triangle es mÃ¡s suave que square
    motorOsc.frequency.setValueAtTime(85, now);

    const pumpVol = 0.025 * this.masterVolume;
    motorGain.gain.setValueAtTime(0.0001, now);
    motorGain.gain.linearRampToValueAtTime(pumpVol, now + 0.5);
    motorGain.gain.setValueAtTime(pumpVol, now + durationSec - 1.2);
    motorGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

    motorOsc.connect(motorGain);
    motorGain.connect(this.ctx.destination);

    motorOsc.start(now);
    motorOsc.stop(now + durationSec);

    // Escape de aire suave "pssh"
    setTimeout(() => {
      if (!this.ctx) return;
      const releaseTime = this.ctx.currentTime;
      const buffSize = this.ctx.sampleRate * 0.5;
      const buff = this.ctx.createBuffer(1, buffSize, this.ctx.sampleRate);
      const d = buff.getChannelData(0);
      for (let i = 0; i < buffSize; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.16));
      }
      const hiss = this.ctx.createBufferSource();
      hiss.buffer = buff;
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.03 * this.masterVolume, releaseTime);
      hissGain.gain.exponentialRampToValueAtTime(0.0001, releaseTime + 0.45);
      hiss.connect(hissGain);
      hissGain.connect(this.ctx.destination);
      hiss.start(releaseTime);

      if (onCompleteCallback) onCompleteCallback();
    }, (durationSec - 0.9) * 1000);
  }

  playButtonBeep() {
    if (!this.isAudioEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1150, now);
    gain.gain.setValueAtTime(0.03 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Tono de encendido y auto-test Philips DFM100
   */
  playPowerOnBeep() {
    if (!this.isAudioEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);       // Do5 (C5)
    osc1.frequency.setValueAtTime(659.25, now + 0.12); // Mi5 (E5)
    osc2.frequency.setValueAtTime(1046.5, now + 0.12); // Do6 (C6)

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07 * this.masterVolume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.12);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  }

  // =========================================================================
  // SINTETIZADOR ACÃšSTICO DE AUSCULTACIÃ“N PULMONAR Y CARDÃACA (ALTA POTENCIA)
  // =========================================================================
  startAuscultation(type, soundId) {
    this.stopAuscultation();
    this.init();
    if (!this.ctx) return;

    this.activeAuscultationType = type;
    this.activeAuscultationId = soundId;

    if (type === 'pulmonary') {
      this._startLungSoundLoop(soundId);
    } else if (type === 'cardiac') {
      this._startHeartSoundLoop(soundId);
    }
  }

  stopAuscultation() {
    if (this.auscultationInterval) {
      clearInterval(this.auscultationInterval);
      this.auscultationInterval = null;
    }
    if (this.activeAuscultationNodes) {
      this.activeAuscultationNodes.forEach(n => {
        try { n.stop(); } catch(e) {}
        try { n.disconnect(); } catch(e) {}
      });
      this.activeAuscultationNodes = null;
    }
    this.activeAuscultationId = null;
  }

  _startLungSoundLoop(soundId) {
    const rawId = (soundId || 'normal').replace(/^lung_/, '');

    const playBreathCycle = () => {
      if (!this.ctx || this.activeAuscultationId !== soundId) return;
      const now = this.ctx.currentTime;
      const cycleDuration = 3.6; // ~16 rpm

      // Ruido base de flujo vesicular de alta amplitud
      const buffSize = Math.floor(this.ctx.sampleRate * cycleDuration);
      const buff = this.ctx.createBuffer(1, buffSize, this.ctx.sampleRate);
      const data = buff.getChannelData(0);
      for (let i = 0; i < buffSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buff;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);

      const baseGain = (rawId === 'silent') ? 0.002 : 0.45;
      // InspiraciÃ³n (0 a 1.6s)
      gain.gain.linearRampToValueAtTime(baseGain, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.6);
      // EspiraciÃ³n (1.8 a 3.4s)
      gain.gain.linearRampToValueAtTime(baseGain * 0.70, now + 2.3);
      gain.gain.linearRampToValueAtTime(0.0001, now + 3.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + cycleDuration);

      // Sibilancias (Wheeze)
      if (rawId === 'wheeze') {
        [480, 620, 780].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const wGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + 1.7);
          osc.frequency.linearRampToValueAtTime(freq - 40, now + 3.2);

          wGain.gain.setValueAtTime(0.0001, now + 1.7);
          wGain.gain.linearRampToValueAtTime(0.16, now + 2.0 + (idx * 0.1));
          wGain.gain.linearRampToValueAtTime(0.0001, now + 3.3);

          osc.connect(wGain);
          wGain.connect(this.ctx.destination);
          osc.start(now + 1.7);
          osc.stop(now + 3.4);
        });
      }

      // Estridor (Stridor)
      if (rawId === 'stridor') {
        const osc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(680, now + 0.2);
        osc.frequency.linearRampToValueAtTime(840, now + 0.85);
        osc.frequency.linearRampToValueAtTime(620, now + 1.5);

        sGain.gain.setValueAtTime(0.0001, now + 0.2);
        sGain.gain.linearRampToValueAtTime(0.22, now + 0.8);
        sGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);

        osc.connect(sGain);
        sGain.connect(this.ctx.destination);
        osc.start(now + 0.2);
        osc.stop(now + 1.55);
      }

      // Crepitantes (Crackles)
      if (rawId === 'crackles') {
        for (let c = 0; c < 18; c++) {
          const cTime = now + 0.65 + (Math.random() * 0.85);
          const cOsc = this.ctx.createOscillator();
          const cGain = this.ctx.createGain();
          cOsc.type = 'triangle';
          cOsc.frequency.setValueAtTime(750 + (Math.random() * 500), cTime);
          cGain.gain.setValueAtTime(0.18, cTime);
          cGain.gain.exponentialRampToValueAtTime(0.0001, cTime + 0.015);
          cOsc.connect(cGain);
          cGain.connect(this.ctx.destination);
          cOsc.start(cTime);
          cOsc.stop(cTime + 0.018);
        }
      }

      // Roncus (Rhonchi)
      if (rawId === 'rhonchi') {
        const rOsc = this.ctx.createOscillator();
        const rGain = this.ctx.createGain();
        rOsc.type = 'sawtooth';
        rOsc.frequency.setValueAtTime(140, now + 1.6);
        rOsc.frequency.linearRampToValueAtTime(110, now + 3.2);

        rGain.gain.setValueAtTime(0.0001, now + 1.6);
        rGain.gain.linearRampToValueAtTime(0.18, now + 2.2);
        rGain.gain.linearRampToValueAtTime(0.0001, now + 3.3);

        rOsc.connect(rGain);
        rGain.connect(this.ctx.destination);
        rOsc.start(now + 1.6);
        rOsc.stop(now + 3.35);
      }
    };

    playBreathCycle();
    this.auscultationInterval = setInterval(playBreathCycle, 3600);
  }

  _startHeartSoundLoop(soundId) {
    const rawId = (soundId || 'normal').replace(/^heart_/, '');

    const playHeartBeat = () => {
      if (!this.ctx || this.activeAuscultationId !== soundId) return;
      const now = this.ctx.currentTime;
      const volMultiplier = (rawId === 'muffled') ? 0.28 : 1.0;

      // â”€â”€ PRIMER TONO R1 ("LUB" - Fundamental 70Hz + armÃ³nico 140Hz) â”€â”€
      const osc1 = this.ctx.createOscillator();
      const osc1Harm = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(72, now);
      osc1.frequency.exponentialRampToValueAtTime(48, now + 0.09);

      osc1Harm.type = 'triangle';
      osc1Harm.frequency.setValueAtTime(144, now);
      osc1Harm.frequency.exponentialRampToValueAtTime(96, now + 0.09);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.65 * volMultiplier, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc1.connect(gain1);
      osc1Harm.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1Harm.start(now);
      osc1.stop(now + 0.12);
      osc1Harm.stop(now + 0.12);

      // Soplo sistÃ³lico eyectivo (entre R1 y R2)
      if (rawId === 'systolic_murmur') {
        const murmurBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.22), this.ctx.sampleRate);
        const md = murmurBuff.getChannelData(0);
        for (let i = 0; i < md.length; i++) md[i] = (Math.random() * 2 - 1);
        const mSrc = this.ctx.createBufferSource();
        mSrc.buffer = murmurBuff;
        const mFilter = this.ctx.createBiquadFilter();
        mFilter.type = 'bandpass';
        mFilter.frequency.setValueAtTime(420, now + 0.04);
        mFilter.Q.setValueAtTime(2.2, now + 0.04);
        const mGain = this.ctx.createGain();
        mGain.gain.setValueAtTime(0.001, now + 0.04);
        mGain.gain.linearRampToValueAtTime(0.38, now + 0.13);
        mGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        mSrc.connect(mFilter);
        mFilter.connect(mGain);
        mGain.connect(this.ctx.destination);
        mSrc.start(now + 0.04);
        mSrc.stop(now + 0.26);
      }

      // â”€â”€ SEGUNDO TONO R2 ("DUB" - 105Hz + armÃ³nico 210Hz) â”€â”€
      const r2Time = now + 0.28;
      const osc2 = this.ctx.createOscillator();
      const osc2Harm = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(105, r2Time);
      osc2.frequency.exponentialRampToValueAtTime(70, r2Time + 0.08);

      osc2Harm.type = 'triangle';
      osc2Harm.frequency.setValueAtTime(210, r2Time);
      osc2Harm.frequency.exponentialRampToValueAtTime(140, r2Time + 0.08);

      gain2.gain.setValueAtTime(0.001, r2Time);
      gain2.gain.linearRampToValueAtTime(0.55 * volMultiplier, r2Time + 0.016);
      gain2.gain.exponentialRampToValueAtTime(0.0001, r2Time + 0.095);

      osc2.connect(gain2);
      osc2Harm.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(r2Time);
      osc2Harm.start(r2Time);
      osc2.stop(r2Time + 0.10);
      osc2Harm.stop(r2Time + 0.10);

      // Galope R3 protodiastÃ³lico
      if (rawId === 's3_gallop' || rawId === 'gallop_s3') {
        const r3Time = r2Time + 0.13;
        const osc3 = this.ctx.createOscillator();
        const gain3 = this.ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(55, r3Time);
        gain3.gain.setValueAtTime(0.001, r3Time);
        gain3.gain.linearRampToValueAtTime(0.35, r3Time + 0.02);
        gain3.gain.exponentialRampToValueAtTime(0.0001, r3Time + 0.09);
        osc3.connect(gain3);
        gain3.connect(this.ctx.destination);
        osc3.start(r3Time);
        osc3.stop(r3Time + 0.095);
      }

      // Roce pericÃ¡rdico
      if (rawId === 'pericardial_rub') {
        [now + 0.04, now + 0.32].forEach(rubTime => {
          const rubBuff = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
          const rd = rubBuff.getChannelData(0);
          for (let i = 0; i < rd.length; i++) rd[i] = (Math.random() * 2 - 1);
          const rSrc = this.ctx.createBufferSource();
          rSrc.buffer = rubBuff;
          const rFilter = this.ctx.createBiquadFilter();
          rFilter.type = 'highpass';
          rFilter.frequency.setValueAtTime(380, rubTime);
          const rGain = this.ctx.createGain();
          rGain.gain.setValueAtTime(0.22, rubTime);
          rGain.gain.exponentialRampToValueAtTime(0.0001, rubTime + 0.11);
          rSrc.connect(rFilter);
          rFilter.connect(rGain);
          rGain.connect(this.ctx.destination);
          rSrc.start(rubTime);
          rSrc.stop(rubTime + 0.12);
        });
      }
    };

    playHeartBeat();
    this.auscultationInterval = setInterval(playHeartBeat, 800); // 75 lpm
  }

  // =========================================================================
  // SONIDOS VOCALES DEL PACIENTE (GLASGOW / EXPLORACIÃ“N) â€” VERSIÃ“N MEJORADA
  // =========================================================================
  playPatientVocal(vocalId) {
    this.init();

    // Reproducir síntesis de audio específica primero
    if (vocalId === 'cough') {
      this._synthesizeCoughSound();
      return; // La tos es solo audio, sin voz
    }
    if (vocalId === 'asphyxia') {
      this._synthesizeAsphyxiaSound();
      return; // Asfixia solo audio, sin voz
    }
    if (vocalId === 'cry') {
      this._synthesizeCryingSound();
      return; // Llanto es solo audio sintético, sin palabras
    }

    const phrases = {
      incomprehensible: [
        'Ay... me duele todo... no puedo más...',
        'Por favor... qué frío... déjeme tranquilo...',
        'No sé... no sé qué me pasa... qué dolor...',
        'Me encuentro muy mal... ay dios mío...'
      ],
      inappropriate: [
        'Pero qué... si yo estaba... no sé dónde está mi madre...',
        'Ya viene el tren... María, cierra la ventana... tengo frío...',
        'No, no, ya he pagado... déjame... que me duele la pierna...',
        'Es que el perro... el perro se ha ido... ay qué frío hace...'
      ],
      insults: [
        '¡Suéltame! ¡No me toquéis! ¡Marchaos de aquí!',
        '¡Dejadme en paz! ¡Que no quiero nada!',
        '¡Iros! ¡Que no me pasa nada! ¡Os voy a denunciar!'
      ],
      confused: [
        '¿Dónde estoy? ¿Qué me ha pasado? No me acuerdo de nada...',
        '¿Por qué estoy aquí? Yo iba a comprar... ¿Qué día es hoy?',
        'Creo que... no sé. ¿Ha llamado alguien? Tengo frío.'
      ],
      oriented: [
        'Me duele muchísimo el pecho, como si me aplastaran. No puedo respirar bien.',
        'Siento una opresión terrible aquí, en el centro del pecho, que me sube al cuello.',
        'Tengo mareo y me falta el aire desde hace como media hora. Me encuentro muy mal.',
        'Noto el corazón muy acelerado y me cuesta respirar. Me siento muy débil.'
      ],
      scream: [
        '¡Me duele muchísimo! ¡Por favor, hagan algo!',
        '¡Ay dios mío, qué dolor! ¡Ayúdenme!',
        '¡Que me duele! ¡No puedo más!'
      ]
    };

    const phraseList = phrases[vocalId] || phrases.oriented;
    const text = phraseList[Math.floor(Math.random() * phraseList.length)];

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.volume = 1.0;

      // Seleccionar voz espaÃ±ola nativa si estÃ¡ disponible
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es') && v.localService) ||
                      voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      if (vocalId === 'incomprehensible') {
        utterance.rate  = 0.65;
        utterance.pitch = 0.55;
        utterance.volume = 0.8;
      } else if (vocalId === 'inappropriate' || vocalId === 'confused') {
        utterance.rate  = 0.78;
        utterance.pitch = 0.85;
      } else if (vocalId === 'insults') {
        utterance.rate  = 1.2;
        utterance.pitch = 1.35;
        utterance.volume = 1.0;
      } else if (vocalId === 'scream') {
        utterance.rate  = 1.1;
        utterance.pitch = 1.45;
        utterance.volume = 1.0;
      } else {
        utterance.rate  = 0.92;
        utterance.pitch = 1.0;
      }

      window.speechSynthesis.speak(utterance);
    }
  }

  // Tos severa â€” accesos repetidos de tos seca
  _synthesizeCoughSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const coughTimes = [0, 0.28, 0.56, 0.85, 1.1];
    coughTimes.forEach(t => {
      const cTime = now + t;
      // Ruido blanco filtrado como un impulso de presiÃ³n aÃ©rea
      const buff   = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.18), this.ctx.sampleRate);
      const data   = buff.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Ruido turbulento con envolvente exponencial
        const env = Math.exp(-i / (data.length * 0.3));
        data[i]   = (Math.random() * 2 - 1) * env;
      }
      const src    = this.ctx.createBufferSource();
      src.buffer   = buff;

      // Filtro paso-banda vocal (500-2500 Hz) para timbre de tos
      const bpf1   = this.ctx.createBiquadFilter();
      bpf1.type    = 'bandpass';
      bpf1.frequency.setValueAtTime(700,  cTime);
      bpf1.Q.setValueAtTime(1.2, cTime);

      const bpf2   = this.ctx.createBiquadFilter();
      bpf2.type    = 'peaking';
      bpf2.frequency.setValueAtTime(1400, cTime);
      bpf2.gain.setValueAtTime(8,   cTime);

      const gain   = this.ctx.createGain();
      gain.gain.setValueAtTime(0.55 * this.masterVolume, cTime);
      gain.gain.exponentialRampToValueAtTime(0.001, cTime + 0.17);

      src.connect(bpf1);
      bpf1.connect(bpf2);
      bpf2.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(cTime);
      src.stop(cTime + 0.2);
    });
  }

  // Asfixia — respiración agónica y estridor por vía aérea estrechada
  _synthesizeAsphyxiaSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 2.0;

    const buffLen = Math.floor(this.ctx.sampleRate * duration);
    const buff    = this.ctx.createBuffer(1, buffLen, this.ctx.sampleRate);
    const data    = buff.getChannelData(0);
    for (let i = 0; i < buffLen; i++) data[i] = (Math.random() * 2 - 1);
    const src     = this.ctx.createBufferSource();
    src.buffer    = buff;

    const bpf     = this.ctx.createBiquadFilter();
    bpf.type      = 'bandpass';
    bpf.frequency.setValueAtTime(600, now);
    bpf.frequency.linearRampToValueAtTime(800, now + 0.7);
    bpf.frequency.linearRampToValueAtTime(500, now + 1.8);
    bpf.Q.setValueAtTime(3.5, now);

    const gain    = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + duration);
  }

  // Llanto — solo audio sintético, sin voz
  _synthesizeCryingSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const sobTimes = [0, 0.65, 1.3, 1.95];
    sobTimes.forEach((t, i) => {
      const sTime = now + t;
      const osc   = this.ctx.createOscillator();
      const gain  = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 240 + (i % 2) * 25;
      osc.frequency.setValueAtTime(baseFreq, sTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, sTime + 0.45);

      gain.gain.setValueAtTime(0.001, sTime);
      gain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, sTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, sTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(sTime);
      osc.stop(sTime + 0.5);
    });
  }

  _synthesizeGroanSound(isScream = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isScream ? 380 : 130;
    const endFreq   = isScream ? 240 : 85;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime((isScream ? 0.35 : 0.20) * this.masterVolume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhilipsAudioSynth };
}

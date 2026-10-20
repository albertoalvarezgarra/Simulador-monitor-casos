/**
 * Capa de Comunicación e Interconexión Inalámbrica (Tablet ↔ Smartphone)
 * Soporta WebRTC P2P (PeerJS) y BroadcastChannel nativo para entorno local.
 */

class SimConnectionManager {
  constructor(role = 'student', options = {}) {
    this.role = role; // 'student' o 'instructor'
    this.roomCode = options.roomCode || null;
    this.onMessageReceived = options.onMessage || null;
    this.onStatusChanged = options.onStatusChange || null;

    this.peer = null;
    this.activeConnection = null;
    this.broadcastChannel = null;
    this.isConnected = false;
    this.connectionType = 'none'; // 'webrtc' o 'broadcast'

    // Inicializar canal de difusión local para multitarea / misma red
    this.initBroadcastChannel();
  }

  initBroadcastChannel() {
    try {
      if (window.BroadcastChannel) {
        this.broadcastChannel = new BroadcastChannel('philips_dfm100_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.roomCode === this.roomCode) {
            this.handleIncomingData(event.data.payload, 'broadcast');
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel no soportado o deshabilitado:', e);
    }
  }

  /**
   * Genera un código de sala aleatorio de 4 caracteres alfanuméricos fáciles de escribir
   */
  static generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Inicia el modo Alumno (Host / Tablet)
   */
  startHost(roomCode) {
    this.roomCode = roomCode.toUpperCase();
    this.updateStatus('connecting', 'Iniciando servidor de sincronización...');

    // Cargar PeerJS dinámicamente si no está presente
    this.ensurePeerJsLoaded(() => {
      const peerId = `dfm100-${this.roomCode.toLowerCase()}`;
      try {
        this.peer = new window.Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.updateStatus('waiting_instructor', `Esperando conexión del móvil... (Código: ${this.roomCode})`);
        });

        this.peer.on('connection', (conn) => {
          this.setupPeerConnection(conn);
        });

        // Recepción de audio del instructor (micrófono en vivo amplificado al máximo)
        this.peer.on('call', (call) => {
          try {
            call.answer(); // Responder llamada de voz entrante
            call.on('stream', (remoteStream) => {
              let webAudioSuccess = false;
              // 1. Amplificación extrema con Web Audio API (GainNode 5.0x + Compresor dinámico)
              try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                  const actx = window._instrAudioCtx || new AudioCtx();
                  window._instrAudioCtx = actx;
                  if (actx.state === 'suspended') {
                    actx.resume();
                    // Asegurar reanudación en el primer toque de pantalla si el navegador bloquea autoplay
                    const resumeOnTap = () => {
                      if (actx.state === 'suspended') actx.resume();
                      document.removeEventListener('click', resumeOnTap);
                      document.removeEventListener('touchstart', resumeOnTap);
                    };
                    document.addEventListener('click', resumeOnTap);
                    document.addEventListener('touchstart', resumeOnTap);
                  }
                  const src = actx.createMediaStreamSource(remoteStream);
                  const gainNode = actx.createGain();
                  gainNode.gain.setValueAtTime(5.0, actx.currentTime); // +500% ganancia máxima de volumen

                  const comp = actx.createDynamicsCompressor();
                  comp.threshold.setValueAtTime(-18, actx.currentTime);
                  comp.knee.setValueAtTime(30, actx.currentTime);
                  comp.ratio.setValueAtTime(14, actx.currentTime);
                  comp.attack.setValueAtTime(0.002, actx.currentTime);
                  comp.release.setValueAtTime(0.20, actx.currentTime);

                  src.connect(gainNode);
                  gainNode.connect(comp);
                  comp.connect(actx.destination);
                  webAudioSuccess = true;
                }
              } catch (audioErr) {
                console.warn('Fallback a audio element standard:', audioErr);
              }

              // 2. Audio element estándar: si Web Audio funciona, muted=true para no mezclar con audio bajo; si falla, volumen 1.0
              let audioEl = document.getElementById('remoteInstructorAudio');
              if (!audioEl) {
                audioEl = document.createElement('audio');
                audioEl.id = 'remoteInstructorAudio';
                audioEl.autoplay = true;
                audioEl.playsInline = true;
                document.body.appendChild(audioEl);
              }
              audioEl.srcObject = remoteStream;
              audioEl.muted = webAudioSuccess; // Solo reproducir directo si Web Audio no pudo inicializar
              audioEl.volume = 1.0;
              audioEl.play().catch(e => console.warn('Error al reproducir voz del instructor:', e));
            });
          } catch(e) {
            console.warn('Error en llamada WebRTC de voz:', e);
          }
        });

        this.peer.on('error', (err) => {
          console.warn('Error de conexión PeerJS:', err);
          this.updateStatus('ready_local', 'Listo en modo local (WiFi / misma red)');
        });
      } catch (err) {
        console.warn('Fallo al inicializar PeerJS:', err);
        this.updateStatus('ready_local', 'Modo local activo');
      }
    });
  }

  /**
   * Inicia el modo Instructor (Cliente / Móvil) conectándose al código del alumno
   */
  connectToHost(roomCode) {
    this.roomCode = roomCode.toUpperCase();
    this.updateStatus('connecting', `Conectando con la tablet (${this.roomCode})...`);

    // Emitir mensaje por broadcast channel por si están en el mismo dispositivo o red directa
    this.send({ type: 'INSTRUCTOR_HELLO', roomCode: this.roomCode });

    this.ensurePeerJsLoaded(() => {
      try {
        this.peer = new window.Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', () => {
          const targetPeerId = `dfm100-${this.roomCode.toLowerCase()}`;
          const conn = this.peer.connect(targetPeerId, { reliable: true });
          this.setupPeerConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('Error en conexión instructor PeerJS:', err);
          this.updateStatus('error', 'No se pudo conectar vía WebRTC. Verificando canal local...');
        });
      } catch (err) {
        console.warn('Error al iniciar Peer en instructor:', err);
      }
    });
  }

  setupPeerConnection(conn) {
    this.activeConnection = conn;

    conn.on('open', () => {
      this.isConnected = true;
      this.connectionType = 'webrtc';
      this.updateStatus('connected', 'Conectado en tiempo real');

      // Si somos el instructor, solicitar estado actual
      if (this.role === 'instructor') {
        this.send({ type: 'REQUEST_CURRENT_STATE' });
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data, 'webrtc');
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.updateStatus('disconnected', 'Conexión cerrada. Reconectando...');
    });

    conn.on('error', (err) => {
      console.warn('Error en DataChannel:', err);
    });
  }

  handleIncomingData(payload, source) {
    if (!payload) return;

    // Si recibimos mensaje de broadcast confirmamos conectividad local
    if (!this.isConnected && source === 'broadcast') {
      this.isConnected = true;
      this.connectionType = 'broadcast';
      this.updateStatus('connected', 'Conectado vía enlace local');
    }

    if (this.onMessageReceived) {
      this.onMessageReceived(payload);
    }
  }

  /**
   * Envía un paquete de datos al otro dispositivo
   */
  send(payload) {
    let sent = false;

    // 1. Enviar vía WebRTC DataChannel
    if (this.activeConnection && this.activeConnection.open) {
      try {
        this.activeConnection.send(payload);
        sent = true;
      } catch (e) {
        console.warn('Fallo al enviar por WebRTC:', e);
      }
    }

    // 2. Enviar vía BroadcastChannel para redundancia local
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          roomCode: this.roomCode,
          sender: this.role,
          payload: payload,
          timestamp: Date.now()
        });
        sent = true;
      } catch (e) {}
    }

    return sent;
  }

  updateStatus(state, message) {
    if (this.onStatusChanged) {
      this.onStatusChanged(state, message);
    }
  }

  /**
   * Inicia llamada de voz WebRTC (instructor -> alumno)
   */
  callPeer(stream) {
    if (!this.peer || !this.roomCode) return null;
    const targetPeerId = `dfm100-${this.roomCode.toLowerCase()}`;
    try {
      return this.peer.call(targetPeerId, stream);
    } catch (e) {
      console.warn('Error al iniciar llamada WebRTC:', e);
      return null;
    }
  }

  ensurePeerJsLoaded(callback) {
    if (window.Peer) {
      callback();
      return;
    }

    // Cargar script de PeerJS desde CDN seguro con fallback
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    script.onload = () => {
      callback();
    };
    script.onerror = () => {
      console.warn('No se pudo cargar PeerJS desde CDN (posible falta de internet). Operando en modo local.');
      this.updateStatus('local_only', 'Modo local sin internet activo');
      callback();
    };
    document.head.appendChild(script);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimConnectionManager };
}

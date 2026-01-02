/**
 * Zenith Point v2 - Relativistic Cockpit Engine
 * 
 * Paradox Mechanics:
 * Closure Rate = V_player - (V_player * (1 - epsilon)) = epsilon * V_player
 * As V_player increases (power up), epsilon * V_player increases (closing in),
 * but T_target scales by a larger exponent on reboot, ensuring ETA grows.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.layers = {};
        this.initialized = false;
        this.currentChordIndex = 0;

        // Interstellar-esque chord progression (A-minor/modal foundation)
        this.progression = [
            [55.00, 82.41, 110.00, 130.81],  // A Minor
            [43.65, 87.31, 130.81, 174.61],  // F Major
            [65.41, 98.00, 130.81, 164.81],  // C Major
            [48.99, 73.42, 110.00, 146.83]   // G Major
        ];
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.3; // Low ceiling for comfort
        this.master.connect(this.ctx.destination);

        this.setupWarmStrings();
        this.setupPipeOrgan();
        this.setupPianoMotifs();
        this.cycleProgression();

        this.initialized = true;
    }

    setupWarmStrings() {
        // Soft, breathing string layers
        this.layers.strings = [0, 1, 2, 3].map(() => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            filter.type = 'lowpass';
            filter.frequency.value = 350;
            filter.Q.value = 0.5;

            gain.gain.value = 0;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.master);

            osc.start();
            return { osc, gain, filter };
        });
    }

    setupPipeOrgan() {
        // Additive synthesis for pipe organ texture (Interstellar anchor)
        const baseFreq = 55.00; // Low A
        const harmonics = [1, 2, 3, 4, 8];
        this.layers.organ = harmonics.map(ratio => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = baseFreq * ratio;
            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(this.master);
            osc.start();

            // Minimal presence
            gain.gain.setTargetAtTime(0.015 / ratio, this.ctx.currentTime, 15);
            return { osc, gain };
        });
    }

    setupPianoMotifs() {
        // Randomly play single piano notes every 15-30s
        setInterval(() => {
            if (this.initialized && Math.random() > 0.5) this.playPiano();
        }, 12000);
    }

    playPiano() {
        const now = this.ctx.currentTime;
        const chord = this.progression[this.currentChordIndex];
        const freq = chord[Math.floor(Math.random() * chord.length)] * 4; // High octave

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 6); // Long decay

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(now + 7);
    }

    cycleProgression() {
        const chord = this.progression[this.currentChordIndex];
        const now = this.ctx.currentTime;

        this.layers.strings.forEach((str, i) => {
            str.osc.frequency.setTargetAtTime(chord[i], now, 8);
            str.gain.gain.setTargetAtTime(0.07, now, 8);
            // Harmonic drift
            this.modulate(str.osc.frequency, chord[i] * 0.001, 0.05);
        });

        this.currentChordIndex = (this.currentChordIndex + 1) % this.progression.length;
        setTimeout(() => {
            if (this.initialized) this.cycleProgression();
        }, 22000); // Very slow cycle
    }

    update(velocity, distanceRatio) {
        if (!this.initialized) return;
        // As we approach, filters open slightly for "richness"
        const resonance = Math.pow(1 - distanceRatio, 2);
        this.layers.strings.forEach(s => {
            s.filter.frequency.setTargetAtTime(350 + (resonance * 300), this.ctx.currentTime, 5);
        });
    }

    playThrust(velocity) {
        if (!this.initialized) return;
        // Soft engine whisper, never aggressive
        const now = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.5, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start();
    }

    playReboot() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        // The "Floating" reset: Quiet suspension
        this.master.gain.setTargetAtTime(0.02, now, 2);
        setTimeout(() => {
            this.master.gain.setTargetAtTime(0.3, this.ctx.currentTime, 15);
        }, 1500);
    }

    modulate(param, range, speed) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = speed;
        lfoGain.gain.value = range;
        lfo.connect(lfoGain);
        lfoGain.connect(param);
        lfo.start();
    }
}

class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.speed = 0.5;
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        for (let i = 0; i < 400; i++) {
            this.stars.push({
                x: Math.random() * this.width - this.width / 2,
                y: Math.random() * this.height - this.height / 2,
                z: Math.random() * this.width,
                o: Math.random()
            });
        }
    }

    update(velocity) {
        // Velocity scales visual speed
        this.speed = Math.min(0.1 + Math.log10(velocity + 1) * 2, 50);

        this.ctx.fillStyle = '#030508';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.translate(this.width / 2, this.height / 2);

        this.stars.forEach(s => {
            s.z -= this.speed;
            if (s.z <= 0) {
                s.z = this.width;
                s.x = Math.random() * this.width - this.width / 2;
                s.y = Math.random() * this.height - this.height / 2;
            }

            const x = s.x * (this.width / s.z);
            const y = s.y * (this.width / s.z);
            const size = Math.max(0, (1 - s.z / this.width) * 3);

            this.ctx.fillStyle = `rgba(0, 242, 255, ${Math.max(0, 1 - s.z / this.width)})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Trail
            if (this.speed > 5) {
                this.ctx.strokeStyle = `rgba(0, 242, 255, ${(1 - s.z / this.width) * 0.2})`;
                this.ctx.lineWidth = size;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x * 1.1, y * 1.1);
                this.ctx.stroke();
            }
        });

        this.ctx.translate(-this.width / 2, -this.height / 2);
    }
}

class GameEngine {
    constructor() {
        this.flux = 0;
        this.totalFlux = 0;
        this.coherence = 1.0;
        this.velocity = 0;
        this.distance = 1e15;
        this.baseDistance = 1e15;
        this.reboots = 0;

        this.upgrades = [
            { id: 'u1', name: 'Resonance Core', desc: 'Increases base Flux generation', baseCost: 15, costMult: 1.15, count: 0, power: 1.0 },
            { id: 'u2', name: 'Solenoid Arrays', desc: 'Enhances Flux collection efficiency', baseCost: 150, costMult: 1.2, count: 0, power: 10.0 },
            { id: 'u3', name: 'Dimensional Splice', desc: 'Increases throughput by 4.0x per unit', baseCost: 2000, costMult: 1.6, count: 0, power: 4.0, type: 'mult' },
            { id: 'u4', name: 'Inertial Bypass', desc: 'Reduces relativistic drag (Overall 2.5x)', baseCost: 50000, costMult: 2.2, count: 0, power: 2.5, type: 'mult' }
        ];

        this.lastTick = Date.now();
        this.starfield = new Starfield(document.getElementById('starfield'));
        this.audio = new AudioManager();

        this.epsilon = 1e-9; // The closing constant. Progress is only 1e-9 of velocity.
        this.initialized = false;

        this.setupBoot();
    }

    setupBoot() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.audio.init();
            document.getElementById('audio-boot-overlay').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('audio-boot-overlay').style.display = 'none';
                this.initialized = true;
                this.init();
            }, 1000);
        });
    }

    init() {
        if (!this.initialized) return;
        this.setupDOM();
        this.renderUpgrades();
        this.animate();
        this.log("COCKPIT INITIALIZED. TARGET LOCKED: ZENITH POINT.");
    }

    setupDOM() {
        // Tab switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });

        // Clicker
        document.getElementById('collect-btn').addEventListener('click', () => {
            const gain = 1 * Math.pow(this.coherence, 1.5);
            this.addFlux(gain);
            this.vibrateHUD();
            this.audio.playThrust(this.velocity);
        });

        // Reboot
        document.getElementById('reboot-btn').addEventListener('click', () => this.executeReboot());
    }

    addFlux(amount) {
        this.flux += amount;
        this.totalFlux += amount;
    }

    getRate() {
        let base = 0;
        let mult = 1;
        this.upgrades.forEach(u => {
            if (!u.type) base += u.count * u.power;
            else mult *= Math.pow(u.power, u.count);
        });
        return base * mult * this.coherence;
    }

    getZenithTarget() {
        // Recession Logic: The target moves based on coherence level.
        // Base target = 1e15
        // Level 2 = 1e16.5
        // Level 3 = 1e18.2
        return Math.pow(10, 15 + (1.5 * (this.coherence - 1)));
    }

    getRebootRequirement() {
        return Math.pow(10, 10 + (2.8 * (this.coherence - 1)));
    }

    renderUpgrades() {
        const list = document.getElementById('upgrade-list');
        list.innerHTML = '';
        this.upgrades.forEach(u => {
            const cost = this.getCost(u);
            const card = document.createElement('div');
            card.className = `upgrade-card ${this.flux >= cost ? 'available' : 'locked'}`;
            card.innerHTML = `
                <div class="up-name">${u.name} [${u.count}]</div>
                <div class="up-desc">${u.desc}</div>
                <div class="up-footer">
                    <div class="up-cost">${this.format(cost)} FLUX</div>
                    <button class="buy-btn" onclick="game.buyUpgrade('${u.id}')">TUNE</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    getCost(u) {
        return u.baseCost * Math.pow(u.costMult, u.count);
    }

    buyUpgrade(id) {
        const u = this.upgrades.find(u => u.id === id);
        const cost = this.getCost(u);
        if (this.flux >= cost) {
            this.flux -= cost;
            u.count++;
            this.renderUpgrades();
            this.log(`OPTIMIZING SUBSYSTEM: ${u.name.toUpperCase()}`);
        }
    }

    executeReboot() {
        const req = this.getRebootRequirement();
        if (this.flux >= req) {
            this.coherence += 1;
            this.reboots++;
            this.flux = 0;
            this.upgrades.forEach(u => u.count = 0);

            // Recalibrate Distance: The target moves further out
            this.baseDistance = this.getZenithTarget();
            this.distance = this.baseDistance;

            this.renderUpgrades();
            this.log(`SPACETIME RECALIBRATED. COHERENCE LVL ${this.coherence} ATTAINED.`);
            this.flashHUD();
            this.audio.playReboot();
        }
    }

    animate() {
        const now = Date.now();
        const delta = (now - this.lastTick) / 1000;
        this.lastTick = now;

        const rate = this.getRate();
        this.addFlux(rate * delta);

        // Velocity Logic: Directly tied to Flux rate
        this.velocity = rate * 10; // Scalar mapping

        // Progress Logic: Closure rate is asymptotic
        // Progress = V * epsilon. The remaining distance decreases by this amount.
        const closingSpeed = this.velocity * this.epsilon;
        this.distance -= closingSpeed * delta;
        if (this.distance < 1e5) this.distance = 1e5; // Soft limit to avoid 0

        this.updateUI();
        this.starfield.update(this.velocity);

        const distRatio = this.distance / this.getZenithTarget();
        this.audio.update(this.velocity, distRatio);

        requestAnimationFrame(() => this.animate());
    }

    updateUI() {
        // Panel Stats
        document.getElementById('flux-count').textContent = this.format(this.flux);
        document.getElementById('flux-rate').textContent = `${this.format(this.getRate())} /s`;
        document.getElementById('coherence-level').textContent = this.coherence.toFixed(4);

        document.getElementById('stat-reboots').textContent = this.reboots;
        document.getElementById('stat-total').textContent = this.format(this.totalFlux);

        // Navigation
        document.getElementById('velocity-val').textContent = this.formatShort(this.velocity);
        document.getElementById('zenith-distance').textContent = this.distance.toExponential(8);

        // ETA Logic: Distance / Closing Speed
        const closingSpeed = this.velocity * this.epsilon;
        const etaSeconds = closingSpeed > 0 ? this.distance / closingSpeed : 0;
        document.getElementById('eta-val').textContent = this.formatTime(etaSeconds);

        // Progress Bar
        const target = this.getZenithTarget();
        const progress = Math.max(0, (1 - (this.distance / target)) * 100);
        const clamped = Math.min(progress, 99.9999999);
        document.getElementById('zenith-percent').textContent = `${clamped.toFixed(7)}%`;
        document.getElementById('zenith-bar').style.width = `${clamped}%`;

        // Velocity Ring
        const ringFull = 283;
        const offset = ringFull - (Math.min(1, this.velocity / 1e12) * ringFull);
        document.getElementById('velocity-fill').style.strokeDashoffset = offset;

        // Reboot Visibility
        const req = this.getRebootRequirement();
        if (this.flux >= req) {
            document.getElementById('reboot-container').classList.remove('hidden');
            document.getElementById('reboot-req').textContent = `THRESHOLD ATTAINED`;
        } else {
            document.getElementById('reboot-container').classList.add('hidden');
        }

        // Upgrade status colors
        document.querySelectorAll('.upgrade-card').forEach((card, i) => {
            const u = this.upgrades[i];
            if (this.flux >= this.getCost(u)) card.classList.remove('locked'), card.classList.add('available');
            else card.classList.add('locked'), card.classList.remove('available');
        });

        // Warnings
        if (this.velocity > 1e9) {
            document.getElementById('warning-bar').classList.remove('hidden');
            document.getElementById('warning-text').textContent = "RELATIVISTIC SHEAR INCREASING";
        } else {
            document.getElementById('warning-bar').classList.add('hidden');
        }
    }

    format(num) {
        if (num < 1000) return num.toFixed(3);
        const exp = Math.floor(Math.log10(num));
        const mantissa = num / Math.pow(10, exp);
        return `${mantissa.toFixed(2)}e${exp}`;
    }

    formatShort(num) {
        if (num < 1e6) return num.toFixed(1);
        return this.format(num);
    }

    formatTime(s) {
        if (!isFinite(s) || s === 0) return "--:--:--";
        if (s > 31536000 * 100) return "> 100 YEARS";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    log(msg) {
        const console = document.getElementById('log-console');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `> ${msg}`;
        console.prepend(entry);
        if (console.children.length > 15) console.removeChild(console.lastChild);
    }

    vibrateHUD() {
        document.getElementById('hud-overlay').animate([
            { transform: 'translate(0,0)' },
            { transform: 'translate(1px,-1px)' },
            { transform: 'translate(-1px,1px)' },
            { transform: 'translate(0,0)' }
        ], { duration: 100 });
    }

    flashHUD() {
        document.body.animate([
            { background: 'var(--accent)' },
            { background: 'var(--bg)' }
        ], { duration: 500 });
    }
}

// Global exposure
const game = new GameEngine();
window.game = game;

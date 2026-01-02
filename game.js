/**
 * Zenith Point - Core Engine
 * 
 * Paradox Logic:
 * Goal Exponent (GE) = 15 + (1.2 * Coherence)
 * Power Exponent (PE)Factor = Coherence
 * 
 * Since GE grows faster than PE, the player never reaches the target.
 */

class GameEngine {
    constructor() {
        this.flux = 0;
        this.totalFlux = 0;
        this.coherence = 1.0;
        this.rebootCount = 0;
        
        this.upgrades = [
            { id: 'u1', name: 'Flux Inductor', desc: 'Increases base Flux rate by 0.5', baseCost: 10, costMult: 1.15, count: 0, power: 0.5 },
            { id: 'u2', name: 'Resonance Chamber', desc: 'Increases base Flux rate by 5.0', baseCost: 100, costMult: 1.2, count: 0, power: 5.0 },
            { id: 'u3', name: 'Dimensional Splitter', desc: 'Increases base Flux rate by 50.0', baseCost: 1000, costMult: 1.25, count: 0, power: 50.0 },
            { id: 'u4', name: 'Quantum Stabilizer', desc: 'Multiplies total rate by 2x', baseCost: 10000, costMult: 1.5, count: 0, power: 2.0, type: 'mult' }
        ];

        this.lastTick = Date.now();
        this.init();
    }

    init() {
        this.setupDOM();
        this.loadGame();
        this.startLoop();
    }

    setupDOM() {
        // Tab system
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
        document.getElementById('collect-btn').addEventListener('click', () => this.addFlux(1 * this.coherence));

        // Reboot
        document.getElementById('reboot-btn').addEventListener('click', () => this.executeReboot());

        this.renderUpgrades();
    }

    addFlux(amount) {
        this.flux += amount;
        this.totalFlux += amount;
        this.updateUI();
    }

    getRate() {
        let base = 0;
        let mult = 1;

        this.upgrades.forEach(u => {
            if (!u.type) base += u.count * u.power;
            else if (u.type === 'mult') mult *= (u.power ** u.count);
        });

        return base * mult * this.coherence;
    }

    getZenithTarget() {
        // HIDDEN SCALING: Every point of coherence increases the target exponent by 1.2
        // while it only linearly (or quadratically) increases player power.
        // Base target: 1e15 (Coherence 1.0)
        // Next target: 1e16.2 (Coherence 2.0)
        // Player power at C2.0 is only ~10x-100x higher, but target is ~15.8x higher.
        // As Coherence grows, the gap widens.
        return Math.pow(10, 15 + (1.2 * (this.coherence - 1)));
    }

    getRebootRequirement() {
        return Math.pow(10, 10 + (2.5 * (this.coherence - 1)));
    }

    renderUpgrades() {
        const list = document.getElementById('upgrade-list');
        list.innerHTML = '';
        this.upgrades.forEach(u => {
            const cost = this.getCost(u);
            const card = document.createElement('div');
            card.className = `upgrade-card ${this.flux >= cost ? 'available' : 'locked'}`;
            card.innerHTML = `
                <div class="upgrade-title">${u.name} [${u.count}]</div>
                <div class="upgrade-desc">${u.desc}</div>
                <div class="upgrade-cost">Cost: ${this.format(cost)} Flux</div>
                <button class="buy-btn" onclick="game.buyUpgrade('${u.id}')">OPTIMIZE</button>
            `;
            list.appendChild(card);
        });
    }

    getCost(u) {
        return u.baseCost * (u.costMult ** u.count);
    }

    buyUpgrade(id) {
        const u = this.upgrades.find(u => u.id === id);
        const cost = this.getCost(u);
        if (this.flux >= cost) {
            this.flux -= cost;
            u.count++;
            this.notify(`Optimization successful: ${u.name} leveled.`);
            this.renderUpgrades();
            this.updateUI();
        }
    }

    executeReboot() {
        const req = this.getRebootRequirement();
        if (this.flux >= req) {
            this.coherence += 1;
            this.flux = 0;
            this.upgrades.forEach(u => u.count = 0);
            this.rebootCount++;
            this.notify(`Dimensional Coherence stabilized to Level ${this.coherence.toFixed(0)}.`);
            this.renderUpgrades();
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById('flux-count').textContent = this.format(this.flux);
        document.getElementById('flux-rate').textContent = `${this.format(this.getRate())} /s`;
        document.getElementById('coherence-level').textContent = this.coherence.toFixed(3);

        // Zenith Tab
        const target = this.getZenithTarget();
        const progress = (this.flux / target) * 100;
        const clampedProgress = Math.min(progress, 99.999999); // Never show 100%
        
        document.getElementById('zenith-percent').textContent = `${clampedProgress.toFixed(7)}%`;
        document.getElementById('zenith-bar').style.width = `${clampedProgress}%`;
        document.getElementById('zenith-current').textContent = this.format(this.flux);
        document.getElementById('zenith-target').textContent = this.format(target);

        // Reboot Tab
        const req = this.getRebootRequirement();
        document.getElementById('current-coherence').textContent = this.coherence.toFixed(3);
        document.getElementById('next-coherence').textContent = (this.coherence + 1).toFixed(3);
        document.getElementById('reboot-requirement').textContent = `Requires ${this.format(req)} Flux`;
        
        const rebootBtn = document.getElementById('reboot-btn');
        if (this.flux >= req) {
            rebootBtn.classList.remove('disabled');
            document.getElementById('reboot-warning').classList.add('hidden');
        } else {
            rebootBtn.classList.add('disabled');
            document.getElementById('reboot-warning').classList.remove('hidden');
        }

        // Upgrade status
        document.querySelectorAll('.upgrade-card').forEach((card, i) => {
            const u = this.upgrades[i];
            const cost = this.getCost(u);
            if (this.flux >= cost) card.classList.remove('locked'), card.classList.add('available');
            else card.classList.add('locked'), card.classList.remove('available');
        });
    }

    format(num) {
        if (num < 1000) return num.toFixed(3);
        const exp = Math.floor(Math.log10(num));
        const mantissa = num / Math.pow(10, exp);
        return `${mantissa.toFixed(2)}e${exp}`;
    }

    notify(msg) {
        const bar = document.getElementById('notification-bar');
        bar.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    }

    startLoop() {
        setInterval(() => {
            const now = Date.now();
            const delta = (now - this.lastTick) / 1000;
            this.lastTick = now;

            const gain = this.getRate() * delta;
            this.addFlux(gain);
        }, 50);
    }

    saveGame() {
        const data = {
            flux: this.flux,
            totalFlux: this.totalFlux,
            coherence: this.coherence,
            rebootCount: this.rebootCount,
            upgrades: this.upgrades.map(u => ({ id: u.id, count: u.count }))
        };
        localStorage.setItem('zenith_save', JSON.stringify(data));
    }

    loadGame() {
        const saved = localStorage.getItem('zenith_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.flux = data.flux || 0;
            this.totalFlux = data.totalFlux || 0;
            this.coherence = data.coherence || 1.0;
            this.rebootCount = data.rebootCount || 0;
            data.upgrades.forEach(su => {
                const u = this.upgrades.find(u => u.id === su.id);
                if (u) u.count = su.count;
            });
        }
    }
}

// Global instance for inline handlers
const game = new GameEngine();
window.game = game;

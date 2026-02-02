(function () {
    'use strict';

    const CONFIG = {
        canvasW: 800,
        canvasH: 267,
        handleSize: 8,
        hitArea: 12,
        colors: {
            primary: '#3b82f6',
            secondary: '#22d3ee',
            bg: '#020617'
        }
    };

    const ImageEditorPlugin = {
        name: "Изображения баннера",

        state: {
            img: null,
            image: { x: 0, y: 0, w: 0, h: 0 },
            crop: { x: 200, y: 40, w: 400, h: 187 },
            mode: null,
            handle: null,
            startMouse: null,
            startBox: null,
            cropEnabled: false
        },

        renderSettings() {
            return `
                <button class="settings-modal__option svelte-1jqzo7p" onclick="console.log('FewerEngine: Редактор баннеров активен')">
                    <div class="settings-modal__option-content svelte-1jqzo7p">
                        <div class="settings-modal__option-icon svelte-1jqzo7p">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                        <div class="settings-modal__option-text svelte-1jqzo7p">
                            <div class="settings-modal__option-name svelte-1jqzo7p">${this.name}</div>
                            <div class="settings-modal__option-desc svelte-1jqzo7p">Все что хочешь жоск, только не всякую фигню</div>
                        </div>
                    </div>
                    <svg class="settings-modal__option-arrow svelte-1jqzo7p" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            `;
        },

        install(fe) {
            console.log(`[FE] Плагин "${this.name}" успешно запущен`);
            this.injectStyles();
            this.initToolbarButton();
        },

        getMousePos(canvas, e) {
            const r = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - r.left) * (CONFIG.canvasW / r.width),
                y: (clientY - r.top) * (CONFIG.canvasH / r.height)
            };
        },

        getHandles(box) {
            return {
                nw: [box.x, box.y], ne: [box.x + box.w, box.y],
                se: [box.x + box.w, box.y + box.h], sw: [box.x, box.y + box.h]
            };
        },

        hitHandle(pos, box) {
            const handles = this.getHandles(box);
            for (const k in handles) {
                const [hx, hy] = handles[k];
                if (Math.hypot(pos.x - hx, pos.y - hy) < CONFIG.hitArea) return k;
            }
            return null;
        },

        resizeBox(start, handle, dx, dy, shiftKey) {
            const b = { ...start };
            if (shiftKey) {
                const aspect = start.w / start.h;
                if (Math.abs(dx) > Math.abs(dy)) dy = dx / aspect;
                else dx = dy * aspect;
            }
            if (handle.includes('e')) b.w += dx;
            if (handle.includes('s')) b.h += dy;
            if (handle.includes('w')) { b.x += dx; b.w -= dx; }
            if (handle.includes('n')) { b.y += dy; b.h -= dy; }
            if (b.w < 20) { b.w = 20; if (handle.includes('w')) b.x = start.x + start.w - 20; }
            if (b.h < 20) { b.h = 20; if (handle.includes('n')) b.y = start.y + start.h - 20; }
            return b;
        },

        drawScene(ctx) {
            const S = this.state; 
            ctx.fillStyle = CONFIG.colors.bg;
            ctx.fillRect(0, 0, CONFIG.canvasW, CONFIG.canvasH);
            if (!S.img) return;

            ctx.drawImage(S.img, S.image.x, S.image.y, S.image.w, S.image.h);
            this.drawBox(ctx, S.image, CONFIG.colors.primary, 'Фото');

            if (S.cropEnabled) {
                ctx.fillStyle = 'rgba(0,0,0,.7)';
                ctx.beginPath();
                ctx.rect(0, 0, CONFIG.canvasW, CONFIG.canvasH);
                ctx.rect(S.crop.x, S.crop.y, S.crop.w, S.crop.h);
                ctx.fill('evenodd');
                this.drawBox(ctx, S.crop, CONFIG.colors.secondary, 'Область');
            }
        },

        drawBox(ctx, box, color, label) {
            ctx.strokeStyle = color;
            ctx.setLineDash(label === 'Фото' ? [5, 5] : []);
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            Object.values(this.getHandles(box)).forEach(([x, y]) => {
                ctx.beginPath(); ctx.arc(x, y, CONFIG.handleSize / 2, 0, Math.PI * 2); ctx.fill();
            });
        },

        renderUI() {
            const mainCanvas = document.querySelector('.drawing-canvas');
            if (!mainCanvas) return;

            const overlay = document.createElement('div');
            overlay.className = 'fe-overlay';
            const canvas = document.createElement('canvas');
            canvas.width = CONFIG.canvasW; canvas.height = CONFIG.canvasH;
            canvas.className = 'fe-canvas';
            
            const panel = document.createElement('div');
            panel.className = 'fe-panel';
            panel.innerHTML = `
                <button class="fe-btn" data-act="crop"><svg viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg></button>
                <button class="fe-btn primary" data-act="apply"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></button>
                <button class="fe-btn danger" data-act="cancel"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            `;

            overlay.append(canvas, panel);
            document.body.appendChild(overlay);
            const ctx = canvas.getContext('2d');
            this.drawScene(ctx);

            const handleDown = e => {
                const pos = this.getMousePos(canvas, e);
                const S = this.state;
                const cropH = S.cropEnabled ? this.hitHandle(pos, S.crop) : null;
                const imgH = this.hitHandle(pos, S.image);

                if (cropH) { S.mode = 'res-c'; S.handle = cropH; }
                else if (imgH) { S.mode = 'res-i'; S.handle = imgH; }
                else if (S.cropEnabled && pos.x > S.crop.x && pos.x < S.crop.x + S.crop.w && pos.y > S.crop.y && pos.y < S.crop.y + S.crop.h) { S.mode = 'mov-c'; }
                else if (pos.x > S.image.x && pos.x < S.image.x + S.image.w && pos.y > S.image.y && pos.y < S.image.y + S.image.h) { S.mode = 'mov-i'; }

                if (S.mode) {
                    S.startMouse = pos;
                    S.startBox = S.mode.endsWith('c') ? { ...S.crop } : { ...S.image };
                }
            };

            const handleMove = e => {
                const S = this.state;
                if (!S.mode) return;
                const pos = this.getMousePos(canvas, e);
                const dx = pos.x - S.startMouse.x;
                const dy = pos.y - S.startMouse.y;

                if (S.mode === 'mov-i') { S.image.x = S.startBox.x + dx; S.image.y = S.startBox.y + dy; }
                if (S.mode === 'mov-c') { S.crop.x = S.startBox.x + dx; S.crop.y = S.startBox.y + dy; }
                if (S.mode === 'res-i') S.image = this.resizeBox(S.startBox, S.handle, dx, dy, e.shiftKey);
                if (S.mode === 'res-c') S.crop = this.resizeBox(S.startBox, S.handle, dx, dy, e.shiftKey);
                requestAnimationFrame(() => this.drawScene(ctx));
            };

            const handleUp = () => this.state.mode = null;

            canvas.addEventListener('mousedown', handleDown);
            canvas.addEventListener('touchstart', handleDown, { passive: false });
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchend', handleUp);

            panel.onclick = e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const act = btn.dataset.act;

                if (act === 'crop') {
                    this.state.cropEnabled = !this.state.cropEnabled;
                    btn.classList.toggle('active');
                    this.drawScene(ctx);
                } else if (act === 'cancel') {
                    cleanup();
                } else if (act === 'apply') {
                    const m = mainCanvas.getContext('2d');
                    const S = this.state;
                    const temp = document.createElement('canvas');
                    temp.width = CONFIG.canvasW; temp.height = CONFIG.canvasH;
                    const tctx = temp.getContext('2d');
                    tctx.fillStyle = CONFIG.colors.bg;
                    tctx.fillRect(0, 0, temp.width, temp.height);
                    tctx.drawImage(S.img, S.image.x, S.image.y, S.image.w, S.image.h);
                    m.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
                    if (S.cropEnabled) {
                        m.drawImage(temp, S.crop.x, S.crop.y, S.crop.w, S.crop.h, 0, 0, mainCanvas.width, mainCanvas.height);
                    } else {
                        m.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, mainCanvas.width, mainCanvas.height);
                    }
                    mainCanvas.dispatchEvent(new Event('input', { bubbles: true }));
                    cleanup();
                }
            };

            const cleanup = () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                window.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleUp);
                overlay.remove();
            };
        },

        injectStyles() {
            if (document.getElementById('fe-editor-style')) return;
            const s = document.createElement('style');
            s.id = 'fe-editor-style';
            s.textContent = `
                .fe-overlay { position: fixed; inset: 0; background: rgba(2,6,23,.9); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
                .fe-canvas { background: #000; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-width: 95vw; touch-action: none; }
                .fe-panel { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; padding: 12px; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; z-index: 10000; }
                .fe-btn { width: 48px; height: 48px; border-radius: 14px; border: none; background: #1e293b; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .fe-btn:hover { background: #334155; }
                .fe-btn.active { background: ${CONFIG.colors.primary}; }
                .fe-btn.primary { background: #2563eb; }
                .fe-btn.danger { background: #dc2626; }
                .fe-btn svg { width: 22px; height: 22px; stroke: #fff; fill: none; stroke-width: 2; }
            `;
            document.head.appendChild(s);
        },

        openEditor(file) {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    this.state.img = img;
                    const k = Math.min(CONFIG.canvasW / img.width, CONFIG.canvasH / img.height) * 0.8;
                    this.state.image = {
                        w: img.width * k, h: img.height * k,
                        x: (CONFIG.canvasW - img.width * k) / 2,
                        y: (CONFIG.canvasH - img.height * k) / 2
                    };
                    this.renderUI();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        initToolbarButton() {
            const checkInterval = setInterval(() => {
                const bar = document.querySelector('.toolbar-tools');
                if (!bar || document.getElementById('fe-open-editor')) return;
                const btn = document.createElement('button');
                btn.id = 'fe-open-editor';
                btn.className = 'tool-btn svelte-12bmgzp';
                btn.style.backgroundColor = CONFIG.colors.primary;
                btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M21 15l-5-5L5 21"></path></svg>`;
                btn.onclick = (e) => {
                    e.preventDefault();
                    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
                    i.onchange = e => e.target.files[0] && this.openEditor(e.target.files[0]);
                    i.click();
                };
                bar.prepend(btn);
            }, 1000);
        }
    };

    function bootstrapEditor() {
        if (window.FewerEngine) {
            window.FewerEngine.use(ImageEditorPlugin);
        } else {
            setTimeout(bootstrapEditor, 100);
        }
    }
    bootstrapEditor();

})();
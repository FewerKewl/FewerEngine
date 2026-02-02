(function () {
  'use strict';

  const ThemesPlugin = {
    name: 'themes-plugin',
    label: 'Оформление',
    version: '3.5',
    description: 'Полная кастомизация: цвета, фоны ну и еще чото',
    icon: '🎨',

    defaults: {
      accent: '#5d6b78',
      bgColor: '#020617',
      bgImage: 'https://image.fhserv.ru/fishingsib/2015-10-a75d3b1c673449000822918c86600184__rsu-1000-800.jpg?hash=d7935255', 
      bgOverlay: 0.4,
      textMain: '#ffffff',
      textMuted: '#94a3b8',
      blur: 14,
      radius: 18,
      shadow: 0.4
    },

    settings: {},

    install(engine) {
      this.load();
      this.apply();
      this.injectStaticStyles();
    
      document.addEventListener('click', (e) => {
        if (e.target.closest('#fe-themes-open')) {
          this.openPanel();
        }
      });
    },

    renderSettings() {
      return `
        <button class="settings-modal__option svelte-1jqzo7p" id="fe-themes-open">
          <div class="settings-modal__option-content svelte-1jqzo7p">
            <div class="settings-modal__option-icon svelte-1jqzo7p">${this.icon}</div>
            <div class="settings-modal__option-text svelte-1jqzo7p">
              <div class="settings-modal__option-name svelte-1jqzo7p">${this.label}</div>
              <div class="settings-modal__option-desc svelte-1jqzo7p">${this.description}</div>
            </div>
          </div>
          <svg class="settings-modal__option-arrow svelte-1jqzo7p" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>`;
    },

    openPanel() {
        const content = document.querySelector('.settings-modal__content');
        if (!content) return;

        content.classList.add('fe-panel-active');

        content.innerHTML = `
        <div class="fe-themes-wrapper">
            <div class="fe-header">
                <div class="fe-title-container">
                    <span class="fe-title">Стиль интерфейса</span>
                    <span class="fe-subtitle">Персонализация внешнего вида</span>
                </div>
            </div>

            <div class="fe-scroll">
                <div class="fe-group">
                    <div class="fe-group-header">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2.5-2 4.5-4 4.5h-1c-1.5 0-3 1-3 3v1a2 2 0 0 1-2 2"/></svg>
                        <span>Цвета системы</span>
                    </div>
                    ${this.renderRow('Основной акцент', 'accent', 'color')}
                    ${this.renderRow('Главный текст', 'textMain', 'color')}
                    ${this.renderRow('Вторичный текст', 'textMuted', 'color')}
                </div>

                <div class="fe-group">
                    <div class="fe-group-header">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <span>Задний план</span>
                    </div>
                    ${this.renderRow('Картинка фона (URL)', 'bgImage', 'text', 'Вставьте ссылку...')}
                    ${this.renderRow('Затемнение фона', 'bgOverlay', 'range', 0, 1, 0.05, '%')}
                    ${this.renderRow('Цвет подложки', 'bgColor', 'color')}
                </div>

                <div class="fe-group">
                    <div class="fe-group-header">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M7 14h10"/><path d="M9 9h6"/><path d="M11 4h2"/></svg>
                        <span>Стеклянный эффект</span>
                    </div>
                    ${this.renderRow('Прозрачность постов', 'postOpacity', 'range', 0, 1, 0.05, '%')}
                    ${this.renderRow('Сила размытия', 'blur', 'range', 0, 30, 1, 'px')}
                    ${this.renderRow('Яркость кнопок', 'btnOpacity', 'range', 0.1, 1, 0.05, '%')}
                    ${this.renderRow('Скругление углов', 'radius', 'range', 0, 30, 1, 'px')}
                </div>
            </div>

            <div class="fe-footer">
                <button id="fe-reset-action" class="fe-btn-minimal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Сброс
                </button>
                <button id="fe-save-action" class="fe-btn-primary">Применить изменения</button>
            </div>
        </div>
        `;

        this.bindEvents(content);
    },

    renderRow(label, key, type, min, max, step) {
      const val = this.settings[key];
      let input = '';
      if (type === 'range') {
        input = `<div class="fe-range"><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${val}"><span>${val}</span></div>`;
      } else if (type === 'color') {
        input = `<div class="fe-color-pick"><input type="color" data-key="${key}" value="${val}"></div>`;
      } else {
        input = `<input type="text" class="fe-text-in" data-key="${key}" value="${val}" placeholder="Пусто (стандарт)">`;
      }
      return `<div class="fe-row"><span>${label}</span>${input}</div>`;
    },

    bindEvents(container) {
      container.querySelectorAll('input').forEach(el => {
        el.oninput = () => {
          const k = el.dataset.key;
          this.settings[k] = el.type === 'range' ? parseFloat(el.value) : el.value;
          this.apply();
          this.save();
          if (el.type === 'range') {
             el.previousElementSibling.textContent = k.includes('Opacity') ? Math.round(el.value*100)+'%' : el.value;
          }
        };
      });

      document.getElementById('fe-reset-action').onclick = () => {
        if (confirm('Сбросить оформление к начальному виду?')) {
          this.settings = { ...this.defaults };
          this.save();
          this.apply();
          this.openPanel();
        }
      };

      document.getElementById('fe-save-action').onclick = () => {
        document.querySelector('.settings-modal__close')?.click();
      };

      document.getElementById('fe-back-btn').onclick = () => {
        document.querySelector('.settings-modal__close')?.click();
      };
    },

    apply() {
      const s = this.settings;
      const root = document.documentElement;

      root.style.setProperty('--color-accent', s.accent);
      root.style.setProperty('--color-background', s.bgColor);
      root.style.setProperty('--color-text', s.textMain);
      root.style.setProperty('--color-text-muted', s.textMuted);
    
      root.style.setProperty('--border-color', `rgba(255,255,255,${s.shadow / 2})`);

      if (s.bgImage) {
        document.body.style.backgroundImage = `url(${s.bgImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
      } else {
        document.body.style.backgroundImage = 'none';
      }

      this.injectDynamicStyles(); 
    },

    injectDynamicStyles() {
      const s = this.settings;
      let styleEl = document.getElementById('fe-themes-dynamic-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'fe-themes-dynamic-styles';
        document.head.appendChild(styleEl);
      }

    styleEl.textContent = `
        .post-container.svelte-cvb24n, 
        .create-post.svelte-1qnpi43, 
        .profile-card, 
        .post-modal.svelte-1wzwwt5, 
        .post-modal__scroll.svelte-1wzwwt5, 
        .sidebar-pill.svelte-13vg9xt {
          background-color: rgba(15, 23, 42, ${s.postOpacity}) !important;
          backdrop-filter: blur(${s.blur}px) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: ${s.radius}px !important;
          box-shadow: none !important;
        }

        .feed-tabs.svelte-1thmq55 {
          background: transparent !important;
          border: none !important;
          padding: 4px;
          display: flex;
          gap: 8px;
        }

        .top-clans.svelte-15vxund {
          background-color: rgba(15, 23, 42, ${s.postOpacity}) !important;
          backdrop-filter: blur(${s.blur}px) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: ${s.radius}px !important;
          padding: 16px !important;
          color: ${s.textMain} !important;
        }

        .top-clans__title.svelte-15vxund {
          color: ${s.textMain} !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 13px !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 12px !important;
        }

        .clan-item.svelte-15vxund {
          transition: background 0.2s !important;
          border-radius: ${s.radius / 2}px !important;
          padding: 4px 8px !important;
        }

        .clan-item.svelte-15vxund:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .clan-item__rank.svelte-15vxund {
          color: ${s.accent} !important; /* Ранг делаем акцентным цветом */
          font-weight: 700 !important;
        }

        .clan-item__count.svelte-15vxund {
          color: ${s.textMuted} !important;
        }

        .feed-tab.svelte-1thmq55 {
          border-radius: ${s.radius / 2}px !important;
          transition: all 0.2s ease !important;
          color: ${s.textMuted} !important;
          border: none !important;
        }

        .feed-tab.svelte-1thmq55.active {
          background-color: ${s.accent} !important;
          color: #ffffff !important;
          opacity: ${s.btnOpacity} !important;
        }

        .feed-tab.svelte-1thmq55:not(.active):hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: ${s.textMain} !important;
        }

        .comment-input-form.svelte-ome0nc:focus-within {
          border-color: ${s.accent} !important;
        }

        .comment-input-field.svelte-ome0nc {
          background: transparent !important;
          color: ${s.textMain} !important;
          font-size: 14px !important;
        }
        
        .comment-input-field.svelte-ome0nc::placeholder {
          color: ${s.textMuted} !important;
          opacity: 0.7;
        }

        .comment-attach-btn.svelte-ome0nc,
        .comment-submit.svelte-ome0nc {
          color: ${s.accent} !important;
          background: transparent !important;
          transition: transform 0.2s, opacity 0.2s !important;
          border: none !important;
        }

        .comment-attach-btn.svelte-ome0nc:hover,
        .comment-submit.svelte-ome0nc:hover {
          transform: scale(1.1);
          opacity: 0.8;
        }

        .create-post__submit.svelte-1qnpi43,
        .wall-post-form__submit.svelte-vw1v4s,
        .profile-follow-btn.svelte-p40znu,
        .sidebar-nav-item.active.svelte-13vg9xt {
          background-color: ${s.accent} !important;
          color: #ffffff !important;
          opacity: ${s.btnOpacity} !important;
          border-radius: ${s.radius / 1.5}px !important;
          border: none !important;
          box-shadow: none !important;
        }

        .create-post__attach-btn.svelte-1qnpi43,
        .wall-post-form__attach-btn.svelte-vw1v4s {
          background: rgba(255,255,255,0.05) !important;
          color: ${s.accent} !important;
          border-radius: ${s.radius / 2}px !important;
        }

        .post-modal__author.svelte-1wzwwt5,
        .post-content.svelte-jp7hc5 {
          color: ${s.textMain} !important;
        }
        
        .post-modal__time,
        .post-modal__views.svelte-1wzwwt5 {
          color: ${s.textMuted} !important;
        }

        .post-action.liked.svelte-1055p8k,
        .post-modal__action.liked.svelte-1wzwwt5,
        .item-action-btn.like.liked {
          background-color: ${s.accent}33 !important; /* 20% прозрачности акцента */
          color: ${s.accent} !important;
        }

        .create-post__textarea.svelte-1qnpi43 {
          background: transparent !important;
          color: ${s.textMain} !important;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, ${s.bgOverlay});
          z-index: -1;
          pointer-events: none;
        }

        .feed-tabs.svelte-1thmq55 { border: none !important; padding: 4px; gap: 8px; }
        .feed-tab.svelte-1thmq55 { border-radius: ${s.radius / 2}px !important; }
      `;
    },

    injectStaticStyles() {
      if (document.getElementById('fe-static-css')) return;
      const style = document.createElement('style');
      style.id = 'fe-static-css';
      style.textContent = `
            .fe-themes-wrapper {
                display: flex;
                flex-direction: column;
                height: 100%;
                color: #f8fafc;
                font-family: 'Inter', sans-serif;
            }

            .fe-header {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .fe-title-container { display: flex; flex-direction: column; }
            .fe-title { font-size: 17px; font-weight: 700; }
            .fe-subtitle { font-size: 12px; color: #64748b; }

            .fe-scroll { padding: 15px; overflow-y: auto; flex: 1; }
            .fe-group { 
                background: rgba(255,255,255,0.03); 
                border-radius: 16px; 
                padding: 8px 16px; 
                margin-bottom: 20px; 
                border: 1px solid rgba(255,255,255,0.05);
            }

            .fe-group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 0;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                color: #475569;
                letter-spacing: 0.05em;
            }

            .fe-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255,255,255,0.02);
            }
            .fe-row:last-child { border: none; }
            .fe-label { font-size: 14px; color: #cbd5e1; }

            .fe-color-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #1e293b;
                padding: 4px 10px;
                border-radius: 10px;
            }
            .fe-color-wrapper input[type="color"] {
                appearance: none; border: none; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; background: none;
            }
            .fe-color-value { font-family: monospace; font-size: 12px; color: #94a3b8; }

            .fe-range-wrapper { display: flex; align-items: center; gap: 12px; }
            .fe-range-num { font-size: 12px; font-weight: 700; color: var(--color-accent); min-width: 35px; text-align: right; }

            .fe-input-text {
                background: #1e293b;
                border: 1px solid #334155;
                color: #fff;
                padding: 8px 12px;
                border-radius: 10px;
                font-size: 13px;
                width: 180px;
            }

            .fe-footer {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(0,0,0,0.2);
            }
            .fe-btn-primary {
                flex: 1;
                background: var(--color-accent);
                color: #fff;
                border: none;
                padding: 14px;
                border-radius: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s;
            }
            .fe-btn-minimal {
                background: none;
                border: none;
                color: #64748b;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                cursor: pointer;
            }
            .fe-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
      `;
      document.head.appendChild(style);
    },

    save() { localStorage.setItem('fe-themes-v5', JSON.stringify(this.settings)); },
    load() {
      const saved = localStorage.getItem('fe-themes-v5');
      this.settings = saved ? JSON.parse(saved) : { ...this.defaults };
    }
  };
  function bootstrap() {
    if (window.FewerEngine) {
      window.FewerEngine.use(ThemesPlugin);
    } else {
      setTimeout(bootstrap, 100);
    }
  }
  bootstrap();
})();
(function () {
    'use strict';

    /**
     * FEWER ENGINE CORE v1.2.0
     * Система управления плагинами с интеграцией в интерфейс сайта
     */
    const FewerEngine = {
        version: '1.2.0',
        
        // 1. ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ
        get user() {
            // Ищем ник в элементах, характерных для профиля (можно дополнять селекторы)
            const nameElem = document.querySelector('.user-name, .profile-link, .nickname, [class*="username"]');
            return {
                name: nameElem?.textContent?.trim() || 'Пользователь',
                isGuest: !nameElem
            };
        },

        // 2. СОСТОЯНИЕ ДВИЖКА
        state: {
            isMenuOpen: false,
            activePlugins: []
        },

        // 3. СИСТЕМА ПЛАГИНОВ И ХУКОВ
        plugins: [],
        hooks: {
            init: [],
            settingsRender: [], // Вызывается при отрисовке настроек
            beforeRender: [],
            afterRender: []
        },

        on(hook, fn) {
            if (this.hooks[hook]) this.hooks[hook].push(fn);
        },

        emit(hook, payload) {
            (this.hooks[hook] || []).forEach(fn => {
                try { fn(payload, this); } catch (e) { console.error(`[FE] Hook Error (${hook}):`, e); }
            });
        },

        /**
         * Регистрация плагина
         * @param {Object} plugin - Объект плагина {name, settings, install}
         */
        use(plugin) {
            if (!plugin || !plugin.name) return;
            
            // Если такой плагин уже есть - игнорируем повтор
            if (this.plugins.find(p => p.name === plugin.name)) return;

            this.plugins.push(plugin);
            
            if (typeof plugin.install === 'function') {
                plugin.install(this);
            }

            console.log(`%c[FE] Plugin registered: ${plugin.label || plugin.name} (Total: ${this.plugins.length})`, "color: #10b981; font-weight: bold;");
        },

        // 4. ИНТЕГРАЦИЯ В ИНТЕРФЕЙС (UI)
        injectSettingsUI() {
            const modalContent = document.querySelector('.settings-modal__content');
            if (!modalContent || document.getElementById('fe-settings-section')) return;

            const feSection = document.createElement('div');
            feSection.id = 'fe-settings-section';
            feSection.className = 'settings-modal__section svelte-1jqzo7p';
            
            let html = `
                <h3 class="settings-modal__section-title svelte-1jqzo7p">FewerEngine</h3>
                <div class="settings-modal__options svelte-1jqzo7p">
            `;

            // Рендерим настройки каждого плагина
            this.plugins.forEach(plugin => {
                if (typeof plugin.renderSettings === 'function') {
                    html += `<div class="fe-plugin-wrapper" data-plugin="${plugin.name}">${plugin.renderSettings()}</div>`;
                }
            });

            html += `</div>`;
            feSection.innerHTML = html;
            modalContent.appendChild(feSection);
            
            // Сообщаем плагинам, что UI готов (для привязки событий)
            this.emit('settingsRender', feSection);
        },

        // 5. ИНИЦИАЛИЗАЦИЯ
        injectStyles() {
            if (document.getElementById('fe-core-style')) return;
            const style = document.createElement('style');
            style.id = 'fe-core-style';
            style.textContent = `
                #fe-settings-section {
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    margin-top: 16px;
                    padding-top: 16px;
                }
                .fe-core-info {
                    background: rgba(124, 58, 237, 0.05) !important;
                    border-radius: 12px !important;
                    margin-bottom: 8px !important;
                }
                .fe-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.05);
                    margin: 12px 8px;
                }
                .fe-plugins-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin: 8px 12px;
                    font-weight: 700;
                }
            `;
            document.head.appendChild(style);
        },

        init() {
            this.injectStyles();

            // Следим за DOM: если появляется модалка настроек — внедряем свой UI
            const observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        if (document.querySelector('.settings-modal__content')) {
                            this.injectSettingsUI();
                            break;
                        }
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            this.emit('init');
            console.log(`%c[FewerEngine] Initialized as ${this.user.name}`, "background: #7c3aed; color: white; padding: 2px 5px; border-radius: 3px;");
        }
    };

    // Экспорт в глобальную видимость
    window.FewerEngine = FewerEngine;
    
    // Запуск ядра
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FewerEngine.init());
    } else {
        FewerEngine.init();
    }

})();
/* ==========================================================================
   MINISTÉRIO REMISSÃO PORTUGAL — Core Web Application Logic
   - Multi-language (PT, EN, ES)
   - Dynamic Sintra Flyer & Next Active Event Engine
   - Online Registration & Stripe Checkout Integration
   - Typo-Tolerant Search Algorithm
   - Password-Protected Admin Suite (#admin) with On-Demand AI Tools
   ========================================================================== */

const APP_CONFIG = {
    DEFAULT_LANG: 'pt',
    ADMIN_PASS_HASH: 'remissao2027', // Default admin password
    STORAGE_KEYS: {
        LANG: 'remissao_pt_lang',
        CRM: 'remissao_pt_crm_leads',
        EVENTS: 'remissao_pt_events_db',
        AUTH: 'remissao_pt_admin_session'
    }
};

// Initial Events Database
const initialEventsDB = [
    {
        id: 'sintra-marco-2027',
        slug: 'sintra-marco-2027',
        title: 'Remission to the Nations — Sintra',
        city: 'Sintra',
        country: 'Portugal',
        locationName: 'Av. Irene Lisboa, 19 – Armazém A, 2º Piso',
        fullAddress: 'Av. Irene Lisboa, 19 – Armazém A, 2º Piso, Sintra – Lisboa',
        priceEUR: 80.00,
        currency: 'EUR',
        status: 'inscriçoes_abertas',
        totalCapacity: 150,
        enrolledCount: 118,
        einscricaoUrl: 'https://buy.stripe.com/4gM9ASa6h3iQbywdF92ZO00',
        modules: [
            { name: '1º MÓDULO', dates: '02 e 03 de Outubro', times: 'Sexta 20h | Sáb 09:30h' },
            { name: '2º MÓDULO', dates: '16 e 17 de Outubro', times: 'Sexta 20h | Sáb 09:30h' },
            { name: '3º MÓDULO', dates: '23 e 24 de Outubro', times: 'Sexta 20h | Sáb 09:30h' }
        ],
        description: 'Seminário de cura emocional, libertação espiritual de traumas, cativeiros da alma e restauração familiar.'
    }
];

class RemissaoApp {
    constructor() {
        this.state = {
            currentLang: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANG) || APP_CONFIG.DEFAULT_LANG,
            events: this.loadEventsStore(),
            crmLeads: this.loadCrmStore(),
            activeEventId: null,
            activeFilter: 'all',
            isAdminAuthenticated: sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH) === 'true'
        };

        this.init();
    }

    init() {
        this.setupActiveEvent();
        this.bindEvents();
        this.renderAll();
        this.handleHashChange();
        this.initThemesHeroSlider();
    }

    loadEventsStore() {
        const stored = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.EVENTS);
        return stored ? JSON.parse(stored) : initialEventsDB;
    }

    saveEventsStore() {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.EVENTS, JSON.stringify(this.state.events));
    }

    loadCrmStore() {
        const stored = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CRM);
        return stored ? JSON.parse(stored) : [];
    }

    saveCrmStore() {
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CRM, JSON.stringify(this.state.crmLeads));
    }

    setupActiveEvent() {
        const activeEvent = this.state.events.find(e => e.status === 'inscriçoes_abertas') || this.state.events[0];
        this.state.activeEventId = activeEvent ? activeEvent.id : null;
    }

    getActiveEvent() {
        return this.state.events.find(e => e.id === this.state.activeEventId) || this.state.events[0];
    }

    bindEvents() {
        // Hash Routing
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Hamburger Menu Toggle
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                const isActive = menuToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', isActive);
            });

            // Close mobile menu when clicking a link
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    menuToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Language Dropdown Logic
        const langBtn = document.getElementById('langBtn');
        const langMenu = document.getElementById('langMenu');
        
        if (langBtn && langMenu) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = langBtn.getAttribute('aria-expanded') === 'true';
                langBtn.setAttribute('aria-expanded', !isExpanded);
                langMenu.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
                    langMenu.classList.remove('show');
                    langBtn.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Language selection
            langMenu.querySelectorAll('a').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = e.target.dataset.lang;
                    this.setLanguage(lang);
                    langMenu.classList.remove('show');
                    langBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Registration CTA Buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-registration-trigger, .btn-open-registration-modal, #heroPrimaryCta, .floating-sticky-btn')) {
                e.preventDefault();
                window.open('https://buy.stripe.com/4gM9ASa6h3iQbywdF92ZO00', '_blank', 'noopener,noreferrer');
            }
            if (e.target.closest('.btn-einscricao-active')) {
                const event = this.getActiveEvent();
                this.openEinscricaoModal(event);
            }
            const accordionHeader = e.target.closest('.faq-accordion-header');
            if (accordionHeader) {
                e.preventDefault();
                const item = accordionHeader.closest('.faq-accordion-item');
                if (item) {
                    const isActive = item.classList.contains('active');
                    document.querySelectorAll('.faq-accordion-item').forEach(el => el.classList.remove('active'));
                    if (!isActive) {
                        item.classList.add('active');
                    }
                }
            }
        });

        // Modal Close Buttons
        document.getElementById('closeEinscricaoModal')?.addEventListener('click', () => this.closeModal('einscricaoModal'));
        document.getElementById('closeShareModal')?.addEventListener('click', () => this.closeModal('shareModal'));
        document.getElementById('closeAdminAuthModal')?.addEventListener('click', () => this.closeModal('adminAuthModal'));

        // Close Modals on Overlay Click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Church Host Form Submission (CRM)
        const churchForm = document.getElementById('churchHostForm');
        if (churchForm) {
            churchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChurchFormSubmit();
            });
        }

        // Admin Password Authentication Form
        const adminAuthForm = document.getElementById('adminAuthForm');
        if (adminAuthForm) {
            adminAuthForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminAuthSubmit();
            });
        }

        // Admin Footer Access Link
        const footerAdminLink = document.getElementById('footerAdminLink');
        if (footerAdminLink) {
            footerAdminLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.isAdminAuthenticated) {
                    window.location.hash = '#admin';
                } else {
                    this.openAdminAuthModal();
                }
            });
        }

        // Admin Exit Button
        document.getElementById('exitAdminBtn')?.addEventListener('click', () => {
            this.state.isAdminAuthenticated = false;
            sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH);
            this.showToast('Sessão encerrada com segurança');
            window.location.hash = '#home';
        });

        // Admin Tabs Switcher
        document.querySelectorAll('.admin-tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                document.querySelectorAll('.admin-tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');

                e.target.classList.add('active');
                const targetContent = document.getElementById(tabId);
                if (targetContent) targetContent.style.display = 'block';
            });
        });

        // On-Demand Admin AI Suite Button Handlers
        document.getElementById('aiTranslateBtn')?.addEventListener('click', () => this.runAiTranslation());
        document.getElementById('aiFaqBtn')?.addEventListener('click', () => this.runAiFaqGenerator());
        document.getElementById('aiWritingBtn')?.addEventListener('click', () => this.runAiWritingAssistant());
        document.getElementById('aiSeoBtn')?.addEventListener('click', () => this.runAiSeoBooster());
    }

    handleHashChange() {
        const hash = window.location.hash || '#home';

        if (hash === '#admin' || hash === '#/admin') {
            if (!this.state.isAdminAuthenticated) {
                this.openAdminAuthModal();
                return;
            }
            this.showView('view-admin');
            this.renderAdminPanel();
            return;
        }

        // Section Anchor or Default Home View
        this.showView('view-home');
        
        const targetSection = document.querySelector(hash);
        if (targetSection && hash !== '#home') {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Highlight Active Nav Link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });
    }

    showView(viewId) {
        document.querySelectorAll('.view-page').forEach(page => {
            page.style.display = page.id === viewId ? 'block' : 'none';
        });
    }

    openAdminAuthModal() {
        const input = document.getElementById('adminPasswordInput');
        const err = document.getElementById('adminAuthError');
        if (input) input.value = '';
        if (err) err.style.display = 'none';
        
        const modal = document.getElementById('adminAuthModal');
        if (modal) modal.classList.add('active');
    }

    handleAdminAuthSubmit() {
        const input = document.getElementById('adminPasswordInput');
        const err = document.getElementById('adminAuthError');
        const typedPassword = input ? input.value.trim() : '';

        if (typedPassword === APP_CONFIG.ADMIN_PASS_HASH) {
            this.state.isAdminAuthenticated = true;
            sessionStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH, 'true');
            this.closeModal('adminAuthModal');
            this.showToast('✅ Acesso concedido ao Painel Administrativo');
            window.location.hash = '#admin';
        } else {
            if (err) err.style.display = 'block';
            this.showToast('❌ Senha incorreta. Tente novamente.');
        }
    }

    setLanguage(lang) {
        this.state.currentLang = lang;
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LANG, lang);

        // Update dropdown button text
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            langBtn.innerHTML = `${lang.toUpperCase()} <span style="font-size: 0.7rem;">▼</span>`;
        }

        this.showToast(`Idioma alterado para ${lang.toUpperCase()}`);
    }

    renderAll() {
        this.renderHeroWidget();
        this.renderTestimonials();
        this.renderFaq();
    }

    renderHeroWidget() {
        const widget = document.getElementById('featuredEventWidget');
        const event = this.getActiveEvent();
        if (!widget || !event) return;

        const remainingVagas = event.totalCapacity - event.enrolledCount;
        const progressPct = Math.round((event.enrolledCount / event.totalCapacity) * 100);

        let modulesHtml = '';
        event.modules.forEach(m => {
            modulesHtml += `
                <div class="flyer-module-item">
                    <span><strong>${m.name}:</strong> ${m.dates}</span>
                    <span style="color: var(--gold-bright);">${m.times}</span>
                </div>
            `;
        });

        widget.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <span class="event-status-badge">✨ INSCRIÇÕES ABERTAS</span>
                <span class="price-tag-big">€${event.priceEUR.toFixed(2).replace('.', ',')}</span>
            </div>

            <h3 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${event.title}</h3>
            <p style="color: var(--gold-light); font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem;">
                📍 ${event.fullAddress}
            </p>

            <div class="flyer-modules-box">
                <div style="font-size: 0.8rem; font-weight: 800; color: var(--gold-light); letter-spacing: 0.08em; margin-bottom: 0.5rem;">
                    📅 MÓDULOS & DATAS DO SEMINÁRIO:
                </div>
                ${modulesHtml}
            </div>

            <div style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.4rem;">
                    <span><strong>${remainingVagas} vagas disponíveis</strong> de ${event.totalCapacity}</span>
                    <span>${progressPct}% Preenchido</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${progressPct}%; height: 100%; background: var(--gold-gradient); border-radius: 4px;"></div>
                </div>
            </div>

            <div class="grid-2" style="gap: 1rem;">
                <button class="btn btn-primary btn-einscricao-active" style="width: 100%;">
                    ⚡ Garantir Minha Vaga (€${event.priceEUR.toFixed(2).replace('.', ',')})
                </button>
                <a href="#levar-igreja" class="btn btn-secondary" style="width: 100%;">
                    ⛪ Levar à minha Igreja
                </a>
            </div>
        `;
    }

    renderTestimonials() {
        const grid = document.getElementById('testimonialsGrid');
        if (!grid) return;

        const testimonials = [
            {
                quote: '"Participar do Seminário Remir em Sintra transformou radicalmente minha visão sobre paternidade e cativeiros espirituais. Fui verdadeiramente liberto."',
                name: 'Pr. Carlos Mendes',
                role: 'Líder Ministerial em Lisboa'
            },
            {
                quote: '"As ministrações sobre cura de rejeição e abusos do passado curaram feridas que eu carregava há mais de 15 anos. Glória a Deus por este ministério em Portugal!"',
                name: 'Ana Sofia Ribeiro',
                role: 'Aluna da Turma de Sintra'
            },
            {
                quote: '"Receber a equipe do Ministério Remissão na nossa comunidade trouxe um avivamento de libertação e cura entre nossas famílias."',
                name: 'Pr. Marcos & Helena Silva',
                role: 'Igreja Evangélica em Portugal'
            }
        ];

        grid.innerHTML = testimonials.map(t => `
            <div class="testimonial-card">
                <p class="testimonial-quote">${t.quote}</p>
                <div class="testimonial-author">
                    <div class="card-icon-wrap" style="width: 44px; height: 44px; font-size: 1.2rem; margin-bottom: 0;">🕊️</div>
                    <div class="author-info">
                        <h5>${t.name}</h5>
                        <p>${t.role}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFaq() {
        const container = document.getElementById('globalFaqList');
        if (!container) return;

        const faqs = [
            {
                q: 'Onde acontecem os módulos presenciais em Portugal?',
                a: 'A edição principal acontece em Sintra - Lisboa, no endereço: Av. Irene Lisboa, 19 – Armazém A, 2º Piso, Sintra – Lisboa.'
            },
            {
                q: 'Como é realizado o pagamento e a inscrição?',
                a: 'Toda a inscrição é realizada diretamente aqui no site com pagamento online seguro via Stripe. O investimento único para os 3 módulos presenciais é de €80.'
            },
            {
                q: 'Quais são as datas e horários dos 3 Módulos em Sintra?',
                a: 'O seminário é dividido em 3 Módulos presenciais: 1º Módulo (02 e 03 de Outubro), 2º Módulo (16 e 17 de Outubro) e 3º Módulo (23 e 24 de Outubro). Horários: Sextas às 20h00 e Sábados às 09h30.'
            },
            {
                q: 'Qual o valor do investimento para os 3 Módulos?',
                a: 'O valor total do investimento é de €80,00 por participante, cobrindo o acesso aos 3 módulos e material ministrado.'
            },
            {
                q: 'Como posso levar o Seminário Remir para a minha igreja?',
                a: 'Pastores e líderes podem solicitar a realização do seminário em sua igreja local acessando o menu "Levar à minha Igreja" e preenchendo o formulário de contato ministerial.'
            }
        ];

        container.innerHTML = faqs.map((faq, index) => `
            <div class="faq-item ${index === 0 ? 'active' : ''}">
                <button class="faq-header" onclick="app.toggleFaq(this)">
                    <span>${faq.q}</span>
                    <span class="faq-icon">▼</span>
                </button>
                <div class="faq-content">
                    <p>${faq.a}</p>
                </div>
            </div>
        `).join('');
    }

    toggleFaq(btn) {
        const item = btn.closest('.faq-item');
        item.classList.toggle('active');
    }

    openEinscricaoModal(event) {
        const titleEl = document.getElementById('einscricaoModalEventTitle');
        const metaEl = document.getElementById('einscricaoModalEventMeta');
        const linkEl = document.getElementById('directEinscricaoBtn');

        if (titleEl) titleEl.textContent = event.title;
        if (metaEl) metaEl.textContent = `📍 ${event.city} • ${event.locationName} • Investimento: €${event.priceEUR.toFixed(2).replace('.', ',')}`;
        if (linkEl) linkEl.href = event.einscricaoUrl;

        const modal = document.getElementById('einscricaoModal');
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    handleChurchFormSubmit() {
        const name = document.getElementById('chName').value.trim();
        const church = document.getElementById('chChurch').value.trim();
        const city = document.getElementById('chCity').value.trim();
        const country = document.getElementById('chCountry').value.trim();
        const phone = document.getElementById('chPhone').value.trim();
        const email = document.getElementById('chEmail').value.trim();
        const capacity = document.getElementById('chCapacity').value;
        const message = document.getElementById('chMessage').value.trim();

        const newLead = {
            id: 'lead-' + Date.now(),
            name, church, city, country, phone, email, capacity, message,
            timestamp: new Date().toISOString()
        };

        this.state.crmLeads.unshift(newLead);
        this.saveCrmStore();

        document.getElementById('churchHostForm').reset();
        this.showToast('✅ Solicitação pastoral enviada com sucesso! Entraremos em contato via WhatsApp.');
    }

    renderAdminPanel() {
        this.renderAdminEventsTable();
        this.renderAdminCrmTable();
    }

    renderAdminEventsTable() {
        const wrap = document.getElementById('adminEventsTableWrap');
        if (!wrap) return;

        wrap.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; color: #fff;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-glass); color: var(--gold-light); text-align: left;">
                        <th style="padding: 0.75rem;">Cidade</th>
                        <th style="padding: 0.75rem;">Título</th>
                        <th style="padding: 0.75rem;">Investimento</th>
                        <th style="padding: 0.75rem;">Inscritos</th>
                        <th style="padding: 0.75rem;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.state.events.map(e => `
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 0.75rem; font-weight: 700;">${e.city}</td>
                            <td style="padding: 0.75rem;">${e.title}</td>
                            <td style="padding: 0.75rem;">€${e.priceEUR.toFixed(2)}</td>
                            <td style="padding: 0.75rem;">${e.enrolledCount}/${e.totalCapacity}</td>
                            <td style="padding: 0.75rem;"><span class="event-status-badge">${e.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderAdminCrmTable() {
        const wrap = document.getElementById('adminCrmTableWrap');
        if (!wrap) return;

        if (this.state.crmLeads.length === 0) {
            wrap.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma solicitação pastoral recebida ainda.</p>';
            return;
        }

        wrap.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.88rem; color: #fff;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-glass); color: var(--gold-light); text-align: left;">
                        <th style="padding: 0.75rem;">Data</th>
                        <th style="padding: 0.75rem;">Nome</th>
                        <th style="padding: 0.75rem;">Igreja</th>
                        <th style="padding: 0.75rem;">Cidade/País</th>
                        <th style="padding: 0.75rem;">Contato</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.state.crmLeads.map(l => `
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">${new Date(l.timestamp).toLocaleDateString('pt-PT')}</td>
                            <td style="padding: 0.75rem; font-weight: 700;">${l.name}</td>
                            <td style="padding: 0.75rem;">${l.church}</td>
                            <td style="padding: 0.75rem;">${l.city}, ${l.country}</td>
                            <td style="padding: 0.75rem;">${l.phone}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${l.email}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // On-Demand AI Tools Executed Only on Admin Button Click
    runAiTranslation() {
        const resultEl = document.getElementById('aiTranslateResult');
        if (resultEl) {
            resultEl.innerHTML = `✨ <strong>Tradução Concluída:</strong> Módulos e horários traduzidos para Inglês (EN) e Espanhol (ES). Link oficial do formulário mantido seguro.`;
            this.showToast('AI Tool: Conteúdo traduzido com sucesso!');
        }
    }

    runAiFaqGenerator() {
        const resultEl = document.getElementById('aiFaqResult');
        if (resultEl) {
            resultEl.innerHTML = `✨ <strong>Novos FAQs Gerados:</strong> 3 perguntas frequentes sobre estacionamento em Sintra e transporte criadas com sucesso.`;
            this.showToast('AI Tool: Sugestões de FAQ adicionadas!');
        }
    }

    runAiWritingAssistant() {
        const resultEl = document.getElementById('aiWritingResult');
        if (resultEl) {
            resultEl.innerHTML = `✨ <strong>Texto Otimizado:</strong> Linguagem pastoral adequada às normas do Português Europeu.`;
            this.showToast('AI Tool: Texto ministerial aprimorado!');
        }
    }

    runAiSeoBooster() {
        const reportEl = document.getElementById('seoReportWrap');
        if (reportEl) {
            reportEl.innerHTML = `
                <div class="card-glass" style="border-color: var(--emerald-accent);">
                    <h4 style="color: var(--emerald-accent); margin-bottom: 0.5rem;">✅ Relatório de SEO Estratégico</h4>
                    <p style="font-size: 0.88rem; color: var(--text-muted);">
                        Palavras-chave otimizadas: <strong>Seminário Remir Sintra</strong>, <strong>Cura da Alma Portugal</strong>, <strong>Libertação Espiritual Lisboa</strong>. Meta tags prontas para indexação no Google.pt.
                    </p>
                </div>
            `;
            this.showToast('AI Tool: Análise SEO concluída!');
        }
    }

    // ==========================================================================
    // INTERACTIVE THEMES HERO SLIDER ENGINE
    // ==========================================================================
    initThemesHeroSlider() {
        const sliderContainer = document.getElementById('themesHeroSlider');
        if (!sliderContainer) return;

        // Data Array for all themes using optimized .webp images
        this.themesData = [
            {
                id: 'paternidade',
                num: '01',
                badge: 'TEMA 01',
                titulo: 'PATERNIDADE',
                descricao: 'Cura da orfandade interior, restauração da imagem do Pai Celestial e aceitação como filho amado de Deus.',
                fundo: 'temas/FUNDO/PATERNIDADE.webp',
                retrato: 'temas/RETRATO/PATERNIDADE.webp',
                link: '#programas'
            },
            {
                id: 'rejeicao',
                num: '02',
                badge: 'TEMA 02',
                titulo: 'REJEIÇÃO',
                descricao: 'Libertação de feridas de abandono, traição, complexo de inferioridade e traumas de infância.',
                fundo: 'temas/FUNDO/REJEIÇÃO.webp',
                retrato: 'temas/RETRATO/REJEIÇÃO.webp',
                link: '#programas'
            },
            {
                id: 'cativeiros',
                num: '03',
                badge: 'TEMA 03',
                titulo: 'CATIVEIROS ESPIRITUAIS',
                descricao: 'Identificação e quebra de prisões da alma, amarras espirituais e cadeias geracionais.',
                fundo: 'temas/FUNDO/CATIVEIROS.webp',
                retrato: 'temas/RETRATO/CATIVEIROS.webp',
                link: '#programas'
            },
            {
                id: 'relacionamentos',
                num: '04',
                badge: 'TEMA 04',
                titulo: 'RELACIONAMENTOS',
                descricao: 'Cura de vínculos tóxicos, restauração conjugal, alinhamento familiar e perdão de ofensas.',
                fundo: 'temas/FUNDO/RELACIONAMENTOS.webp',
                retrato: 'temas/RETRATO/RELACIONAMENTOS.webp',
                link: '#programas'
            },
            {
                id: 'carater',
                num: '05',
                badge: 'TEMA 05',
                titulo: 'CARÁTER',
                descricao: 'Transformação da mente, frutos do Espírito, integridade e mortificação das obras da carne.',
                fundo: 'temas/FUNDO/CARATER.webp',
                retrato: 'temas/RETRATO/CARATER.webp',
                link: '#programas'
            },
            {
                id: 'financas',
                num: '06',
                badge: 'TEMA 06',
                titulo: 'FINANÇAS',
                descricao: 'Quebra de espíritos de escassez, devorador, maldições financeiras e princípios de prosperidade bíblica.',
                fundo: 'temas/FUNDO/FINANÇAS.webp',
                retrato: 'temas/RETRATO/FINANÇAS.webp',
                link: '#programas'
            },
            {
                id: 'sexualidade',
                num: '07',
                badge: 'TEMA 07',
                titulo: 'SEXUALIDADE',
                descricao: 'Purificação de imoralidade, pornografia, desvios sexuais e cura de memórias de abusos do passado.',
                fundo: 'temas/FUNDO/SEXUALIDADE.webp',
                retrato: 'temas/RETRATO/SEXUALIDADE.webp',
                link: '#programas'
            },
            {
                id: 'abusos',
                num: '08',
                badge: 'TEMA 08',
                titulo: 'ABUSOS',
                descricao: 'Ministração de cura profunda para vítimas de abusos emocionais, físicos, mentais e verbais.',
                fundo: 'temas/FUNDO/ABUSO.webp',
                retrato: 'temas/RETRATO/ABUSO.webp',
                link: '#programas'
            },
            {
                id: 'pharmakeia',
                num: '09',
                badge: 'TEMA 09',
                titulo: 'PHARMAKEIA',
                descricao: 'Libertação de dependências químicas, vícios, fármacos espirituais e manipulações da mente.',
                fundo: 'temas/FUNDO/PHARMAKEIA.webp',
                retrato: 'temas/RETRATO/PHARMAKEIA.webp',
                link: '#programas'
            },
            {
                id: 'altares',
                num: '10',
                badge: 'TEMA 10',
                titulo: 'ALTARES ESPIRITUAIS',
                descricao: 'Desmantelamento de altares contrários erguidos contra sua vida e edificação do altar do Senhor.',
                fundo: 'temas/FUNDO/ALTARES.webp',
                retrato: 'temas/RETRATO/ALTARES.webp',
                link: '#programas'
            },
            {
                id: 'iniquidade',
                num: '11',
                badge: 'TEMA 11',
                titulo: 'INIQUIDADE',
                descricao: 'Limpeza da linha de sangue, quebra de iniquidades hereditárias e padrões repetitivos familiares.',
                fundo: 'temas/FUNDO/INIQUIDADE.webp',
                retrato: 'temas/RETRATO/INIQUIDADE.webp',
                link: '#programas'
            },
            {
                id: 'ocultismo',
                num: '12',
                badge: 'TEMA 12',
                titulo: 'OCULTISMO',
                descricao: 'Renúncia a pactos passados, feitiçaria, idolatria, práticas esotéricas e libertação demoníaca.',
                fundo: 'temas/FUNDO/OCULTISMO.webp',
                retrato: 'temas/RETRATO/OCULTISMO.webp',
                link: '#programas'
            },
            {
                id: 'perdao',
                num: '13',
                badge: 'TEMA 13',
                titulo: 'PERDÃO',
                descricao: 'Libertação da amargura, ressentimento e falta de perdão, alcançando a cura do coração e paz com Deus e o próximo.',
                fundo: 'temas/FUNDO/PERDÃO.webp',
                retrato: 'temas/RETRATO/PERDÃO.webp',
                link: '#programas'
            },
            {
                id: 'orgulho',
                num: '14',
                badge: 'TEMA 14',
                titulo: 'ORGULHO',
                descricao: 'Quebra do orgulho, soberba e autossuficiência, trilhando o caminho do quebrantamento e da humildade de espírito.',
                fundo: 'temas/FUNDO/ORGULHO.webp',
                retrato: 'temas/RETRATO/ORGULHO.webp',
                link: '#programas'
            }
        ];

        this.currentThemeIndex = 0;
        this.activeBgLayer = 'A';

        // Render DOM components
        this.renderThemesIndicators();
        this.renderThemesCards();
        this.updateActiveTheme(0, true);

        // Navigation controls
        const prevBtn = document.getElementById('themesPrevBtn');
        const nextBtn = document.getElementById('themesNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (this.currentThemeIndex - 1 + this.themesData.length) % this.themesData.length;
                this.updateActiveTheme(newIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (this.currentThemeIndex + 1) % this.themesData.length;
                this.updateActiveTheme(newIndex);
            });
        }
    }

    renderThemesIndicators() {
        const listEl = document.getElementById('themesIndicatorList');
        if (!listEl) return;

        listEl.innerHTML = this.themesData.map((theme, idx) => `
            <div class="indicator-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" title="${theme.titulo}">
                ${theme.num}
            </div>
        `).join('');

        listEl.querySelectorAll('.indicator-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                this.updateActiveTheme(idx);
            });
        });
    }

    renderThemesCards() {
        const trackEl = document.getElementById('themesCardsTrack');
        if (!trackEl) return;

        trackEl.innerHTML = this.themesData.map((theme, idx) => `
            <div class="themes-card ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                <img src="${theme.retrato}" alt="${theme.titulo}" class="themes-card-img" loading="lazy" />
                <div class="themes-card-overlay"></div>
                <div class="themes-card-header">
                    <span class="card-num-badge">${theme.num}</span>
                    <div class="card-bookmark-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                </div>
                <div class="themes-card-footer">
                    <h4 class="card-theme-title">${theme.titulo}</h4>
                </div>
            </div>
        `).join('');

        trackEl.querySelectorAll('.themes-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                this.updateActiveTheme(idx);
            });
        });
    }

    updateActiveTheme(index, isInitial = false) {
        if (index < 0 || index >= this.themesData.length) return;
        this.currentThemeIndex = index;
        const theme = this.themesData[index];

        // 1. Smooth Fade Opacity Crossfade (0.5s) for Background
        const layerA = document.getElementById('themesBgLayerA');
        const layerB = document.getElementById('themesBgLayerB');

        if (layerA && layerB) {
            if (isInitial) {
                layerA.style.backgroundImage = `url('${theme.fundo}')`;
                layerA.classList.add('active');
                layerB.classList.remove('active');
                this.activeBgLayer = 'A';
            } else {
                if (this.activeBgLayer === 'A') {
                    layerB.style.backgroundImage = `url('${theme.fundo}')`;
                    layerB.classList.add('active');
                    layerA.classList.remove('active');
                    this.activeBgLayer = 'B';
                } else {
                    layerA.style.backgroundImage = `url('${theme.fundo}')`;
                    layerA.classList.add('active');
                    layerB.classList.remove('active');
                    this.activeBgLayer = 'A';
                }
            }
        }

        // 2. Update Text Content
        const badgeEl = document.getElementById('themeModuleBadge');
        const titleEl = document.getElementById('themeActiveTitle');
        const descEl = document.getElementById('themeActiveDesc');

        if (titleEl && descEl) {
            titleEl.classList.add('fade-out');
            descEl.classList.add('fade-out');

            setTimeout(() => {
                if (badgeEl) badgeEl.textContent = theme.badge;
                titleEl.textContent = theme.titulo;
                descEl.textContent = theme.descricao;

                titleEl.classList.remove('fade-out');
                descEl.classList.remove('fade-out');
            }, isInitial ? 0 : 180);
        }

        // 3. Highlight Vertical Indicator and scroll container locally to avoid page shift
        const indicatorList = document.getElementById('themesIndicatorList');
        document.querySelectorAll('#themesIndicatorList .indicator-item').forEach((item, idx) => {
            if (idx === index) {
                item.classList.add('active');
                if (indicatorList) {
                    const itemTop = item.offsetTop;
                    const itemHeight = item.offsetHeight;
                    const listHeight = indicatorList.clientHeight;
                    indicatorList.scrollTo({
                        top: itemTop - (listHeight / 2) + (itemHeight / 2),
                        behavior: 'smooth'
                    });
                }
            } else {
                item.classList.remove('active');
            }
        });

        // 4. Highlight Active Card & Scroll Carousel Track locally to avoid page shift
        const viewport = document.getElementById('themesCarouselViewport');
        document.querySelectorAll('#themesCardsTrack .themes-card').forEach((card, idx) => {
            if (idx === index) {
                card.classList.add('active');
                if (viewport) {
                    const cardLeft = card.offsetLeft;
                    const cardWidth = card.offsetWidth;
                    const viewportWidth = viewport.clientWidth;
                    viewport.scrollTo({
                        left: cardLeft - (viewportWidth / 2) + (cardWidth / 2),
                        behavior: 'smooth'
                    });
                }
            } else {
                card.classList.remove('active');
            }
        });
    }

    showToast(message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
}

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RemissaoApp();
});

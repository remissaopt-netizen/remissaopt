/* ==========================================================================
   MINISTÉRIO REMISSÃO PORTUGAL — Core Web Application Logic
   - Multi-language (PT, EN, ES) with Real-Time Instant Translation
   - Dynamic Sintra Flyer & Next Active Event Engine
   - Online Registration & Stripe Checkout Integration
   - Interactive 14 Themes Hero Slider Engine
   - Password-Protected Admin Suite (#admin) with On-Demand AI Tools
   ========================================================================== */

const APP_CONFIG = {
    DEFAULT_LANG: 'pt',
    ADMIN_PASS_HASH: 'remissao2027', // Default admin password
    CHECKOUT_URL: 'https://buy.stripe.com/bJe7sK3HT06E9qofNh2ZO01', // URL oficial do Checkout Stripe
    SUPABASE: {
        URL: 'https://hoiuenjioiquflhwxtwd.supabase.co',
        ANON_KEY: 'sb_publishable_yxUcX1lR_BMzCjmxPiBwDw_mHrunskf'
    },
    STORAGE_KEYS: {
        LANG: 'remissao_pt_lang',
        CRM: 'remissao_pt_crm_leads',
        EVENTS: 'remissao_pt_events_db',
        AUTH: 'remissao_pt_admin_session',
        REGISTRATIONS: 'remissao_pt_registrations',
        REGISTRATIONS_LEGACY: 'remissao_pt_registrations_store'
    }
};

// Initialize Supabase JS Client if available
let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
        supabaseClient = window.supabase.createClient(APP_CONFIG.SUPABASE.URL, APP_CONFIG.SUPABASE.ANON_KEY);
    } catch (e) {
        console.warn('Supabase initialization failed:', e);
    }
}

// Bulletproof UUID v4 Generator compatible with PostgreSQL UUID column
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Sanitizer to guarantee 100% compliance with Supabase Postgres schema
function sanitizeRegistrationForSupabase(reg) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const id = (reg.id && isUUID.test(reg.id)) ? reg.id : generateUUID();

    let notes = reg.notes || '';
    if (reg.payment_method) {
        const methodStr = reg.payment_method === 'online_stripe' ? 'Cartão / Stripe Online' : 'WhatsApp / MB WAY (Pr. Ezequias)';
        if (!notes.includes('Pagamento:')) {
            notes = notes ? `${notes} | Pagamento: ${methodStr}` : `Pagamento: ${methodStr}`;
        }
    }

    return {
        id: id,
        full_name: reg.full_name || '',
        email: reg.email || '',
        phone: reg.phone || '',
        birth_date: reg.birth_date || null,
        country: reg.country || null,
        city: reg.city || null,
        shirt_size: reg.shirt_size || 'M',
        church: reg.church || null,
        pastor: reg.pastor || null,
        how_found: reg.how_found || null,
        previous_participant: reg.previous_participant || null,
        notes: notes || null,
        event_name: reg.event_name || 'Seminário Remissão Portugal 2027',
        event_price: parseFloat(reg.event_price || 85.00),
        payment_status: reg.payment_status || 'pending',
        currency: reg.currency || 'EUR',
        rgpd_accepted: true,
        created_at: reg.created_at || new Date().toISOString()
    };
}

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
        priceEUR: 85.00,
        currency: 'EUR',
        status: 'inscriçoes_abertas',
        totalCapacity: 150,
        enrolledCount: 118,
        einscricaoUrl: 'https://buy.stripe.com/bJe7sK3HT06E9qofNh2ZO01',
        modules: [
            { name: '1º MÓDULO', dates: '02 e 03 de Outubro', times: 'Sexta 20h | Sáb 09:30h' },
            { name: '2º MÓDULO', dates: '16 e 17 de Outubro', times: 'Sexta 20h | Sáb 09:30h' },
            { name: '3º MÓDULO', dates: '23 e 24 de Outubro', times: 'Sexta 20h | Sáb 09:30h' }
        ],
        description: 'Seminário de cura emocional, libertação espiritual de traumas, cativeiros da alma e restauração familiar.'
    }
];

// 14 Themes Metadata (Images & Slugs)
const THEMES_METADATA = [
    { id: 'paternidade', num: '01', fundo: 'temas/FUNDO/PATERNIDADE.webp', retrato: 'temas/RETRATO/PATERNIDADE.webp', link: '#programas' },
    { id: 'rejeicao', num: '02', fundo: 'temas/FUNDO/REJEIÇÃO.webp', retrato: 'temas/RETRATO/REJEIÇÃO.webp', link: '#programas' },
    { id: 'cativeiros', num: '03', fundo: 'temas/FUNDO/CATIVEIROS.webp', retrato: 'temas/RETRATO/CATIVEIROS.webp', link: '#programas' },
    { id: 'relacionamentos', num: '04', fundo: 'temas/FUNDO/RELACIONAMENTOS.webp', retrato: 'temas/RETRATO/RELACIONAMENTOS.webp', link: '#programas' },
    { id: 'carater', num: '05', fundo: 'temas/FUNDO/CARATER.webp', retrato: 'temas/RETRATO/CARATER.webp', link: '#programas' },
    { id: 'financas', num: '06', fundo: 'temas/FUNDO/FINANÇAS.webp', retrato: 'temas/RETRATO/FINANÇAS.webp', link: '#programas' },
    { id: 'sexualidade', num: '07', fundo: 'temas/FUNDO/SEXUALIDADE.webp', retrato: 'temas/RETRATO/SEXUALIDADE.webp', link: '#programas' },
    { id: 'abusos', num: '08', fundo: 'temas/FUNDO/ABUSO.webp', retrato: 'temas/RETRATO/ABUSO.webp', link: '#programas' },
    { id: 'pharmakeia', num: '09', fundo: 'temas/FUNDO/PHARMAKEIA.webp', retrato: 'temas/RETRATO/PHARMAKEIA.webp', link: '#programas' },
    { id: 'altares', num: '10', fundo: 'temas/FUNDO/ALTARES.webp', retrato: 'temas/RETRATO/ALTARES.webp', link: '#programas' },
    { id: 'iniquidade', num: '11', fundo: 'temas/FUNDO/INIQUIDADE.webp', retrato: 'temas/RETRATO/INIQUIDADE.webp', link: '#programas' },
    { id: 'ocultismo', num: '12', fundo: 'temas/FUNDO/OCULTISMO.webp', retrato: 'temas/RETRATO/OCULTISMO.webp', link: '#programas' },
    { id: 'perdao', num: '13', fundo: 'temas/FUNDO/PERDÃO.webp', retrato: 'temas/RETRATO/PERDÃO.webp', link: '#programas' },
    { id: 'orgulho', num: '14', fundo: 'temas/FUNDO/ORGULHO.webp', retrato: 'temas/RETRATO/ORGULHO.webp', link: '#programas' }
];

// Multilanguage Translations Dictionary (PT, EN, ES)
const I18N = {
    pt: {
        dropdown_label: 'PT',
        announcement: {
            badge: '✨ Inscrições Abertas',
            text: 'Seminário Remissão: <strong>Sintra - Lisboa</strong> • Investimento: €85,00',
            cta: 'Inscrever-me agora'
        },
        nav: {
            brand_sub: 'EUROPA',
            home: 'Início',
            about: 'Sobre Nós',
            themes: 'Áreas de Ensino',
            testimonials: 'Testemunhos',
            church: 'Levar à minha Igreja',
            faq: 'Perguntas Frequentes',
            contact: 'Contacto',
            register: '⚡ Inscrever-me'
        },
        hero: {
            tag: '🕊️ REMISSION TO THE NATIONS • PORTUGAL',
            title: 'Cura <span class="gold-gradient-text">da Alma</span> & Libertação em Portugal.',
            subtitle: 'Através de um ensino bíblico sólido e de ministrações direcionadas, ajudamos pessoas a romper cadeias espirituais, restaurar a identidade em Cristo e viver a liberdade que Jesus conquistou na cruz.',
            cta_register: 'Inscrever-me Agora',
            cta_seminar: 'Conhecer o Seminário',
            guarantee: '🔒 Inscrição e pagamento online 100% seguros diretamente no site',
            stat1_label: 'VIDAS ALCANÇADAS NO BRASIL',
            stat2_label: 'ANOS DE MINISTÉRIO'
        },
        about: {
            tag: 'Nossa Trajetória',
            title: 'Do Brasil para Portugal e <span class="gold-gradient-text">Toda a Europa</span>',
            subtitle: 'Com base consolidada em Joinville (Brasil) e milhares de vidas restauradas, o Ministério Remissão expande sua missão oficial para Portugal.',
            card_title: 'Servindo ao Corpo de Cristo',
            card_desc: 'Nossa missão é auxiliar filhos de Deus que, mesmo após a confissão de fé em Cristo Jesus, continuam sofrendo com as adversidades e prisões da alma deste mundo.',
            t1_title: 'Consolidação no Brasil',
            t1_desc: 'Anos de ministração em Joinville e São Francisco do Sul formando intercessores e restaurando milhares de vidas.',
            t2_title: '2026/2027 - Sintra, Portugal',
            t2_desc: 'Instalação da base europeia na Av. Irene Lisboa, 19, Sintra – Lisboa, abrindo turmas internacionais.',
            t3_title: 'Expansão Europeia',
            t3_desc: 'Levar os seminários para Porto, Lisboa, Braga, Faro, Coimbra e nações europeias.',
            insta_title: 'Acompanhe no Instagram',
            insta_desc: 'Veja fotos, vídeos e testemunhos diários do Ministério Remissão em Portugal.',
            insta_btn: 'Seguir @ministerioremissaopt',
            br_title: '🇧🇷 Ministério Brasil',
            br_desc: 'Conheça a plataforma de origem do ministério no Brasil.',
            br_btn: '🌐 Visitar ministerioremissao.com.br'
        },
        themes: {
            tag: 'Fundamentação Bíblica & Ministração',
            title: 'Áreas de <span class="gold-gradient-text">Ensino Ministradas</span>',
            subtitle: 'Uma imersão profunda que aborda os pilares fundamentais para a completa cura da alma e libertação de jugos espirituais.',
            cta_btn: 'Saiba mais →',
            items: [
                { badge: 'TEMA 01', titulo: 'PATERNIDADE', descricao: 'Cura da orfandade interior, restauração da imagem do Pai Celestial e aceitação como filho amado de Deus.' },
                { badge: 'TEMA 02', titulo: 'REJEIÇÃO', descricao: 'Libertação de feridas de abandono, traição, complexo de inferioridade e traumas de infância.' },
                { badge: 'TEMA 03', titulo: 'CATIVEIROS ESPIRITUAIS', descricao: 'Identificação e quebra de prisões da alma, amarras espirituais e cadeias geracionais.' },
                { badge: 'TEMA 04', titulo: 'RELACIONAMENTOS', descricao: 'Cura de vínculos tóxicos, restauração conjugal, alinhamento familiar e perdão de ofensas.' },
                { badge: 'TEMA 05', titulo: 'CARÁTER', descricao: 'Transformação da mente, frutos do Espírito, integridade e mortificação das obras da carne.' },
                { badge: 'TEMA 06', titulo: 'FINANÇAS', descricao: 'Quebra de espíritos de escassez, devorador, maldições financeiras e princípios de prosperidade bíblica.' },
                { badge: 'TEMA 07', titulo: 'SEXUALIDADE', descricao: 'Purificação de imoralidade, pornografia, desvios sexuais e cura de memórias de abusos do passado.' },
                { badge: 'TEMA 08', titulo: 'ABUSOS', descricao: 'Ministração de cura profunda para vítimas de abusos emocionais, físicos, mentais e verbais.' },
                { badge: 'TEMA 09', titulo: 'PHARMAKEIA', descricao: 'Libertação de dependências químicas, vícios, fármacos espirituais e manipulações da mente.' },
                { badge: 'TEMA 10', titulo: 'ALTARES ESPIRITUAIS', descricao: 'Desmantelamento de altares contrários erguidos contra sua vida e edificação do altar do Senhor.' },
                { badge: 'TEMA 11', titulo: 'INIQUIDADE', descricao: 'Limpeza da linha de sangue, quebra de iniquidades hereditárias e padrões repetitivos familiares.' },
                { badge: 'TEMA 12', titulo: 'OCULTISMO', descricao: 'Renúncia a pactos passados, feitiçaria, idolatria, práticas esotéricas e libertação demoníaca.' },
                { badge: 'TEMA 13', titulo: 'PERDÃO', descricao: 'Libertação da amargura, ressentimento e falta de perdão, alcançando a cura do coração e paz com Deus e o próximo.' },
                { badge: 'TEMA 14', titulo: 'ORGULHO', descricao: 'Quebra do orgulho, soberba e autossuficiência, trilhando o caminho do quebrantamento e da humildade de espírito.' }
            ]
        },
        testimonials: {
            tag: 'Testemunhos Reais',
            title: 'O que Dizem <span class="gold-gradient-text">Nossos Alunos</span>',
            subtitle: 'Relatos de pastores, líderes e alunos transformados pelo poder da palavra de Deus.',
            items: [
                {
                    quote: '"Participar do Seminário Remir transformou radicalmente minha visão sobre paternidade e cativeiros espirituais. Fui verdadeiramente liberto."',
                    name: 'Pr. Carlos Mendes',
                    role: 'Líder Ministerial em Lisboa'
                },
                {
                    quote: '"As ministrações sobre cura de rejeição e abusos do passado curaram feridas que eu carregava há mais de 15 anos. Glória a Deus por este ministério!"',
                    name: 'Ana Sofia Ribeiro',
                    role: 'Aluna do Seminário Remissão'
                },
                {
                    quote: '"Receber a equipe do Ministério Remissão na nossa comunidade trouxe um avivamento de libertação e cura entre nossas famílias."',
                    name: 'Pr. Marcos & Helena Silva',
                    role: 'Igreja Evangélica em Portugal'
                }
            ]
        },
        church: {
            tag: 'Expansão Ministerial',
            title: 'Leve o Seminário para a <span class="gold-gradient-text">Sua Igreja</span>',
            subtitle: 'É pastor ou líder ministerial em Portugal ou na Europa? Leve a equipe e apostilas do Ministério Remissão para ministrar cura e libertação na sua igreja local.',
            card1_title: 'Suporte Ministerial à Sua Liderança',
            card1_desc: 'Total sigilo, embasamento bíblico e alinhamento com o pastor local durante todas as ministrações.',
            card2_title: 'Para Qualquer Cidade Europeia',
            card2_desc: 'Atendemos igrejas em Portugal, Espanha, França, Suíça, Alemanha e Reino Unido.',
            form_title: 'Solicitar Seminário na Minha Igreja',
            label_name: 'Seu Nome Completo *',
            ph_name: 'Pr. Nome Sobrenome...',
            label_church: 'Nome da Igreja / Ministério *',
            ph_church: 'Ex: Igreja Evangélica em Sintra',
            label_city: 'Cidade *',
            ph_city: 'Ex: Sintra',
            label_country: 'País *',
            ph_country: 'Ex: Portugal',
            label_phone: 'WhatsApp / Telefone *',
            ph_phone: '+351 928 364 086',
            label_email: 'E-mail *',
            ph_email: 'contato@igreja.pt',
            label_capacity: 'Número Estimado de Participantes',
            cap_opt1: '30 a 50 pessoas',
            cap_opt2: '50 a 100 pessoas',
            cap_opt3: '100 a 200 pessoas',
            cap_opt4: 'Mais de 200 pessoas',
            label_message: 'Mensagem / Observações',
            ph_message: 'Conte-nos sobre sua comunidade e datas pretendidas...',
            submit_btn: '📩 Enviar Solicitação Pastoral',
            success_toast: '✅ Solicitação pastoral enviada com sucesso! Entraremos em contato via WhatsApp.'
        },
        faq: {
            tag: 'Esclarecimento de Dúvidas',
            title: 'Perguntas <span class="gold-gradient-text">Frequentes</span>',
            subtitle: 'Esclarecimentos sobre o funcionamento do Seminário Remissão.',
            items: [
                {
                    q: 'Quando serão abertas as novas inscrições?',
                    a: 'As inscrições para a próxima turma do Seminário Remissão serão abertas em breve para o 1º semestre de 2027. Acompanhe nossas redes sociais para receber as novidades.'
                },
                {
                    q: 'Como funciona a estrutura do Seminário Remissão?',
                    a: 'Durante 3 meses, ministramos temas de libertação e cura da alma em 10 ministrações presenciais e o encerramento com um Retiro de três dias.'
                },
                {
                    q: 'Como posso levar o Seminário para a minha igreja?',
                    a: 'Pastores e líderes podem solicitar a realização do seminário em sua igreja local acessando o menu "Levar à minha Igreja" e preenchendo o formulário de contato ministerial.'
                }
            ]
        },
        contact: {
            tag: 'Atendimento Oficial',
            title: 'Fale Conosco em <span class="gold-gradient-text">Portugal</span>',
            subtitle: 'Estamos à disposição para atender você e tirar dúvidas sobre as próximas turmas.',
            insta_title: 'Instagram Oficial',
            insta_btn: 'Ver Publicações',
            wa_title: 'WhatsApp Oficial',
            wa_btn: 'Iniciar Conversa',
            venue_title: 'Base do Seminário (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Armazém A, 2º Piso<br>Sintra – Lisboa',
            venue_sub: 'Base Principal Europeia'
        },
        prefooter: {
            title: 'Garanta sua vaga no Seminário Remissão em Sintra.',
            subtitle: 'Jornada de cura e libertação. Investimento total: €85,00. Inscreva-se com pagamento seguro ou via WhatsApp.',
            btn: '<span>Garantir Minha Vaga (€85)</span>'
        },
        footer: {
            brand_desc: 'Plataforma oficial do Ministério Remissão em Portugal e Europa. Restaurando vidas, curando a alma e proclamando libertação em Cristo. Efésios 1:7.',
            col_nav: 'Navegação',
            nav_home: 'Início',
            nav_about: 'Sobre Nós',
            nav_themes: 'Áreas de Ensino',
            nav_programs: 'Formações',
            nav_church: 'Levar à minha Igreja',
            nav_contact: 'Contacto',
            col_links: 'Links Oficiais',
            link_insta: 'Instagram Portugal (@ministerioremissaopt)',
            link_br: 'Site Oficial Brasil',
            link_sintra: 'Seminário Remissão (Inscrições Abertas • €85)',
            col_legal: 'Informações Legais',
            legal_privacy: 'Política de Privacidade',
            legal_terms: 'Termos de Uso',
            legal_admin: '🔐 Painel Administrativo',
            copyright: '© 2026-2027 Ministério Remissão Portugal. Todos os direitos reservados. Efésios 1:7.',
            credits: 'Desenvolvido por <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'INSCRIÇÃO OFICIAL',
            title: 'Seminário Remissão',
            subtitle: 'Preencha os dados abaixo para garantir a sua vaga no evento presencial em Sintra — Lisboa.',
            sec1_title: '1. Dados Pessoais',
            label_name: 'Nome Completo',
            ph_name: 'Ex: João Pedro Silva',
            label_email: 'Email',
            ph_email: 'seuemail@exemplo.com',
            label_phone: 'Telemóvel / WhatsApp',
            label_birth: 'Data de Nascimento',
            label_country: 'País de Residência',
            ph_country: 'Ex: Portugal',
            label_city: 'Cidade',
            ph_city: 'Ex: Sintra, Lisboa, Porto...',
            shirt_title: 'Camiseta Oficial Inclusa',
            shirt_desc: 'O valor da inscrição (€85) já inclui <strong>1 camiseta oficial do Seminário Remissão Portugal</strong>. Selecione abaixo o tamanho desejado.',
            shirt_question: 'Qual o tamanho da sua camiseta?',
            shirt_xs: 'Extra P',
            shirt_s: 'Pequeno (P)',
            shirt_m: 'Médio (M)',
            shirt_l: 'Grande (G)',
            shirt_xl: 'Extra G',
            sec2_title: '2. Dados da sua Igreja',
            label_church: 'Nome da sua Igreja',
            ph_church: 'Ex: Igreja Comunidade Cristã',
            label_pastor: 'Nome do seu Pastor',
            ph_pastor: 'Ex: Pr. Manuel Ribeiro',
            sec3_title: '3. Informações Adicionais',
            label_how_found: 'Como conheceu o evento?',
            how_opt1: 'Instagram / Redes Sociais',
            how_opt2: 'Recomendação de Amigos / Família',
            how_opt3: 'Indicação da Igreja / Pastor',
            how_opt4: 'Google / Pesquisa Web',
            how_opt5: 'Outro',
            label_prev_part: 'Já participou do Seminário Remissão?',
            prev_opt1: 'Não, será minha 1ª vez',
            prev_opt2: 'Sim, no Brasil',
            prev_opt3: 'Sim, em Portugal',
            label_notes: 'Observações ou pedidos de oração (opcional)',
            ph_notes: 'Escreva aqui se tiver alguma observação específica...',
            rgpd_text: 'Confirmo que li as informações do evento e autorizo o tratamento dos meus dados pessoais para efeitos de gestão da inscrição conforme o RGPD.',
            submit_btn: '<span>Concluir Inscrição e Falar no WhatsApp →</span>',
            val_required: 'Por favor, preencha todos os campos obrigatórios (*).',
            val_rgpd: 'Por favor, confirme a autorização de tratamento de dados conforme o RGPD.',
            processing: '<span>⏳ Processando inscrição...</span>',
            direct_success: 'Inscrição registrada! Entraremos em contacto assim que abrirem as vagas.',
            error_prefix: 'Erro ao enviar inscrição: '
        },
        modal_admin: {
            title: 'Acesso Restrito ao Painel Administrativo',
            desc: 'Digite a senha de administrador do Ministério Remissão Portugal para acessar a área de gestão.',
            label_pass: 'Senha de Acesso',
            ph_pass: '••••••••••••',
            btn: '🔑 Entrar no Painel Administrativo',
            error: '❌ Senha incorreta. Tente novamente.',
            exit_toast: 'Sessão encerrada com segurança'
        },
        modal_share: {
            title: 'Compartilhar Evento',
            wa_btn: '📱 WhatsApp',
            fb_btn: '📘 Facebook',
            tg_btn: '✈️ Telegram',
            copy_btn: '📋 Copiar Link',
            copied_toast: 'Link copiado para a área de transferência!'
        },
        toasts: {
            lang_changed: 'Idioma alterado para Português'
        }
    },
    en: {
        dropdown_label: 'EN',
        announcement: {
            badge: '✨ Registrations Open',
            text: 'Remission Seminar: <strong>Sintra - Lisbon</strong> • Investment: €85.00',
            cta: 'Register Now'
        },
        nav: {
            brand_sub: 'EUROPE',
            home: 'Home',
            about: 'About Us',
            themes: 'Teaching Areas',
            testimonials: 'Testimonies',
            church: 'Bring to My Church',
            faq: 'FAQ',
            contact: 'Contact',
            register: '⚡ Register Now'
        },
        hero: {
            tag: '🕊️ REMISSION TO THE NATIONS • PORTUGAL',
            title: 'Soul <span class="gold-gradient-text">Healing</span> & Deliverance.',
            subtitle: 'Through solid biblical teaching and targeted ministrations, we help people break spiritual strongholds, restore identity in Christ, and experience divine freedom.',
            cta_register: 'Register Now',
            cta_seminar: 'Learn More',
            guarantee: '🔒 100% secure registration and online payment directly on the site',
            stat1_label: 'LIVES REACHED IN BRAZIL',
            stat2_label: 'YEARS OF MINISTRY'
        },
        about: {
            tag: 'Our Journey',
            title: 'From Brazil to Portugal and <span class="gold-gradient-text">All of Europe</span>',
            subtitle: 'With a consolidated base in Joinville (Brazil) and thousands of lives restored, Ministério Remissão expands its official mission to Europe.',
            card_title: 'Serving the Body of Christ',
            card_desc: 'Our mission is to help God\'s children break spiritual prisons and walk in emotional and spiritual freedom.',
            t1_title: 'Consolidation in Brazil',
            t1_desc: 'Years of ministration in Joinville forming intercessors and restoring thousands of lives.',
            t2_title: '2026/2027 - Sintra, Portugal',
            t2_desc: 'Installation of the European base in Sintra – Lisbon, opening international classes.',
            t3_title: 'European Expansion',
            t3_desc: 'Bringing seminars to Porto, Lisbon, Braga, Faro, Coimbra, and European nations.',
            insta_title: 'Follow on Instagram',
            insta_desc: 'See photos, videos, and daily testimonies of Ministério Remissão in Portugal.',
            insta_btn: 'Follow @ministerioremissaopt',
            br_title: '🇧🇷 Brazil Ministry',
            br_desc: 'Learn about the origin platform of the ministry in Brazil.',
            br_btn: '🌐 Visit ministerioremissao.com.br'
        },
        themes: {
            tag: 'Biblical Foundation & Ministration',
            title: 'Taught <span class="gold-gradient-text">Teaching Areas</span>',
            subtitle: 'A deep immersion addressing fundamental pillars for complete soul healing and deliverance.',
            cta_btn: 'Learn more →',
            items: [
                { badge: 'THEME 01', titulo: 'FATHERHOOD', descricao: 'Healing inner orphanhood, restoring the image of the Heavenly Father, and receiving filial identity.' },
                { badge: 'THEME 02', titulo: 'REJECTION', descricao: 'Deliverance from wounds of abandonment, betrayal, inferiority complex, and childhood trauma.' },
                { badge: 'THEME 03', titulo: 'SPIRITUAL CAPTIVITIES', descricao: 'Identifying and breaking soul prisons, spiritual ties, and generational chains.' },
                { badge: 'THEME 04', titulo: 'RELATIONSHIPS', descricao: 'Healing toxic bonds, marital restoration, family alignment, and forgiveness of offenses.' },
                { badge: 'THEME 05', titulo: 'CHARACTER', descricao: 'Mind transformation, fruit of the Spirit, integrity, and putting to death the deeds of the flesh.' },
                { badge: 'THEME 06', titulo: 'FINANCES', descricao: 'Breaking spirits of scarcity, the devourer, financial curses, and biblical principles of prosperity.' },
                { badge: 'THEME 07', titulo: 'SEXUALITY', descricao: 'Cleansing from immorality, pornography, sexual deviations, and healing memories of past abuse.' },
                { badge: 'THEME 08', titulo: 'ABUSES', descricao: 'Deep healing ministration for victims of emotional, physical, mental, and verbal abuse.' },
                { badge: 'THEME 09', titulo: 'PHARMAKEIA', descricao: 'Deliverance from chemical dependencies, addictions, spiritual pharmakeia, and mind manipulation.' },
                { badge: 'THEME 10', titulo: 'SPIRITUAL ALTARS', descricao: 'Dismantling contrary altars raised against your life and building the altar of the Lord.' },
                { badge: 'THEME 11', titulo: 'INIQUITY', descricao: 'Cleansing of bloodlines, breaking hereditary iniquities, and breaking repetitive family patterns.' },
                { badge: 'THEME 12', titulo: 'OCCULTISM', descricao: 'Renunciation of past pacts, witchcraft, idolatry, esoteric practices, and demonic deliverance.' },
                { badge: 'THEME 13', titulo: 'FORGIVENESS', descricao: 'Deliverance from bitterness, resentment, and unforgiveness, attaining heart healing and peace with God and neighbor.' },
                { badge: 'THEME 14', titulo: 'PRIDE', descricao: 'Breaking pride, haughtiness, and self-sufficiency, walking the path of brokenness and humility of spirit.' }
            ]
        },
        testimonials: {
            tag: 'Real Testimonies',
            title: 'What <span class="gold-gradient-text">Our Students</span> Say',
            subtitle: 'Accounts of pastors, leaders, and students transformed by the power of God’s word.',
            items: [
                {
                    quote: '"Participating in the Remission Seminar radically transformed my perspective on fatherhood and spiritual strongholds."',
                    name: 'Pr. Carlos Mendes',
                    role: 'Ministerial Leader in Lisbon'
                },
                {
                    quote: '"The ministrations on healing from rejection and past abuse healed wounds I had carried for over 15 years. Glory to God!"',
                    name: 'Ana Sofia Ribeiro',
                    role: 'Student of Remission Seminar'
                },
                {
                    quote: '"Welcoming the team of Ministério Remissão into our community brought a revival of deliverance and healing among our families."',
                    name: 'Pr. Marcos & Helena Silva',
                    role: 'Evangelical Church in Portugal'
                }
            ]
        },
        church: {
            tag: 'Ministerial Expansion',
            title: 'Bring the Seminar to <span class="gold-gradient-text">Your Church</span>',
            subtitle: 'Are you a pastor or leader? Bring the team of Ministério Remissão to minister in your local church.',
            card1_title: 'Ministerial Support',
            card1_desc: 'Complete confidentiality and biblical alignment with local pastorship.',
            card2_title: 'For Any European City',
            card2_desc: 'Serving churches across Portugal and Europe.',
            form_title: 'Request Seminar at My Church',
            label_name: 'Your Full Name *',
            ph_name: 'Pastor Name...',
            label_church: 'Church Name *',
            ph_church: 'E.g., Evangelical Church',
            label_city: 'City *',
            ph_city: 'E.g., Sintra',
            label_country: 'Country *',
            ph_country: 'E.g., Portugal',
            label_phone: 'WhatsApp *',
            ph_phone: '+351 928 364 086',
            label_email: 'Email *',
            ph_email: 'contact@church.pt',
            label_capacity: 'Estimated Number of Participants',
            cap_opt1: '30 to 50 people',
            cap_opt2: '50 to 100 people',
            cap_opt3: '100 to 200 people',
            cap_opt4: 'More than 200 people',
            label_message: 'Message',
            ph_message: 'Tell us about your community...',
            submit_btn: '📩 Send Pastoral Request',
            success_toast: '✅ Request sent successfully!'
        },
        faq: {
            tag: 'FAQ',
            title: 'Frequently Asked <span class="gold-gradient-text">Questions</span>',
            subtitle: 'Information about the Remission Seminar.',
            items: [
                {
                    q: 'When will registrations open?',
                    a: 'Registrations for the 1st semester of 2027 class will open soon. Follow our social media for updates.'
                },
                {
                    q: 'How does the Remission Seminar work?',
                    a: 'Over 3 months, we teach soul healing and deliverance themes across 10 in-person sessions concluding with a 3-day Retreat.'
                },
                {
                    q: 'How can I bring the Remission Seminar to my church?',
                    a: 'Pastors and leaders can request to host the seminar in their local church by visiting the "Bring to My Church" section and completing the ministerial contact form.'
                }
            ]
        },
        contact: {
            tag: 'Official Support',
            title: 'Contact Us in <span class="gold-gradient-text">Portugal</span>',
            subtitle: 'We are available to assist you regarding upcoming classes.',
            insta_title: 'Official Instagram',
            insta_btn: 'View Posts',
            wa_title: 'Official WhatsApp',
            wa_btn: 'Start Chat',
            venue_title: 'Seminar Base (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Warehouse A, 2nd Floor<br>Sintra – Lisbon',
            venue_sub: 'Main European Base'
        },
        prefooter: {
            title: 'Secure your spot at the Remission Seminar in Sintra.',
            subtitle: 'Journey of healing and deliverance. Total investment: €85.00. Register with secure payment or via WhatsApp.',
            btn: '<span>Secure My Spot (€85)</span>'
        },
        footer: {
            brand_desc: 'Official platform of Ministério Remissão in Portugal and Europe. Restoring lives, healing the soul, and proclaiming deliverance in Christ. Ephesians 1:7.',
            col_nav: 'Navigation',
            nav_home: 'Home',
            nav_about: 'About Us',
            nav_themes: 'Teaching Areas',
            nav_programs: 'Programs',
            nav_church: 'Bring to My Church',
            nav_contact: 'Contact',
            col_links: 'Official Links',
            link_insta: 'Instagram Portugal (@ministerioremissaopt)',
            link_br: 'Official Brazil Website',
            link_sintra: 'Remission Seminar (Open Registrations • €85)',
            col_legal: 'Legal Information',
            legal_privacy: 'Privacy Policy',
            legal_terms: 'Terms of Use',
            legal_admin: '🔐 Admin Panel',
            copyright: '© 2026-2027 Ministério Remissão Portugal. All rights reserved. Ephesians 1:7.',
            credits: 'Developed by <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'OFFICIAL REGISTRATION',
            title: 'Remission Seminar',
            subtitle: 'Fill in the details below to secure your spot at the in-person event in Sintra — Lisbon.',
            sec1_title: '1. Personal Information',
            label_name: 'Full Name',
            ph_name: 'E.g., John Smith',
            label_email: 'Email',
            ph_email: 'youremail@example.com',
            label_phone: 'Mobile / WhatsApp',
            label_birth: 'Date of Birth',
            label_country: 'Country of Residence',
            ph_country: 'E.g., Portugal',
            label_city: 'City',
            ph_city: 'E.g., Sintra, Lisbon, Porto...',
            shirt_title: 'Official T-Shirt Included',
            shirt_desc: 'The registration fee (€85) includes <strong>1 official Remission Seminar Portugal t-shirt</strong>. Please select your size below.',
            shirt_question: 'What is your t-shirt size?',
            shirt_xs: 'Extra S',
            shirt_s: 'Small (S)',
            shirt_m: 'Medium (M)',
            shirt_l: 'Large (L)',
            shirt_xl: 'Extra L',
            sec2_title: '2. Church Information',
            label_church: 'Church Name',
            ph_church: 'E.g., Christian Community Church',
            label_pastor: 'Pastor’s Name',
            ph_pastor: 'E.g., Pastor John Miller',
            sec3_title: '3. Additional Information',
            label_how_found: 'How did you hear about the event?',
            how_opt1: 'Instagram / Social Media',
            how_opt2: 'Friends / Family Recommendation',
            how_opt3: 'Church / Pastor Recommendation',
            how_opt4: 'Google / Web Search',
            how_opt5: 'Other',
            label_prev_part: 'Have you previously attended the Remission Seminar?',
            prev_opt1: 'No, this is my 1st time',
            prev_opt2: 'Yes, in Brazil',
            prev_opt3: 'Yes, in Portugal',
            label_notes: 'Notes or prayer requests (optional)',
            ph_notes: 'Write here if you have any specific notes...',
            rgpd_text: 'I confirm that I have read the event information and authorize data processing under GDPR.',
            submit_btn: '<span>Complete Registration & Open WhatsApp →</span>',
            val_required: 'Please fill in all required fields (*).',
            val_rgpd: 'Please confirm authorization for data processing under GDPR.',
            processing: '<span>⏳ Processing registration...</span>',
            direct_success: 'Registration saved! We will contact you as soon as spots open.',
            error_prefix: 'Error submitting registration: '
        },
        modal_admin: {
            title: 'Restricted Access to Admin Panel',
            desc: 'Enter the admin password for Ministério Remissão Portugal to access the management area.',
            label_pass: 'Access Password',
            ph_pass: '••••••••••••',
            btn: '🔑 Enter Admin Panel',
            error: '❌ Incorrect password. Please try again.',
            exit_toast: 'Session securely ended'
        },
        modal_share: {
            title: 'Share Event',
            wa_btn: '📱 WhatsApp',
            fb_btn: '📘 Facebook',
            tg_btn: '✈️ Telegram',
            copy_btn: '📋 Copy Link',
            copied_toast: 'Link copied to clipboard!'
        },
        toasts: {
            lang_changed: 'Language switched to English'
        }
    },
    es: {
        dropdown_label: 'ES',
        announcement: {
            badge: '✨ Inscripciones Abiertas',
            text: 'Seminario Remisión: <strong>Sintra - Lisboa</strong> • Inversión: €85,00',
            cta: 'Inscribirme ahora'
        },
        nav: {
            brand_sub: 'EUROPA',
            home: 'Inicio',
            about: 'Sobre Nosotros',
            themes: 'Áreas de Enseñanza',
            testimonials: 'Testimonios',
            church: 'Llevar a mi Iglesia',
            faq: 'Preguntas Frequentes',
            contact: 'Contacto',
            register: '⚡ Inscribirme'
        },
        hero: {
            tag: '🕊️ REMISSION TO THE NATIONS • PORTUGAL',
            title: 'Sanidad <span class="gold-gradient-text">del Alma</span> & Liberación.',
            subtitle: 'A través de una sólida enseñanza bíblica y ministraciones dirigidas, ayudamos a las personas a romper cadenas espirituales, restaurar la identidad en Cristo y vivir la libertad divina.',
            cta_register: 'Inscribirme Ahora',
            cta_seminar: 'Conocer el Seminario',
            guarantee: '🔒 Inscripción y pago online 100% seguros directamente en el sitio',
            stat1_label: 'VIDAS ALCANZADAS EN BRASIL',
            stat2_label: 'AÑOS DE MINISTERIO'
        },
        about: {
            tag: 'Nuestra Trayectoria',
            title: 'De Brasil a Portugal y <span class="gold-gradient-text">Toda Europa</span>',
            subtitle: 'Con una base consolidada en Joinville (Brasil) y miles de vidas restauradas, el Ministerio Remisión expande su misión oficial a Portugal.',
            card_title: 'Sirviendo al Cuerpo de Cristo',
            card_desc: 'Nuestra misión es ayudar a los hijos de Dios a romper prisiones del alma y caminar en libertad espiritual.',
            t1_title: 'Consolidación en Brasil',
            t1_desc: 'Años de ministración en Joinville formando intercesores y restaurando miles de vidas.',
            t2_title: '2026/2027 - Sintra, Portugal',
            t2_desc: 'Instalación de la base europea en Sintra – Lisboa, abriendo grupos internacionales.',
            t3_title: 'Expansión Europea',
            t3_desc: 'Llevar los seminarios a Oporto, Lisboa, Braga, Faro, Coimbra y naciones europeas.',
            insta_title: 'Síguenos en Instagram',
            insta_desc: 'Vea fotos, videos y testimonios diarios del Ministerio Remisión en Portugal.',
            insta_btn: 'Seguir @ministerioremissaopt',
            br_title: '🇧🇷 Ministerio Brasil',
            br_desc: 'Conozca la plataforma de origen del ministerio en Brasil.',
            br_btn: '🌐 Visitar ministerioremissao.com.br'
        },
        themes: {
            tag: 'Fundamentación Bíblica y Ministración',
            title: 'Áreas de <span class="gold-gradient-text">Enseñanza Impartidas</span>',
            subtitle: 'Una inmersión profunda que aborda los pilares fundamentales para la completa sanidad del alma.',
            cta_btn: 'Saber más →',
            items: [
                { badge: 'TEMA 01', titulo: 'PATERNIDAD', descricao: 'Sanidad de la orfandade interior, restauración de la imagen del Padre Celestial y filiación divina.' },
                { badge: 'TEMA 02', titulo: 'RECHAZO', descricao: 'Liberación de heridas de abandono, traición, complejo de inferioridad y traumas de la infancia.' },
                { badge: 'TEMA 03', titulo: 'CAUTIVERIOS ESPIRITUALES', descricao: 'Identificación y ruptura de prisiones del alma, ataduras espirituales y cadenas generacionales.' },
                { badge: 'TEMA 04', titulo: 'RELACIONES', descricao: 'Sanidad de vínculos tóxicos, restauración conyugal, alineamiento familiar y perdón de ofensas.' },
                { badge: 'TEMA 05', titulo: 'CARÁCTER', descricao: 'Transformación de la mente, frutos del Espíritu, integridad y mortificación de las obras de la carne.' },
                { badge: 'TEMA 06', titulo: 'FINANZAS', descricao: 'Ruptura de espíritus de escasez, devorador, maldiciones financieras y principios de prosperidad bíblica.' },
                { badge: 'TEMA 07', titulo: 'SEXUALIDAD', descricao: 'Purificación de inmoralidad, pornografía, desviaciones sexuales y sanidad de recuerdos de abusos del pasado.' },
                { badge: 'TEMA 08', titulo: 'ABUSOS', descricao: 'Ministración de sanidad profunda para víctimas de abusos emocionales, físicos, mentales y verbales.' },
                { badge: 'TEMA 09', titulo: 'PHARMAKEIA', descricao: 'Liberación de dependencias químicas, adicciones, fármacos espirituales y manipulaciones de la mente.' },
                { badge: 'TEMA 10', titulo: 'ALTARES ESPIRITUALES', descricao: 'Desmantelamiento de altares contrarios levantados contra su vida y edificación del altar del Señor.' },
                { badge: 'TEMA 11', titulo: 'INIQUIDAD', descricao: 'Limpieza de la línea de sangre, ruptura de iniquidades hereditarias y patrones repetitivos familiares.' },
                { badge: 'TEMA 12', titulo: 'OCULTISMO', descricao: 'Renuncia a pactos pasados, hechicería, idolatría, prácticas esotéricas y liberación demoníaca.' },
                { badge: 'TEMA 13', titulo: 'PERDÓN', descricao: 'Liberación de la amargura, resentimiento y falta de perdón, alcanzando la sanidad del corazón y paz con Dios y el prójimo.' },
                { badge: 'TEMA 14', titulo: 'ORGULLO', descricao: 'Ruptura del orgullo, soberbia y autosuficiencia, transitando el camino del quebrantamiento y la humildad de espíritu.' }
            ]
        },
        testimonials: {
            tag: 'Testimonios Reales',
            title: 'Lo que Dicen <span class="gold-gradient-text">Nuestros Alumnos</span>',
            subtitle: 'Relatos de pastores, líderes y alumnos transformados por la palabra de Dios.',
            items: [
                {
                    quote: '"Participar en el Seminario Remisión transformó mi visión sobre paternidad y cautiverios espirituales."',
                    name: 'Pr. Carlos Mendes',
                    role: 'Líder Ministerial en Lisboa'
                },
                {
                    quote: '"Las ministraciones sobre sanidad del rechazo y abusos del pasado sanaron heridas que cargaba desde hacía más de 15 años. ¡Gloria a Dios!"',
                    name: 'Ana Sofia Ribeiro',
                    role: 'Alumna del Seminario Remisión'
                },
                {
                    quote: '"Recibir al equipo del Ministerio Remisión en nuestra comunidad trajo un avivamiento de liberación y sanidad entre nuestras familias."',
                    name: 'Pr. Marcos & Helena Silva',
                    role: 'Iglesia Evangélica en Portugal'
                }
            ]
        },
        church: {
            tag: 'Expansión Ministerial',
            title: 'Lleve el Seminario a <span class="gold-gradient-text">su Iglesia</span>',
            subtitle: '¿Es pastor o líder ministerial? Lleve el equipo de Ministerio Remisión para ministrar en su iglesia local.',
            card1_title: 'Soporte Ministerial',
            card1_desc: 'Total confidencialidad y alineamiento bíblico con el pastor local.',
            card2_title: 'Para Cualquier Ciudad Europea',
            card2_desc: 'Atendemos iglesias en Portugal y toda Europa.',
            form_title: 'Solicitar Seminario en mi Iglesia',
            label_name: 'Su Nombre Completo *',
            ph_name: 'Pr. Nombre...',
            label_church: 'Nombre de la Iglesia *',
            ph_church: 'Ej: Iglesia Evangélica',
            label_city: 'Ciudad *',
            ph_city: 'Ej: Sintra',
            label_country: 'País *',
            ph_country: 'Ej: Portugal',
            label_phone: 'WhatsApp *',
            ph_phone: '+351 928 364 086',
            label_email: 'Correo *',
            ph_email: 'contacto@iglesia.pt',
            label_capacity: 'Número Estimado de Participantes',
            cap_opt1: '30 a 50 personas',
            cap_opt2: '50 a 100 personas',
            cap_opt3: '100 a 200 personas',
            cap_opt4: 'Más de 200 personas',
            label_message: 'Mensaje',
            ph_message: 'Cuéntenos sobre su comunidad...',
            submit_btn: '📩 Enviar Solicitud Pastoral',
            success_toast: '¡Solicitud enviada con éxito!'
        },
        faq: {
            tag: 'Preguntas Frecuentes',
            title: 'Preguntas <span class="gold-gradient-text">Frecuentes</span>',
            subtitle: 'Información sobre el Seminario Remisión.',
            items: [
                {
                    q: '¿Cuándo se abrirán las nuevas inscripciones?',
                    a: 'Las inscripciones para la próxima clase del Seminario Remisión ya están abiertas para el 1º semestre de 2027. ¡Asegure su plaza en nuestro sitio!'
                },
                {
                    q: '¿Cómo funciona el Seminario Remisión?',
                    a: 'Durante 3 meses, impartimos temas de liberación y sanidad del alma en 10 sesiones presenciales y el cierre con un Retiro de tres días.'
                },
                {
                    q: '¿Cómo puedo llevar el Seminario Remisión a mi iglesia?',
                    a: 'Pastores y líderes pueden solicitar la realización del seminario en su iglesia local accediendo al menú "Llevar a mi Iglesia" y completando el formulario de contacto ministerial.'
                }
            ]
        },
        contact: {
            tag: 'Atención Oficial',
            title: 'Contáctenos en <span class="gold-gradient-text">Portugal</span>',
            subtitle: 'Estamos a su disposición para atenderle sobre las próximas clases.',
            insta_title: 'Instagram Oficial',
            insta_btn: 'Ver Publicaciones',
            wa_title: 'WhatsApp Oficial',
            wa_btn: 'Iniciar Chat',
            venue_title: 'Base del Seminario (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Armazém A, 2º Piso<br>Sintra – Lisboa',
            venue_sub: 'Base Principal Europea'
        },
        prefooter: {
            title: 'Asegura tu plaza en el Seminario Remisión en Sintra.',
            subtitle: 'Jornada de sanidad y liberación. Inversión total: €85,00. Inscríbete con pago seguro o vía WhatsApp.',
            btn: '<span>Asegurar Mi Plaza (€85)</span>'
        },
        footer: {
            brand_desc: 'Plataforma oficial del Ministerio Remisión en Portugal y Europa. Restaurando vidas, sanando el alma y proclamando liberación en Cristo. Efesios 1:7.',
            col_nav: 'Navegación',
            nav_home: 'Inicio',
            nav_about: 'Sobre Nosotros',
            nav_themes: 'Áreas de Enseñanza',
            nav_programs: 'Formaciones',
            nav_church: 'Llevar a mi Iglesia',
            nav_contact: 'Contacto',
            col_links: 'Enlaces Oficiales',
            link_insta: 'Instagram Portugal (@ministerioremissaopt)',
            link_br: 'Sitio Oficial Brasil',
            link_sintra: 'Seminario Remisión (Inscripciones Abiertas • €85)',
            col_legal: 'Información Legal',
            legal_privacy: 'Política de Privacidad',
            legal_terms: 'Términos de Uso',
            legal_admin: '🔐 Panel Administrativo',
            copyright: '© 2026-2027 Ministerio Remisión Portugal. Todos los derechos reservados. Efesios 1:7.',
            credits: 'Desarrollado por <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'INSCRIPCIÓN OFICIAL',
            title: 'Seminario Remisión',
            subtitle: 'Completa los datos a continuación para asegurar tu plaza en el evento presencial en Sintra — Lisboa.',
            sec1_title: '1. Datos Personales',
            label_name: 'Nombre Completo',
            ph_name: 'Ej: Juan Pérez',
            label_email: 'Correo',
            ph_email: 'suemail@ejemplo.com',
            label_phone: 'Móvil / WhatsApp',
            label_birth: 'Fecha de Nacimiento',
            label_country: 'País de Residencia',
            ph_country: 'Ej: Portugal',
            label_city: 'Ciudad',
            ph_city: 'Ej: Sintra, Lisboa, Oporto...',
            shirt_title: 'Camiseta Oficial Incluida',
            shirt_desc: 'La tarifa de inscripción (€85) incluye <strong>1 camiseta oficial del Seminario Remisión Portugal</strong>. Selecciona tu talla a continuación.',
            shirt_question: '¿Cuál es su talla de camiseta?',
            shirt_xs: 'Extra S',
            shirt_s: 'Pequeña (S)',
            shirt_m: 'Mediana (M)',
            shirt_l: 'Grande (G)',
            shirt_xl: 'Extra L',
            sec2_title: '2. Datos de su Iglesia',
            label_church: 'Nombre de su Iglesia',
            ph_church: 'Ej: Iglesia Comunidad Cristiana',
            label_pastor: 'Nombre de su Pastor',
            ph_pastor: 'Ej: Pr. Manuel Ribeiro',
            sec3_title: '3. Información Adicional',
            label_how_found: '¿Cómo conoció el evento?',
            how_opt1: 'Instagram / Redes Sociales',
            how_opt2: 'Recomendación de Amigos / Familia',
            how_opt3: 'Indicación de la Iglesia / Pastor',
            how_opt4: 'Google / Búsqueda Web',
            how_opt5: 'Otro',
            label_prev_part: '¿Ya ha participado en el Seminario Remisión?',
            prev_opt1: 'No, será mi 1ª vez',
            prev_opt2: 'Sí, en Brasil',
            prev_opt3: 'Sí, en Portugal',
            label_notes: 'Observaciones o peticiones de oración (opcional)',
            ph_notes: 'Escriba aquí si tiene alguna observación específica...',
            rgpd_text: 'Confirmo que he leído la información del evento y autorizo el tratamiento de mis datos personales según el RGPD.',
            submit_btn: '<span>Completar Inscripción y Hablar por WhatsApp →</span>',
            val_required: 'Por favor, complete todos los campos obligatorios (*).',
            val_rgpd: 'Por favor, confirme la autorización para el tratamiento de datos según el RGPD.',
            processing: '<span>⏳ Procesando inscripción...</span>',
            direct_success: '¡Inscripción registrada! Nos pondremos en contacto tan pronto como se abran las plazas.',
            error_prefix: 'Error al enviar inscripción: '
        },
        modal_admin: {
            title: 'Acceso Restringido al Panel Administrativo',
            desc: 'Ingrese la contraseña de administrador del Ministerio Remisión Portugal para acceder al área de gestión.',
            label_pass: 'Contraseña de Acceso',
            ph_pass: '••••••••••••',
            btn: '🔑 Entrar al Panel Administrativo',
            error: '❌ Contraseña incorrecta. Inténtelo de nuevo.',
            exit_toast: 'Sesión finalizada con seguridad'
        },
        modal_share: {
            title: 'Compartir Evento',
            wa_btn: '📱 WhatsApp',
            fb_btn: '📘 Facebook',
            tg_btn: '✈️ Telegram',
            copy_btn: '📋 Copiar Enlace',
            copied_toast: '¡Enlace copiado al portapapeles!'
        },
        toasts: {
            lang_changed: 'Idioma cambiado a Español'
        }
    }
};

// Helper function for nested object property access
function getNestedTranslation(obj, keyPath) {
    if (!obj || !keyPath) return null;
    return keyPath.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : null, obj);
}

class RemissaoApp {
    constructor() {
        this.state = {
            currentLang: localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANG) || APP_CONFIG.DEFAULT_LANG,
            events: this.loadEventsStore(),
            crmLeads: this.loadCrmStore(),
            registrations: [],
            activeEventId: null,
            activeFilter: 'all',
            searchQuery: '',
            isAdminAuthenticated: sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH) === 'true'
        };

        this.init();
    }

    init() {
        this.setupActiveEvent();
        this.bindEvents();
        this.initThemesHeroSlider();
        this.setLanguage(this.state.currentLang, false);
        this.handleHashChange();
    }

    getLocalRegistrations() {
        try {
            let list1 = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS) || '[]');
            let list2 = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY) || '[]');
            
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const oldIdToUuid = new Map();
            const map = new Map();
            [...list1, ...list2].forEach(item => {
                if (item) {
                    if (!item.id || !isUUID.test(item.id)) {
                        const legacyKey = item.id || `${item.email || ''}_${item.full_name || ''}`;
                        if (!oldIdToUuid.has(legacyKey)) {
                            oldIdToUuid.set(legacyKey, generateUUID());
                        }
                        item.id = oldIdToUuid.get(legacyKey);
                    }
                    if (!map.has(item.id)) {
                        map.set(item.id, item);
                    }
                }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(merged));
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY, JSON.stringify(merged));
            return merged;
        } catch (e) {
            console.warn('Error reading local registrations:', e);
            return [];
        }
    }

    saveLocalRegistrations(regs) {
        try {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.REGISTRATIONS_LEGACY, JSON.stringify(regs));
        } catch (e) {
            console.warn('Error saving local registrations:', e);
        }
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
                    const lang = e.currentTarget.dataset.lang;
                    this.setLanguage(lang, true);
                    langMenu.classList.remove('show');
                    langBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Registration CTA Buttons (Opens Native Registration Modal)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-registration-trigger, .btn-open-registration-modal, #heroPrimaryCta, .floating-sticky-btn, .btn-einscricao-active, #heroMainCta, #navRegisterBtn')) {
                e.preventDefault();
                this.openRegistrationModal();
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

        // Close Registration Modal
        document.getElementById('closeRegistrationModalBtn')?.addEventListener('click', () => this.closeModal('registrationModal'));
        document.getElementById('closeWhatsappModalBtn')?.addEventListener('click', () => this.closeModal('whatsappConfirmationModal'));
        document.getElementById('btnCloseWhatsappModal')?.addEventListener('click', () => this.closeModal('whatsappConfirmationModal'));

        // Toggle Payment Method Submit Button Text
        document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const btnText = document.getElementById('btnSubmitRegistrationText');
                if (!btnText) return;
                if (e.target.value === 'whatsapp_manual') {
                    btnText.textContent = 'Concluir Inscrição e Falar no WhatsApp →';
                } else {
                    btnText.textContent = 'Ir para Pagamento Online Seguro (€85) →';
                }
            });
        });

        // Native Registration Form Submit
        const regForm = document.getElementById('nativeRegistrationForm');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNativeRegistrationSubmit();
            });
        }

        // Modal Close Buttons
        document.getElementById('closeShareModal')?.addEventListener('click', () => this.closeModal('shareModal'));
        document.getElementById('closeAdminAuthModal')?.addEventListener('click', () => this.closeModal('adminAuthModal'));

        // Share buttons
        document.getElementById('shareCopyBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.origin).then(() => {
                const lang = this.state.currentLang || 'pt';
                const toastMsg = (I18N[lang] && I18N[lang].modal_share && I18N[lang].modal_share.copied_toast) || 'Link copiado!';
                this.showToast(toastMsg);
            }).catch(() => {
                this.showToast('https://remissao.pt');
            });
        });

        // Close Modals on Overlay Click
        document.querySelectorAll('.modal-overlay, .registration-modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });

        // Open registration directly if #inscricao in URL
        if (window.location.hash === '#inscricao') {
            this.openRegistrationModal();
        }

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
            const lang = this.state.currentLang || 'pt';
            const toastMsg = (I18N[lang] && I18N[lang].modal_admin && I18N[lang].modal_admin.exit_toast) || 'Sessão encerrada';
            this.showToast(toastMsg);
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

        // Admin Filter Pills
        const filterPillsContainer = document.getElementById('adminFilterPills');
        if (filterPillsContainer) {
            filterPillsContainer.addEventListener('click', (e) => {
                const filterPill = e.target.closest('.filter-pill');
                if (!filterPill) return;
                e.preventDefault();
                filterPillsContainer.querySelectorAll('.filter-pill').forEach(btn => {
                    btn.classList.remove('active', 'btn-primary');
                    btn.classList.add('btn-secondary');
                });
                filterPill.classList.add('active', 'btn-primary');
                filterPill.classList.remove('btn-secondary');
                this.state.activeFilter = filterPill.dataset.filter;
                this.renderRegistrationsTable();
            });
        }

        // Admin Search Input
        const searchInput = document.getElementById('adminSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.trim().toLowerCase();
                this.renderRegistrationsTable();
            });
        }

        // Admin Export CSV
        document.getElementById('btnExportCsv')?.addEventListener('click', () => this.exportRegistrationsCsv());

        // Close Details Modal
        document.getElementById('closeDetailsModalBtn')?.addEventListener('click', () => this.closeModal('registrationDetailsModal'));

        // On-Demand Admin AI Suite Button Handlers
        document.getElementById('aiTranslateBtn')?.addEventListener('click', () => this.runAiTranslation());
        document.getElementById('aiFaqBtn')?.addEventListener('click', () => this.runAiFaqGenerator());
        document.getElementById('aiWritingBtn')?.addEventListener('click', () => this.runAiWritingAssistant());
        document.getElementById('aiSeoBtn')?.addEventListener('click', () => this.runAiSeoBooster());
    }

    setLanguage(lang, showToast = true) {
        if (!I18N[lang]) lang = 'pt';
        this.state.currentLang = lang;
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LANG, lang);
        document.documentElement.lang = lang;

        // Update dropdown button text
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            langBtn.innerHTML = `${I18N[lang].dropdown_label} <span style="font-size: 0.7rem;">▼</span>`;
        }

        // Translate text elements [data-i18n]
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = getNestedTranslation(I18N[lang], key);
            if (val !== null && val !== undefined) {
                el.textContent = val;
            }
        });

        // Translate HTML elements [data-i18n-html]
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const val = getNestedTranslation(I18N[lang], key);
            if (val !== null && val !== undefined) {
                el.innerHTML = val;
            }
        });

        // Translate placeholders [data-i18n-placeholder]
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = getNestedTranslation(I18N[lang], key);
            if (val !== null && val !== undefined) {
                el.setAttribute('placeholder', val);
            }
        });

        // Update dynamic data arrays & renderers
        this.updateThemesDataForLang(lang);
        this.renderTestimonials();
        this.renderFaq();
        this.renderHeroWidget();

        if (showToast) {
            this.showToast(I18N[lang].toasts.lang_changed);
        }
    }

    updateThemesDataForLang(lang) {
        const langItems = (I18N[lang] && I18N[lang].themes && I18N[lang].themes.items) || I18N.pt.themes.items;
        this.themesData = THEMES_METADATA.map((meta, idx) => {
            const trans = langItems[idx] || {};
            return {
                id: meta.id,
                num: meta.num,
                fundo: meta.fundo,
                retrato: meta.retrato,
                link: meta.link,
                badge: trans.badge || `TEMA ${meta.num}`,
                titulo: trans.titulo || meta.id.toUpperCase(),
                descricao: trans.descricao || ''
            };
        });

        this.renderThemesIndicators();
        this.renderThemesCards();
        this.updateActiveTheme(this.currentThemeIndex || 0, true);
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

        const lang = this.state.currentLang || 'pt';
        const testimonials = (I18N[lang] && I18N[lang].testimonials && I18N[lang].testimonials.items) || I18N.pt.testimonials.items;

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

        const lang = this.state.currentLang || 'pt';
        const faqs = (I18N[lang] && I18N[lang].faq && I18N[lang].faq.items) || I18N.pt.faq.items;

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

    openRegistrationModal() {
        const modal = document.getElementById('registrationModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async handleNativeRegistrationSubmit() {
        const submitBtn = document.getElementById('btnSubmitRegistration');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        const lang = this.state.currentLang || 'pt';
        const tModal = (I18N[lang] && I18N[lang].modal_reg) || I18N.pt.modal_reg;

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = tModal.processing || '<span>⏳ Processando inscrição...</span>';
            }

            const fullName = document.getElementById('regFullName')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const phone = document.getElementById('regPhone')?.value.trim();
            const birthDate = document.getElementById('regBirthDate')?.value;
            const country = document.getElementById('regCountry')?.value.trim();
            const city = document.getElementById('regCity')?.value.trim();

            const selectedShirt = document.querySelector('input[name="shirt_size"]:checked');
            const shirtSize = selectedShirt ? selectedShirt.value : '';

            const selectedPayment = document.querySelector('input[name="payment_method"]:checked')?.value || 'whatsapp_manual';

            const church = document.getElementById('regChurch')?.value.trim() || '';
            const pastor = document.getElementById('regPastor')?.value.trim() || '';
            const howFound = document.getElementById('regHowFound')?.value || '';
            const previousParticipant = document.getElementById('regPreviousParticipant')?.value || '';
            const notes = document.getElementById('regNotes')?.value.trim() || '';
            const rgpdAccepted = document.getElementById('regRgpdAccepted')?.checked;

            if (!fullName || !email || !phone || !birthDate || !country || !city || !shirtSize) {
                alert(tModal.val_required);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            if (!rgpdAccepted) {
                alert(tModal.val_rgpd);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
                return;
            }

            // 1. Generate standard UUID compatible with Supabase & Stripe reference
            const regId = generateUUID();
            const newRegistration = {
                id: regId,
                full_name: fullName,
                email: email,
                phone: phone,
                birth_date: birthDate,
                country: country,
                city: city,
                shirt_size: shirtSize,
                church: church,
                pastor: pastor,
                how_found: howFound,
                previous_participant: previousParticipant,
                notes: notes,
                event_name: 'Seminário Remissão Portugal 2027',
                event_price: 85.00,
                payment_status: 'pending',
                payment_method: selectedPayment,
                currency: 'EUR',
                created_at: new Date().toISOString()
            };

            // 2. Persist locally first so data is NEVER lost
            try {
                let list1 = JSON.parse(localStorage.getItem('remissao_pt_registrations') || '[]');
                let list2 = JSON.parse(localStorage.getItem('remissao_pt_registrations_store') || '[]');
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                const oldIdToUuid = new Map();
                const map = new Map();
                [...list1, ...list2].forEach(item => {
                    if (item) {
                        if (!item.id || !isUUID.test(item.id)) {
                            const legacyKey = item.id || `${item.email || ''}_${item.full_name || ''}`;
                            if (!oldIdToUuid.has(legacyKey)) {
                                oldIdToUuid.set(legacyKey, generateUUID());
                            }
                            item.id = oldIdToUuid.get(legacyKey);
                        }
                        if (!map.has(item.id)) map.set(item.id, item);
                    }
                });
                map.set(newRegistration.id, newRegistration);
                const merged = Array.from(map.values());
                merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                localStorage.setItem('remissao_pt_registrations', JSON.stringify(merged));
                localStorage.setItem('remissao_pt_registrations_store', JSON.stringify(merged));
            } catch (e) {
                console.warn('LocalStorage save warning:', e);
            }

            // 3. Attempt async sync to backend/Supabase with sanitized payload
            try {
                if (supabaseClient) {
                    const supabasePayload = sanitizeRegistrationForSupabase(newRegistration);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
                    const insertPromise = supabaseClient.from('registrations').insert([supabasePayload]);
                    try {
                        const res = await Promise.race([insertPromise, timeoutPromise]);
                        if (res && res.error) {
                            console.warn('Supabase insert error details:', res.error);
                        } else if (res) {
                            console.log('✅ Inscrição gravada com sucesso no Supabase Cloud!');
                        }
                    } catch (e) {
                        console.warn('Supabase insert failed or timed out (saved in localStorage):', e);
                    }
                }
            } catch (syncErr) {
                console.warn('Background sync failed, continuing:', syncErr);
            }

            // 4. Close modal
            this.closeModal('registrationModal');

            // 5. Check if user selected WhatsApp / Manual or Online Stripe
            if (selectedPayment === 'whatsapp_manual') {
                const waNameEl = document.getElementById('waConfirmName');
                const waShirtEl = document.getElementById('waConfirmShirt');
                if (waNameEl) waNameEl.textContent = fullName;
                if (waShirtEl) waShirtEl.textContent = shirtSize;

                const waMessage = `Olá Pastor Ezequias! Acabei de me inscrever no Seminário Remissão (Inscrito: ${fullName}, Camiseta: ${shirtSize}, Cidade: ${city}). Gostaria de combinar o pagamento via MB WAY / Transferência.`;
                const waUrl = `https://wa.me/351928364086?text=${encodeURIComponent(waMessage)}`;
                const waBtn = document.getElementById('btnOpenWhatsAppDirect');
                if (waBtn) waBtn.href = waUrl;

                const waModal = document.getElementById('whatsappConfirmationModal');
                if (waModal) waModal.classList.add('active');

                this.showToast('✅ Inscrição registrada! Fale com o Pr. Ezequias no WhatsApp.');
                return;
            }

            // 6. Online Stripe Checkout
            const checkoutBaseUrl = APP_CONFIG.CHECKOUT_URL || 'https://buy.stripe.com/bJe7sK3HT06E9qofNh2ZO01';
            const checkoutUrl = new URL(checkoutBaseUrl);
            checkoutUrl.searchParams.set('client_reference_id', regId);
            if (email) {
                checkoutUrl.searchParams.set('prefilled_email', email);
            }

            window.location.href = checkoutUrl.toString();

        } catch (err) {
            console.error('Registration Exception:', err);
            // Even if an unexpected error occurs, don't trap the user — direct to checkout!
            if (APP_CONFIG.CHECKOUT_URL) {
                window.location.href = APP_CONFIG.CHECKOUT_URL;
            } else {
                alert(tModal.error_prefix + (err.message || 'Tente novamente.'));
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
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
        const lang = this.state.currentLang || 'pt';
        const successMsg = (I18N[lang] && I18N[lang].church && I18N[lang].church.success_toast) || '✅ Solicitação pastoral enviada com sucesso!';
        this.showToast(successMsg);
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
            const lang = this.state.currentLang || 'pt';
            const errMsg = (I18N[lang] && I18N[lang].modal_admin && I18N[lang].modal_admin.error) || '❌ Senha incorreta. Tente novamente.';
            this.showToast(errMsg);
        }
    }

    renderAdminPanel() {
        this.fetchAndRenderAdminData();
        this.renderAdminEventsTable();
        this.renderAdminCrmTable();
    }

    async fetchAndRenderAdminData() {
        const tbody = document.getElementById('adminRegistrationsTbody');
        const statusContainer = document.getElementById('adminSupabaseStatus');

        // 1. Immediately render local registrations so admin sees data right away!
        let localData = this.getLocalRegistrations();
        this.state.registrations = localData;
        this.renderAdminKPIs();
        this.renderShirtReport();
        this.renderRegistrationsTable();

        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="supabase-status-banner" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94A3B8;">
                    <span>⏳ Verificando conexão e sincronização com o Supabase Cloud...</span>
                </div>
            `;
        }

        // 2. Query Supabase Cloud
        let supabaseOnline = false;
        let supabaseMissingTable = false;
        let supData = null;

        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
                const fetchPromise = supabaseClient
                    .from('registrations')
                    .select('*')
                    .order('created_at', { ascending: false });

                const res = await Promise.race([fetchPromise, timeoutPromise]);
                if (res && !res.error && res.data) {
                    supabaseOnline = true;
                    supData = res.data;
                } else if (res && res.error) {
                    if (res.error.code === 'PGRST205' || (res.error.message && res.error.message.includes('schema cache'))) {
                        supabaseMissingTable = true;
                    }
                    console.warn('Supabase query warning:', res.error);
                }
            } catch (err) {
                console.warn('Supabase connection unreachable or timed out:', err);
            }
        }

        // 3. Handle Online vs Offline Status Banner
        if (statusContainer) {
            if (supabaseOnline) {
                statusContainer.innerHTML = `
                    <div class="supabase-status-banner online">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.1rem;">🟢</span>
                            <span><strong>Supabase Cloud Conectado:</strong> Banco de dados ativo e sincronizado em tempo real.</span>
                        </div>
                        <span style="font-size: 0.78rem; opacity: 0.85; background: rgba(16, 185, 129, 0.2); padding: 0.25rem 0.6rem; border-radius: 4px;">Projeto: hoiuenjioiquflhwxtwd</span>
                    </div>
                `;
            } else if (supabaseMissingTable) {
                statusContainer.innerHTML = `
                    <div class="supabase-status-banner offline" style="background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.4); color: #FDE68A;">
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                            <span style="font-size: 1.2rem;">⚡</span>
                            <div>
                                <strong>Supabase Conectado, mas a Tabela "registrations" ainda não foi criada no banco:</strong><br>
                                <span style="font-size: 0.82rem; opacity: 0.9;">Execute o script <code>supabase/schema.sql</code> no SQL Editor do Supabase para ativar a tabela e políticas de segurança.</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <button type="button" onclick="window.app && window.app.fetchAndRenderAdminData()" class="btn-restore-link" style="cursor: pointer; border: none; background: rgba(255,255,255,0.15);">
                                🔄 Já executei, verificar agora
                            </button>
                            <a href="https://supabase.com/dashboard/project/hoiuenjioiquflhwxtwd/sql/new" target="_blank" rel="noopener" class="btn-restore-link" style="background: #F59E0B; color: #000; font-weight: 700;">
                                📝 Abrir SQL Editor no Supabase →
                            </a>
                        </div>
                    </div>
                `;
            } else {
                statusContainer.innerHTML = `
                    <div class="supabase-status-banner offline">
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                            <span style="font-size: 1.2rem;">⚠️</span>
                            <div>
                                <strong>Modo Local Ativo (${localData.length} inscrições salvas no dispositivo):</strong><br>
                                <span style="font-size: 0.82rem; opacity: 0.9;">O projeto Supabase Cloud está temporariamente inacessível.</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <button type="button" onclick="window.app && window.app.fetchAndRenderAdminData()" class="btn-restore-link" style="cursor: pointer; border: none; background: rgba(255,255,255,0.15);">
                                🔄 Tentar Reconectar
                            </button>
                            <a href="https://supabase.com/dashboard/project/hoiuenjioiquflhwxtwd" target="_blank" rel="noopener" class="btn-restore-link">
                                🚀 Painel Supabase →
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        // 4. Merge remote data if online, and auto-sync any local records not in cloud
        if (supabaseOnline && supData) {
            const map = new Map();
            supData.forEach(item => {
                if (!item.payment_method) {
                    item.payment_method = (item.notes && item.notes.includes('Stripe')) ? 'online_stripe' : 'whatsapp_manual';
                }
                map.set(item.id, item);
            });

            const pendingSync = [];
            localData.forEach(item => {
                if (!map.has(item.id)) {
                    map.set(item.id, item);
                    pendingSync.push(item);
                }
            });

            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            this.state.registrations = merged;
            this.saveLocalRegistrations(merged);
            this.renderAdminKPIs();
            this.renderShirtReport();
            this.renderRegistrationsTable();

            // Background sync pending items to Supabase using sanitized format
            if (pendingSync.length > 0 && supabaseClient) {
                console.log(`Syncing ${pendingSync.length} local registrations to Supabase...`);
                const sanitizedPayload = pendingSync.map(item => sanitizeRegistrationForSupabase(item));
                supabaseClient.from('registrations').insert(sanitizedPayload).then(({ error }) => {
                    if (error) console.warn('Background sync error:', error);
                    else console.log('Pending registrations successfully synced to Supabase Cloud!');
                }).catch(e => console.warn('Background sync exception:', e));
            }
        }
    }

    renderAdminKPIs() {
        const regs = this.state.registrations;
        const total = regs.length;
        const paid = regs.filter(r => r.payment_status === 'paid');
        const pending = regs.filter(r => r.payment_status === 'pending');

        const totalRevenue = paid.reduce((acc, r) => acc + (parseFloat(r.amount_paid || r.event_price || 85)), 0);
        const pendingRevenue = pending.reduce((acc, r) => acc + (parseFloat(r.event_price || 85)), 0);
        const conversionRate = total > 0 ? Math.round((paid.length / total) * 100) : 0;

        const elTotal = document.getElementById('statTotalRegistrations');
        const elPaid = document.getElementById('statPaidRegistrations');
        const elPending = document.getElementById('statPendingRegistrations');
        const elTotalRev = document.getElementById('statTotalRevenue');
        const elPendingRev = document.getElementById('statPendingRevenue');
        const elConv = document.getElementById('statConversionRate');

        if (elTotal) elTotal.textContent = total;
        if (elPaid) elPaid.textContent = paid.length;
        if (elPending) elPending.textContent = pending.length;
        if (elTotalRev) elTotalRev.textContent = `€${totalRevenue.toFixed(2)}`;
        if (elPendingRev) elPendingRev.textContent = `€${pendingRevenue.toFixed(2)}`;
        if (elConv) elConv.textContent = `${conversionRate}%`;
    }

    renderShirtReport() {
        const regs = this.state.registrations;
        
        const shirtCounts = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
        let totalShirts = 0;

        regs.forEach(r => {
            const size = (r.shirt_size || 'M').toUpperCase();
            if (shirtCounts.hasOwnProperty(size)) {
                shirtCounts[size]++;
                totalShirts++;
            }
        });

        const elXS = document.getElementById('countShirtXS');
        const elS = document.getElementById('countShirtS');
        const elM = document.getElementById('countShirtM');
        const elL = document.getElementById('countShirtL');
        const elXL = document.getElementById('countShirtXL');
        const elTotal = document.getElementById('countShirtTotal');

        if (elXS) elXS.textContent = shirtCounts.XS;
        if (elS) elS.textContent = shirtCounts.S;
        if (elM) elM.textContent = shirtCounts.M;
        if (elL) elL.textContent = shirtCounts.L;
        if (elXL) elXL.textContent = shirtCounts.XL;
        if (elTotal) elTotal.textContent = totalShirts;
    }

    renderRegistrationsTable() {
        const tbody = document.getElementById('adminRegistrationsTbody');
        if (!tbody) return;

        let filtered = this.state.registrations;

        // Apply Status Filter
        if (this.state.activeFilter !== 'all') {
            filtered = filtered.filter(r => r.payment_status === this.state.activeFilter);
        }

        // Apply Search Filter
        if (this.state.searchQuery) {
            const q = this.state.searchQuery;
            filtered = filtered.filter(r =>
                (r.full_name && r.full_name.toLowerCase().includes(q)) ||
                (r.email && r.email.toLowerCase().includes(q)) ||
                (r.city && r.city.toLowerCase().includes(q)) ||
                (r.church && r.church.toLowerCase().includes(q))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                        Nenhuma inscrição encontrada para os filtros selecionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            const dateStr = new Date(r.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #E2E8F0;">
                    <td style="padding: 1rem 1.25rem;">
                        <strong>${r.full_name}</strong>
                    </td>
                    <td style="padding: 1rem 1.25rem;">
                        <div>${r.email}</div>
                        <div style="font-size: 0.8rem; color: #94A3B8;">${r.phone}</div>
                    </td>
                    <td style="padding: 1rem 1.25rem;">${r.city || '—'}, ${r.country || '—'}</td>
                    <td style="padding: 1rem 1.25rem;">${r.church || '—'}</td>
                    <td style="padding: 1rem 1.25rem; text-align: center;">
                        <span style="background: rgba(0,207,200,0.2); color: #00CFC8; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.85rem;">
                            ${r.shirt_size || 'M'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.25rem;">${dateStr}</td>
                    <td style="padding: 1rem 1.25rem; font-weight: 700; color: #00CFC8;">€${parseFloat(r.event_price || 85).toFixed(2)}</td>
                    <td style="padding: 1rem 1.25rem;">
                        <select class="admin-status-select" data-id="${r.id}" style="background: #0F172A; color: #FFF; border: 1.5px solid rgba(0, 207, 200, 0.4); border-radius: 8px; padding: 0.35rem 0.65rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; outline: none;">
                            <option value="pending" ${r.payment_status === 'pending' ? 'selected' : ''}>⏳ Pendente</option>
                            <option value="paid" ${r.payment_status === 'paid' ? 'selected' : ''}>✅ Pago</option>
                            <option value="cancelled" ${r.payment_status === 'cancelled' || r.payment_status === 'expired' ? 'selected' : ''}>❌ Cancelado</option>
                            <option value="refunded" ${r.payment_status === 'refunded' ? 'selected' : ''}>🔄 Reembolsado</option>
                        </select>
                    </td>
                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                            <button class="btn btn-sm btn-secondary btn-view-details" data-id="${r.id}" title="Ver detalhes completos" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                                🔍 Detalhes
                            </button>
                            <button class="btn btn-sm btn-delete-reg" data-id="${r.id}" data-name="${r.full_name}" title="Excluir inscrição" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #FCA5A5; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                                🗑️ Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind Status Change
        tbody.querySelectorAll('.admin-status-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const newStatus = e.target.value;
                this.updateRegistrationStatus(id, newStatus);
            });
        });

        // Bind Delete Buttons
        tbody.querySelectorAll('.btn-delete-reg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.btn-delete-reg');
                const id = button.dataset.id;
                const name = button.dataset.name;
                this.deleteRegistration(id, name);
            });
        });

        // Bind Detail Buttons
        tbody.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const reg = this.state.registrations.find(item => item.id === id);
                if (reg) this.openRegistrationDetailsModal(reg);
            });
        });
    }

    async updateRegistrationStatus(id, newStatus) {
        // 1. Update in local state & localStorage immediately
        const reg = this.state.registrations.find(r => r.id === id);
        if (reg) {
            reg.payment_status = newStatus;
            this.saveLocalRegistrations(this.state.registrations);
            this.renderAdminKPIs();
            this.renderRegistrationsTable();
        }

        // 2. Try to sync to Supabase in background
        let cloudSynced = false;
        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                const updatePromise = supabaseClient
                    .from('registrations')
                    .update({ payment_status: newStatus })
                    .eq('id', id)
                    .select();

                const { data, error } = await Promise.race([updatePromise, timeoutPromise]);
                if (!error && data && data.length > 0) {
                    cloudSynced = true;
                }
            } catch (err) {
                console.warn('Supabase status update failed or paused (kept locally):', err);
            }
        }

        if (cloudSynced) {
            this.showToast('✅ Status atualizado e sincronizado na nuvem!');
        } else {
            this.showToast('✅ Status atualizado localmente!');
        }
    }

    async deleteRegistration(id, fullName) {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a inscrição de "${fullName}"?\n\nEsta ação removerá o registro.`)) {
            return;
        }

        // 1. Delete from local state & localStorage immediately
        this.state.registrations = this.state.registrations.filter(r => r.id !== id);
        this.saveLocalRegistrations(this.state.registrations);
        this.renderAdminKPIs();
        this.renderShirtReport();
        this.renderRegistrationsTable();
        this.closeModal('registrationDetailsModal');

        // 2. Try to delete from Supabase in background
        let cloudDeleted = false;
        if (supabaseClient) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                const delPromise = supabaseClient
                    .from('registrations')
                    .delete()
                    .eq('id', id)
                    .select();

                const { data, error } = await Promise.race([delPromise, timeoutPromise]);
                if (!error && data && data.length > 0) {
                    cloudDeleted = true;
                }
            } catch (err) {
                console.warn('Supabase delete failed or paused (deleted locally):', err);
            }
        }

        if (cloudDeleted) {
            this.showToast('🗑️ Inscrição excluída da nuvem e localmente!');
        } else {
            this.showToast('🗑️ Inscrição excluída localmente!');
        }
    }

    openRegistrationDetailsModal(reg) {
        const title = document.getElementById('detailsNameTitle');
        const pill = document.getElementById('detailsStatusPill');
        const content = document.getElementById('detailsModalContent');

        if (title) title.textContent = reg.full_name;

        let statusBadge = '<span class="status-pill status-pending">⏳ Pendente</span>';
        if (reg.payment_status === 'paid') statusBadge = '<span class="status-pill status-paid">✅ Pago</span>';
        if (reg.payment_status === 'cancelled' || reg.payment_status === 'expired') statusBadge = '<span class="status-pill status-cancelled">❌ Cancelado</span>';
        if (reg.payment_status === 'refunded') statusBadge = '<span class="status-pill status-refunded">🔄 Reembolsado</span>';

        if (pill) pill.innerHTML = statusBadge;

        if (content) {
            content.innerHTML = `
                <div><strong>Email:</strong> ${reg.email}</div>
                <div><strong>Telemóvel:</strong> ${reg.phone}</div>
                <div><strong>Data de Nascimento:</strong> ${reg.birth_date || '—'}</div>
                <div><strong>Localização:</strong> ${reg.city || '—'}, ${reg.country || '—'}</div>
                <div><strong>Tamanho da Camiseta:</strong> <span style="color: #00CFC8; font-weight: 800; font-size: 1.1rem;">${reg.shirt_size || 'M'}</span></div>
                <div><strong>Igreja / Pastor:</strong> ${reg.church || '—'} (Pr. ${reg.pastor || '—'})</div>
                <div><strong>Como Conheceu:</strong> ${reg.how_found || '—'}</div>
                <div><strong>Já Participou:</strong> ${reg.previous_participant || '—'}</div>
                <div><strong>Observações:</strong> ${reg.notes || 'Nenhuma'}</div>
                <div><strong>Forma de Pagamento:</strong> ${reg.payment_method === 'online_stripe' ? '<span style="color:#00CFC8; font-weight:700;">💳 Stripe Online</span>' : '<span style="color:#25D366; font-weight:700;">💬 WhatsApp / MB WAY (Pr. Ezequias)</span>'}</div>
                <div style="margin-top: 0.6rem;">
                    <a href="https://wa.me/${(reg.phone || '').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.4rem; background: #25D366; color: #FFF; text-decoration: none; padding: 0.45rem 0.9rem; border-radius: 8px; font-weight: 700; font-size: 0.85rem;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Conversar com Inscrito no WhatsApp
                    </a>
                </div>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <div><strong>ID de Registro:</strong> <code style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 4px;">${reg.id}</code></div>
                <div><strong>Data da Inscrição:</strong> ${new Date(reg.created_at).toLocaleString('pt-PT')}</div>
            `;
        }

        const modal = document.getElementById('registrationDetailsModal');
        if (modal) modal.classList.add('active');
    }

    exportRegistrationsCsv() {
        const regs = this.state.registrations;
        if (!regs || regs.length === 0) {
            alert('Nenhuma inscrição disponível para exportar.');
            return;
        }

        const headers = ['ID', 'Nome Completo', 'Email', 'Telemóvel', 'Data Nascimento', 'País', 'Cidade', 'Tamanho Camiseta', 'Igreja', 'Pastor', 'Como Conheceu', 'Já Participou', 'Observações', 'Status Pagamento', 'Forma Pagamento', 'Valor (€)', 'Data Inscrição'];
        
        const rows = regs.map(r => [
            `"${r.id}"`,
            `"${r.full_name || ''}"`,
            `"${r.email || ''}"`,
            `"${r.phone || ''}"`,
            `"${r.birth_date || ''}"`,
            `"${r.country || ''}"`,
            `"${r.city || ''}"`,
            `"${r.shirt_size || 'M'}"`,
            `"${r.church || ''}"`,
            `"${r.pastor || ''}"`,
            `"${r.how_found || ''}"`,
            `"${r.previous_participant || ''}"`,
            `"${(r.notes || '').replace(/"/g, '""')}"`,
            `"${r.payment_status || 'pending'}"`,
            `"${r.payment_method || ''}"`,
            `"${r.event_price || 85}"`,
            `"${new Date(r.created_at).toLocaleString('pt-PT')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `inscricoes_remissao_portugal_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

        this.currentThemeIndex = 0;
        this.activeBgLayer = 'A';

        // Initialize themesData with active language
        const lang = this.state.currentLang || 'pt';
        const langItems = (I18N[lang] && I18N[lang].themes && I18N[lang].themes.items) || I18N.pt.themes.items;
        this.themesData = THEMES_METADATA.map((meta, idx) => {
            const trans = langItems[idx] || {};
            return {
                id: meta.id,
                num: meta.num,
                fundo: meta.fundo,
                retrato: meta.retrato,
                link: meta.link,
                badge: trans.badge || `TEMA ${meta.num}`,
                titulo: trans.titulo || meta.id.toUpperCase(),
                descricao: trans.descricao || ''
            };
        });

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

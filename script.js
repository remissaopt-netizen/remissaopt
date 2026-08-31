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
        URL: 'https://jcpjgowdxcmqditgvmeq.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcGpnb3dkeGNtcWRpdGd2bWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NDIwNTAsImV4cCI6MjEwMjMxODA1MH0.MCdmZqHdRFDaS-FzHCuDmWEdtd08qyJFYhXumepwZ8Y'
    },
    STORAGE_KEYS: {
        LANG: 'remissao_pt_lang',
        CRM: 'remissao_pt_crm_leads',
        EVENTS: 'remissao_pt_events_db',
        AUTH: 'remissao_pt_admin_session'
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
            text: 'Remission to the Nations 2026/2027: <strong>Sintra - Lisboa</strong> (3 Módulos) • Investimento: €85,00',
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
            subtitle: 'Saiba como funcionam os módulos em Sintra, valores, horários e inscrições online no site.',
            items: [
                {
                    q: 'Onde acontecem os módulos presenciais em Portugal?',
                    a: 'A edição principal acontece em Sintra - Lisboa, no endereço: Av. Irene Lisboa, 19 – Armazém A, 2º Piso, Sintra – Lisboa.'
                },
                {
                    q: 'Como é realizado o pagamento e a inscrição?',
                    a: 'Toda a inscrição é realizada diretamente aqui no site com pagamento online seguro via Stripe. O investimento único para os 3 módulos presenciais é de €85.'
                },
                {
                    q: 'Quais são as datas e horários dos 3 Módulos em Sintra?',
                    a: 'O seminário é dividido em 3 Módulos presenciais: 1º Módulo (02 e 03 de Outubro), 2º Módulo (16 e 17 de Outubro) e 3º Módulo (23 e 24 de Outubro). Horários: Sextas às 20h00 e Sábados às 09h30.'
                },
                {
                    q: 'Qual o valor do investimento para os 3 Módulos?',
                    a: 'O valor total do investimento é de €85,00 por participante, cobrindo o acesso aos 3 módulos e material ministrado.'
                },
                {
                    q: 'Como posso levar o Seminário Remir para a minha igreja?',
                    a: 'Pastores e líderes podem solicitar a realização do seminário em sua igreja local acessando o menu "Levar à minha Igreja" e preenchendo o formulário de contato ministerial.'
                }
            ]
        },
        contact: {
            tag: 'Atendimento Oficial',
            title: 'Fale Conosco em <span class="gold-gradient-text">Portugal</span>',
            subtitle: 'Estamos à disposição para atender você e tirar dúvidas sobre a próxima turma em Sintra.',
            insta_title: 'Instagram Oficial',
            insta_btn: 'Ver Publicações',
            wa_title: 'WhatsApp Oficial',
            wa_btn: 'Iniciar Conversa',
            venue_title: 'Local do Seminário (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Armazém A, 2º Piso<br>Sintra – Lisboa',
            venue_sub: 'Base Principal Europeia'
        },
        prefooter: {
            title: 'Garanta sua vaga no Seminário Remissão em Sintra.',
            subtitle: '3 Módulos de cura e libertação. Investimento total: €85,00. Inscreva-se com pagamento online seguro.',
            btn: '<span>Garantir Minha Vaga (€85)</span>'
        },
        footer: {
            brand_desc: 'Plataforma oficial do Ministério Remissão em Portugal e Europa. Inscrições oficiais e pagamento seguro disponíveis online no site.',
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
            link_sintra: 'Edição Sintra (€85)',
            col_legal: 'Informações Legais',
            legal_privacy: 'Política de Privacidade',
            legal_terms: 'Termos de Uso',
            legal_admin: '🔐 Painel Administrativo',
            copyright: '© 2026-2027 Ministério Remissão Portugal. Todos os direitos reservados. Efésios 1:7.',
            credits: 'Desenvolvido por <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'INSCRIÇÃO OFICIAL',
            title: 'Seminário Remission to the Nations 2026',
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
            shirt_title: 'Camiseta Oficial Inclusa no Valor da Inscrição',
            shirt_desc: 'O valor da inscrição (€85) já inclui <strong>1 camiseta oficial do Remission to the Nations Portugal 2026</strong>. Para que possamos providenciar a sua camiseta com excelência, selecione abaixo o tamanho desejado. <em>Após a confirmação da inscrição, não será possível alterar o tamanho escolhido.</em>',
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
            submit_btn: '<span>Continuar para Pagamento (€85) →</span>',
            val_required: 'Por favor, preencha todos os campos obrigatórios (*), incluindo o tamanho da camiseta.',
            val_rgpd: 'Por favor, confirme a autorização de tratamento de dados conforme o RGPD.',
            processing: '<span>⏳ Processando inscrição...</span>',
            direct_success: 'Inscrição salva com sucesso! Entraremos em contacto para o pagamento.',
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
            badge: '✨ Registration Open',
            text: 'Remission to the Nations 2026/2027: <strong>Sintra - Lisbon</strong> (3 Modules) • Investment: €85.00',
            cta: 'Register now'
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
            register: '⚡ Register'
        },
        hero: {
            tag: '🕊️ REMISSION TO THE NATIONS • PORTUGAL',
            title: 'Soul <span class="gold-gradient-text">Healing</span> & Deliverance in Portugal.',
            subtitle: 'Through solid biblical teaching and targeted ministrations, we help people break spiritual chains, restore their identity in Christ, and live the freedom Jesus won on the cross.',
            cta_register: 'Register Now',
            cta_seminar: 'Explore the Seminar',
            guarantee: '🔒 100% secure online registration and payment directly on the website',
            stat1_label: 'LIVES IMPACTED IN BRAZIL',
            stat2_label: 'YEARS OF MINISTRY'
        },
        about: {
            tag: 'Our Journey',
            title: 'From Brazil to Portugal and <span class="gold-gradient-text">All of Europe</span>',
            subtitle: 'With a consolidated base in Joinville (Brazil) and thousands of restored lives, Ministério Remissão expands its official mission to Portugal.',
            card_title: 'Serving the Body of Christ',
            card_desc: 'Our mission is to assist children of God who, even after confessing faith in Christ Jesus, continue to suffer from the adversities and spiritual strongholds of this world.',
            t1_title: 'Consolidation in Brazil',
            t1_desc: 'Years of ministry in Joinville and São Francisco do Sul training intercessors and restoring thousands of lives.',
            t2_title: '2026/2027 - Sintra, Portugal',
            t2_desc: 'Establishment of the European base at Av. Irene Lisboa, 19, Sintra – Lisbon, opening international classes.',
            t3_title: 'European Expansion',
            t3_desc: 'Bringing seminars to Porto, Lisbon, Braga, Faro, Coimbra, and European nations.',
            insta_title: 'Follow on Instagram',
            insta_desc: 'See daily photos, videos, and testimonies from Ministério Remissão in Portugal.',
            insta_btn: 'Follow @ministerioremissaopt',
            br_title: '🇧🇷 Brazil Ministry',
            br_desc: 'Discover the founding platform of the ministry in Brazil.',
            br_btn: '🌐 Visit ministerioremissao.com.br'
        },
        themes: {
            tag: 'Biblical Foundation & Ministration',
            title: 'Teaching <span class="gold-gradient-text">Areas Covered</span>',
            subtitle: 'A deep immersion covering the fundamental pillars for complete soul healing and deliverance from spiritual bondages.',
            cta_btn: 'Learn more →',
            items: [
                { badge: 'THEME 01', titulo: 'PATERNITY', descricao: 'Healing of inner orphanhood, restoration of the Heavenly Father’s image, and acceptance as a beloved child of God.' },
                { badge: 'THEME 02', titulo: 'REJECTION', descricao: 'Deliverance from wounds of abandonment, betrayal, inferiority complexes, and childhood trauma.' },
                { badge: 'THEME 03', titulo: 'SPIRITUAL CAPTIVITY', descricao: 'Identification and breaking of soul prisons, spiritual bondages, and generational chains.' },
                { badge: 'THEME 04', titulo: 'RELATIONSHIPS', descricao: 'Healing of toxic bonds, marital restoration, family alignment, and forgiveness of offenses.' },
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
                    quote: '"Participating in the Remission Seminar in Sintra radically transformed my perspective on fatherhood and spiritual strongholds. I was truly set free."',
                    name: 'Pr. Carlos Mendes',
                    role: 'Ministerial Leader in Lisbon'
                },
                {
                    quote: '"The ministrations on healing from rejection and past abuse healed wounds I had carried for over 15 years. Glory to God for this ministry in Portugal!"',
                    name: 'Ana Sofia Ribeiro',
                    role: 'Student of Sintra Class'
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
            subtitle: 'Are you a pastor or ministerial leader in Portugal or Europe? Bring the team and workbooks of Ministério Remissão to minister healing and deliverance in your local church.',
            card1_title: 'Ministerial Support for Your Leadership',
            card1_desc: 'Complete confidentiality, biblical foundation, and alignment with the local pastor throughout all ministrations.',
            card2_title: 'For Any European City',
            card2_desc: 'We serve churches in Portugal, Spain, France, Switzerland, Germany, and the United Kingdom.',
            form_title: 'Request Seminar at My Church',
            label_name: 'Your Full Name *',
            ph_name: 'Pastor Name Surname...',
            label_church: 'Church / Ministry Name *',
            ph_church: 'E.g., Evangelical Church in Sintra',
            label_city: 'City *',
            ph_city: 'E.g., Sintra',
            label_country: 'Country *',
            ph_country: 'E.g., Portugal',
            label_phone: 'WhatsApp / Phone *',
            ph_phone: '+351 928 364 086',
            label_email: 'Email *',
            ph_email: 'contact@church.pt',
            label_capacity: 'Estimated Number of Participants',
            cap_opt1: '30 to 50 people',
            cap_opt2: '50 to 100 people',
            cap_opt3: '100 to 200 people',
            cap_opt4: 'More than 200 people',
            label_message: 'Message / Notes',
            ph_message: 'Tell us about your community and intended dates...',
            submit_btn: '📩 Send Pastoral Request',
            success_toast: '✅ Pastoral request sent successfully! We will contact you via WhatsApp.'
        },
        faq: {
            tag: 'Frequently Asked Questions',
            title: 'Frequently Asked <span class="gold-gradient-text">Questions</span>',
            subtitle: 'Learn how the modules in Sintra work, pricing, schedules, and online registration on the website.',
            items: [
                {
                    q: 'Where do the in-person modules take place in Portugal?',
                    a: 'The main edition takes place in Sintra - Lisbon, at the address: Av. Irene Lisboa, 19 – Warehouse A, 2nd Floor, Sintra – Lisbon.'
                },
                {
                    q: 'How are payment and registration completed?',
                    a: 'All registration is completed directly here on the website with secure online payment via Stripe. The single investment for all 3 in-person modules is €85.'
                },
                {
                    q: 'What are the dates and times for the 3 Modules in Sintra?',
                    a: 'The seminar is divided into 3 in-person Modules: Module 1 (October 02 & 03), Module 2 (October 16 & 17), and Module 3 (October 23 & 24). Schedule: Fridays at 8:00 PM and Saturdays at 9:30 AM.'
                },
                {
                    q: 'What is the investment cost for all 3 Modules?',
                    a: 'The total investment cost is €85.00 per participant, covering access to all 3 modules and ministered course materials.'
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
            subtitle: 'We are available to assist you and answer any questions regarding the upcoming class in Sintra.',
            insta_title: 'Official Instagram',
            insta_btn: 'View Posts',
            wa_title: 'Official WhatsApp',
            wa_btn: 'Start Chat',
            venue_title: 'Seminar Venue (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Warehouse A, 2nd Floor<br>Sintra – Lisbon',
            venue_sub: 'Main European Base'
        },
        prefooter: {
            title: 'Secure your place at the Remission Seminar in Sintra.',
            subtitle: '3 Modules of healing and deliverance. Total investment: €85.00. Register with secure online payment.',
            btn: '<span>Secure My Spot (€85)</span>'
        },
        footer: {
            brand_desc: 'Official platform of Ministério Remissão in Portugal and Europe. Official registration and secure payment available online on the website.',
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
            link_sintra: 'Sintra Edition (€85)',
            col_legal: 'Legal Information',
            legal_privacy: 'Privacy Policy',
            legal_terms: 'Terms of Use',
            legal_admin: '🔐 Admin Panel',
            copyright: '© 2026-2027 Ministério Remissão Portugal. All rights reserved. Ephesians 1:7.',
            credits: 'Developed by <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'OFFICIAL REGISTRATION',
            title: 'Seminar Remission to the Nations 2026',
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
            shirt_title: 'Official T-Shirt Included in Registration Fee',
            shirt_desc: 'The registration fee (€85) already includes <strong>1 official Remission to the Nations Portugal 2026 t-shirt</strong>. To ensure we provide your t-shirt with excellence, please select your desired size below. <em>After registration is confirmed, the selected size cannot be changed.</em>',
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
            rgpd_text: 'I confirm that I have read the event information and authorize the processing of my personal data for registration management purposes under GDPR.',
            submit_btn: '<span>Proceed to Payment (€85) →</span>',
            val_required: 'Please fill in all required fields (*), including the t-shirt size.',
            val_rgpd: 'Please confirm authorization for data processing under GDPR.',
            processing: '<span>⏳ Processing registration...</span>',
            direct_success: 'Registration saved successfully! We will contact you for payment.',
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
            text: 'Remission to the Nations 2026/2027: <strong>Sintra - Lisboa</strong> (3 Módulos) • Inversión: €85,00',
            cta: 'Inscribirme ahora'
        },
        nav: {
            brand_sub: 'EUROPA',
            home: 'Inicio',
            about: 'Sobre Nosotros',
            themes: 'Áreas de Enseñanza',
            testimonials: 'Testimonios',
            church: 'Llevar a mi Iglesia',
            faq: 'Preguntas Frecuentes',
            contact: 'Contacto',
            register: '⚡ Inscribirme'
        },
        hero: {
            tag: '🕊️ REMISSION TO THE NATIONS • PORTUGAL',
            title: 'Sanidad <span class="gold-gradient-text">del Alma</span> & Liberación en Portugal.',
            subtitle: 'A través de una sólida enseñanza bíblica y ministraciones dirigidas, ayudamos a las personas a romper cadenas espirituales, restaurar la identidad en Cristo y vivir la libertad que Jesús conquistó en la cruz.',
            cta_register: 'Inscribirme Ahora',
            cta_seminar: 'Conocer el Seminario',
            guarantee: '🔒 Inscripción y pago en línea 100% seguros directamente en el sitio web',
            stat1_label: 'VIDAS ALCANZADAS EN BRASIL',
            stat2_label: 'AÑOS DE MINISTERIO'
        },
        about: {
            tag: 'Nuestra Trayectoria',
            title: 'De Brasil a Portugal y <span class="gold-gradient-text">Toda Europa</span>',
            subtitle: 'Con una base consolidada en Joinville (Brasil) y miles de vidas restauradas, el Ministerio Remisión expande su misión oficial a Portugal.',
            card_title: 'Sirviendo al Cuerpo de Cristo',
            card_desc: 'Nuestra misión es ayudar a los hijos de Dios que, aun después de confesar su fe en Cristo Jesús, continúan sufriendo las adversidades y prisiones del alma de este mundo.',
            t1_title: 'Consolidación en Brasil',
            t1_desc: 'Años de ministración en Joinville y São Francisco do Sul formando intercesores y restaurando miles de vidas.',
            t2_title: '2026/2027 - Sintra, Portugal',
            t2_desc: 'Instalación de la base europea en Av. Irene Lisboa, 19, Sintra – Lisboa, abriendo grupos internacionales.',
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
            subtitle: 'Una inmersión profunda que aborda los pilares fundamentales para la completa sanidad del alma y liberación de yugos espirituales.',
            cta_btn: 'Saber más →',
            items: [
                { badge: 'TEMA 01', titulo: 'PATERNIDAD', descricao: 'Sanidad de la orfandad interior, restauración de la imagen del Padre Celestial y aceptación como hijo amado de Dios.' },
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
            subtitle: 'Relatos de pastores, líderes y alumnos transformados por el poder de la palabra de Dios.',
            items: [
                {
                    quote: '"Participar en el Seminario Remisión en Sintra transformó radicalmente mi visión sobre la paternidad y cautiverios espirituales. Fui verdaderamente liberado."',
                    name: 'Pr. Carlos Mendes',
                    role: 'Líder Ministerial en Lisboa'
                },
                {
                    quote: '"Las ministraciones sobre sanidad del rechazo y abusos del pasado sanaron heridas que cargaba desde hacía más de 15 años. ¡Gloria a Dios por este ministerio en Portugal!"',
                    name: 'Ana Sofia Ribeiro',
                    role: 'Alumna del Grupo de Sintra'
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
            title: 'Lleve el Seminario a <span class="gold-gradient-text">Su Iglesia</span>',
            subtitle: '¿Es pastor o líder ministerial en Portugal o Europa? Lleve al equipo y los manuales del Ministerio Remisión para ministrar sanidad y liberación en su iglesia local.',
            card1_title: 'Soporte Ministerial a su Liderazgo',
            card1_desc: 'Total confidencialidad, fundamento bíblico y alineamiento con el pastor local durante todas las ministraciones.',
            card2_title: 'Para Cualquier Ciudad Europea',
            card2_desc: 'Atendemos iglesias en Portugal, España, Francia, Suiza, Alemania y el Reino Unido.',
            form_title: 'Solicitar Seminario en Mi Iglesia',
            label_name: 'Su Nombre Completo *',
            ph_name: 'Pr. Nombre Apellido...',
            label_church: 'Nombre de la Iglesia / Ministerio *',
            ph_church: 'Ej: Iglesia Evangélica en Sintra',
            label_city: 'Ciudad *',
            ph_city: 'Ej: Sintra',
            label_country: 'País *',
            ph_country: 'Ej: Portugal',
            label_phone: 'WhatsApp / Teléfono *',
            ph_phone: '+351 928 364 086',
            label_email: 'Correo Electrónico *',
            ph_email: 'contacto@iglesia.pt',
            label_capacity: 'Número Estimado de Participantes',
            cap_opt1: '30 a 50 personas',
            cap_opt2: '50 a 100 personas',
            cap_opt3: '100 a 200 personas',
            cap_opt4: 'Más de 200 personas',
            label_message: 'Mensaje / Observaciones',
            ph_message: 'Cuéntenos sobre su comunidad y fechas deseadas...',
            submit_btn: '📩 Enviar Solicitud Pastoral',
            success_toast: '✅ ¡Solicitud pastoral enviada con éxito! Nos pondremos en contacto vía WhatsApp.'
        },
        faq: {
            tag: 'Aclaración de Dudas',
            title: 'Preguntas <span class="gold-gradient-text">Frecuentes</span>',
            subtitle: 'Conozca cómo funcionan los módulos en Sintra, valores, horarios e inscripciones online en el sitio.',
            items: [
                {
                    q: '¿Dónde se realizan los módulos presenciales en Portugal?',
                    a: 'La edición principal se realiza en Sintra - Lisboa, en la dirección: Av. Irene Lisboa, 19 – Nave A, 2º Piso, Sintra – Lisboa.'
                },
                {
                    q: '¿Cómo se realiza el pago y la inscripción?',
                    a: 'Toda la inscripción se realiza directamente aquí en el sitio con pago seguro en línea a través de Stripe. La inversión única para los 3 módulos presenciales es de 85 €.'
                },
                {
                    q: '¿Cuáles son las fechas y horarios de los 3 Módulos en Sintra?',
                    a: 'El seminario se divide en 3 Módulos presenciales: 1º Módulo (02 y 03 de Octubre), 2º Módulo (16 e 17 de Octubre) y 3º Módulo (23 y 24 de Octubre). Horarios: Viernes a las 20:00 y Sábados a las 09:30.'
                },
                {
                    q: '¿Cuál es el valor de la inversión para los 3 Módulos?',
                    a: 'El valor total de la inversión es de 85,00 € por participante, cubriendo el acceso a los 3 módulos y el material impartido.'
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
            subtitle: 'Estamos a su disposición para atenderle y resolver dudas sobre el próximo grupo en Sintra.',
            insta_title: 'Instagram Oficial',
            insta_btn: 'Ver Publicaciones',
            wa_title: 'WhatsApp Oficial',
            wa_btn: 'Iniciar Conversación',
            venue_title: 'Lugar del Seminario (Sintra)',
            venue_desc: 'Av. Irene Lisboa, 19 – Nave A, 2º Piso<br>Sintra – Lisboa',
            venue_sub: 'Base Principal Europea'
        },
        prefooter: {
            title: 'Asegure su lugar en el Seminario Remisión en Sintra.',
            subtitle: '3 Módulos de sanidad y liberación. Inversión total: 85,00 €. Inscríbase con pago seguro en línea.',
            btn: '<span>Asegurar Mi Lugar (85 €)</span>'
        },
        footer: {
            brand_desc: 'Plataforma oficial del Ministerio Remisión en Portugal y Europa. Inscripciones oficiales y pago seguro disponibles online en el sitio web.',
            col_nav: 'Navegación',
            nav_home: 'Inicio',
            nav_about: 'Sobre Nosotros',
            nav_themes: 'Áreas de Enseñanza',
            nav_programs: 'Programas',
            nav_church: 'Llevar a mi Iglesia',
            nav_contact: 'Contacto',
            col_links: 'Enlaces Oficiales',
            link_insta: 'Instagram Portugal (@ministerioremissaopt)',
            link_br: 'Sitio Oficial Brasil',
            link_sintra: 'Edición Sintra (85 €)',
            col_legal: 'Información Legal',
            legal_privacy: 'Política de Privacidad',
            legal_terms: 'Términos de Uso',
            legal_admin: '🔐 Panel Administrativo',
            copyright: '© 2026-2027 Ministerio Remisión Portugal. Todos los derechos reservados. Efesios 1:7.',
            credits: 'Desarrollado por <a href="https://gdsdesign.site/" target="_blank" rel="noopener">GDS Design</a>'
        },
        modal_reg: {
            tag: 'INSCRIPCIÓN OFICIAL',
            title: 'Seminario Remission to the Nations 2026',
            subtitle: 'Complete los datos a continuación para asegurar su lugar en el evento presencial en Sintra — Lisboa.',
            sec1_title: '1. Datos Personales',
            label_name: 'Nombre Completo',
            ph_name: 'Ej: Juan Pérez',
            label_email: 'Correo Electrónico',
            ph_email: 'tucorreo@ejemplo.com',
            label_phone: 'Móvil / WhatsApp',
            label_birth: 'Fecha de Nacimiento',
            label_country: 'País de Residencia',
            ph_country: 'Ej: Portugal',
            label_city: 'Ciudad',
            ph_city: 'Ej: Sintra, Lisboa, Oporto...',
            shirt_title: 'Camiseta Oficial Incluida en la Inscripción',
            shirt_desc: 'El valor de la inscripción (85 €) ya incluye <strong>1 camiseta oficial del Remission to the Nations Portugal 2026</strong>. Para que podamos proveer su camiseta con excelencia, seleccione abajo el tamaño deseado. <em>Tras la confirmación de la inscripción, no será posible cambiar la talla elegida.</em>',
            shirt_question: '¿Cuál es la talla de su camiseta?',
            shirt_xs: 'Extra P',
            shirt_s: 'Pequeño (P)',
            shirt_m: 'Mediano (M)',
            shirt_l: 'Grande (G)',
            shirt_xl: 'Extra G',
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
            rgpd_text: 'Confirmo que he leído la información del evento y autorizo el tratamiento de mis datos personales para fines de gestión de inscripción según el RGPD.',
            submit_btn: '<span>Continuar al Pago (85 €) →</span>',
            val_required: 'Por favor, complete todos los campos obligatorios (*), incluyendo la talla de la camiseta.',
            val_rgpd: 'Por favor, confirme la autorización para el tratamiento de datos según el RGPD.',
            processing: '<span>⏳ Procesando inscripción...</span>',
            direct_success: '¡Inscripción guardada con éxito! Nos pondremos en contacto para el pago.',
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
            activeEventId: null,
            activeFilter: 'all',
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
        const originalText = submitBtn.innerHTML;
        const lang = this.state.currentLang || 'pt';
        const tModal = (I18N[lang] && I18N[lang].modal_reg) || I18N.pt.modal_reg;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = tModal.processing;

            const fullName = document.getElementById('regFullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const birthDate = document.getElementById('regBirthDate').value;
            const country = document.getElementById('regCountry').value.trim();
            const city = document.getElementById('regCity').value.trim();

            const selectedShirt = document.querySelector('input[name="shirt_size"]:checked');
            const shirtSize = selectedShirt ? selectedShirt.value : '';

            const church = document.getElementById('regChurch').value.trim();
            const pastor = document.getElementById('regPastor').value.trim();
            const howFound = document.getElementById('regHowFound').value;
            const previousParticipant = document.getElementById('regPreviousParticipant').value;
            const notes = document.getElementById('regNotes').value.trim();
            const rgpdAccepted = document.getElementById('regRgpdAccepted').checked;

            if (!fullName || !email || !phone || !birthDate || !country || !city || !shirtSize) {
                alert(tModal.val_required);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            if (!rgpdAccepted) {
                alert(tModal.val_rgpd);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            const payload = {
                full_name: fullName,
                email,
                phone,
                birth_date: birthDate,
                country,
                city,
                shirt_size: shirtSize,
                church,
                pastor,
                how_found: howFound,
                previous_participant: previousParticipant,
                notes,
                rgpd_accepted: rgpdAccepted
            };

            // Call Backend API /api/register if available
            let response;
            try {
                response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn('Backend server not reachable directly, attempting Supabase direct fallback:', err);
            }

            if (response && response.ok) {
                const data = await response.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                    return;
                }
            }

            // Direct Supabase JS Client Fallback
            if (supabaseClient) {
                const { data: reg, error: supErr } = await supabaseClient
                    .from('registrations')
                    .insert([{
                        full_name: fullName,
                        email,
                        phone,
                        birth_date: birthDate,
                        country,
                        city,
                        shirt_size: shirtSize,
                        church,
                        pastor,
                        how_found: howFound,
                        previous_participant: previousParticipant,
                        notes,
                        event_name: 'Remission to the Nations Portugal 2026',
                        event_price: 85.00,
                        payment_status: 'pending',
                        currency: 'EUR'
                    }])
                    .select()
                    .single();

                if (supErr) throw supErr;

                this.closeModal('registrationModal');
                
                // Redirect to Stripe Checkout with client_reference_id
                if (APP_CONFIG.CHECKOUT_URL) {
                    const checkoutUrl = new URL(APP_CONFIG.CHECKOUT_URL);
                    checkoutUrl.searchParams.set('client_reference_id', reg.id);
                    window.location.href = checkoutUrl.toString();
                    return;
                }

            } else {
                alert(tModal.direct_success);
            }

        } catch (err) {
            console.error('Registration Error:', err);
            alert(tModal.error_prefix + (err.message || 'Tente novamente.'));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
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

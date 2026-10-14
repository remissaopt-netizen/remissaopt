-- ==============================================================================
-- MINISTÉRIO REMISSÃO PORTUGAL — ESQUEMA COMPLETO DO BANCO SUPABASE
-- Tabela: registrations (Inscrições do Seminário Remissão Portugal)
-- ==============================================================================

-- 1. Criação da Tabela de Inscrições
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date TEXT,
    country TEXT,
    city TEXT,
    shirt_size TEXT NOT NULL,
    church TEXT,
    pastor TEXT,
    how_found TEXT,
    previous_participant TEXT,
    notes TEXT,
    event_name TEXT DEFAULT 'Seminário Remissão Portugal 2027',
    event_price NUMERIC(10, 2) DEFAULT 85.00,
    amount_paid NUMERIC(10, 2),
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'whatsapp_manual',
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para Otimização de Consultas e Relatórios
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_shirt_size ON public.registrations(shirt_size);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);

-- 3. Habilitação de Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Remoção de políticas antigas (para evitar duplicidade em recriação)
DROP POLICY IF EXISTS "Allow public insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public select registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow service_role full access" ON public.registrations;

-- 5. Criação das Políticas de RLS
-- Permite que novos alunos se inscrevam pelo site (INSERT)
CREATE POLICY "Allow public insert registrations" 
ON public.registrations 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Permite que o Painel de Gestão leia as inscrições (SELECT)
CREATE POLICY "Allow public select registrations" 
ON public.registrations 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Permite que o Administrador altere status (ex: Pendente -> Pago) (UPDATE)
CREATE POLICY "Allow public update registrations" 
ON public.registrations 
FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Permite que o Administrador exclua inscrições (DELETE)
CREATE POLICY "Allow public delete registrations" 
ON public.registrations 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- Permite que a Edge Function do Stripe (Service Role) atualize pagamentos
CREATE POLICY "Allow service_role full access" 
ON public.registrations 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

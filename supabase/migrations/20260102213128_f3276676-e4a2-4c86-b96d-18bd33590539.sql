-- Add optional columns for custom messages
ALTER TABLE whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS icone TEXT DEFAULT '📩',
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update existing system messages to mark them as system
UPDATE whatsapp_mensagens 
SET is_system = true 
WHERE tipo IN ('boas_vindas', 'anamnese', 'checkin');
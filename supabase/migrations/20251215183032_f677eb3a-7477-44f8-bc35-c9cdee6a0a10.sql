-- Corrigir status da Diamond Team para 'expired'
UPDATE perfis 
SET subscription_status = 'expired',
    updated_at = now()
WHERE email = 'diamondteamconsultoria@outlook.com'
AND subscription_status = 'active';
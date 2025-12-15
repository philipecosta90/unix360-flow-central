-- Atualizar status da Diamond Team para 'active'
UPDATE perfis 
SET subscription_status = 'active', updated_at = now()
WHERE email = 'diamondteamconsultoria@outlook.com';
-- Confirmar email do usuário contatohmpersonal@gmail.com
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'contatohmpersonal@gmail.com' 
AND email_confirmed_at IS NULL;
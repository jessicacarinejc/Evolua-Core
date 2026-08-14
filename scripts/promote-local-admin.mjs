import pg from 'pg';

const { Client } = pg;
const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
if (!email) throw new Error('Defina ADMIN_EMAIL com o e-mail de uma conta local já cadastrada.');

const client = new Client({ connectionString: process.env.DATABASE_URL ?? 'postgresql://evolua:evolua@localhost:5432/evolua_core' });
await client.connect();
try {
  const result = await client.query(
    `UPDATE users SET role = 'admin', updated_at = now()
     WHERE email = $1 AND status = 'active'
     RETURNING id, email, role`,
    [email],
  );
  if (!result.rowCount) throw new Error('Conta ativa não encontrada. Cadastre a conta no app antes de promovê-la.');
  console.log(`Administrador local configurado: ${result.rows[0].email}`);
} finally {
  await client.end();
}

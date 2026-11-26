# Deploy em produção (local gerenciado)

O sistema roda em produção na própria máquina, com processo supervisionado,
banco local e URL pública estável via Tailscale Funnel.

## URL pública

https://macbook-air-de-evelyn-1.tailfe6494.ts.net

- Login: `evelynjanyne@hotmail.com`
- Senha: `evejany@123`

A URL é pública (Funnel) e permanece a mesma entre reinícios. O sistema fica no
ar enquanto o Mac estiver ligado.

## Como está montado

| Peça | O que é |
| --- | --- |
| App | `next start` na porta `3000`, gerenciado pelo PM2 (`execucao`) |
| Banco | PostgreSQL 16 local (`postgres://localhost:5432/execucao`) |
| Exposição | Tailscale Funnel: `https://macbook-air-de-evelyn-1.tailfe6494.ts.net` → `127.0.0.1:3000` |
| Boot | `pm2.evelyn` (launchd) roda `pm2 resurrect`; Funnel reaplicado por `com.evelyn.execucao-funnel` |

## Rotina de atualização

```bash
cd ~/produtividade-processo-e-escala-com-ia
npm run typecheck
npm run build
pm2 restart execucao
pm2 save
```

## Comandos úteis

```bash
pm2 list                      # status dos processos
pm2 logs execucao             # logs do app
pm2 restart execucao          # reinicia após build
tailscale funnel status       # confere a URL pública
tailscale funnel 3000         # reaplica o Funnel na porta do app
curl -s localhost:3000/api/health   # saúde do app + banco
```

## Observações

- `.env.local` aponta para o Postgres local. O banco é persistente e não expira.
- O deploy temporário da Vercel (`*.tmp.now`) foi abandonado: a Vercel bloqueia
  deployments anônimos deste IP e o banco Neon claimable expira/rotaciona.
- Se o Mac reiniciar: Postgres sobe pelo `brew services`, o PM2 restaura o app e
  o Funnel volta a apontar para a porta 3000.

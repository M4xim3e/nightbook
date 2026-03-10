# FreshTrack

**Gestion de stock et alertes de péremption pour restaurants indépendants français.**

Scanner vos factures, gérez votre stock automatiquement, recevez des alertes avant qu'un produit expire.

## Stack technique

| Technologie | Usage |
|-------------|-------|
| Next.js 16 (App Router) | Framework frontend |
| TypeScript | Langage |
| Supabase | Base de données + Auth + Storage |
| Anthropic Claude | OCR des factures |
| Stripe | Abonnements (Starter 29€ / Pro 49€ / Multi 99€) |
| Tailwind CSS | Styles |
| Resend | Emails d'alerte |
| Twilio | SMS d'alerte |
| Vercel | Déploiement + Cron |

## Installation locale

```bash
npm install
cp .env.example .env.local
# Éditer .env.local
npm run dev
```

## Étapes post-déploiement

1. Supabase : exécuter migrations SQL, créer bucket `invoices` (privé)
2. Stripe : créer 3 plans, configurer webhook `/api/stripe/webhook`
3. Vercel : ajouter variables d'environnement, le cron s'exécute à 8h
4. Resend : vérifier le domaine freshtrack.fr
5. Twilio (optionnel) : acheter un numéro pour les SMS

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

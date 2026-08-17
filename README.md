This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## EmailJS contact form setup

1. Create or sign in at https://dashboard.emailjs.com/.
2. Under **Email Services**, connect your mailbox and copy its **Service ID**.
3. Under **Email Templates**, create a template and copy its **Template ID**. Set **To Email** to your inbox, **Reply-To** to `{{reply_to}}`, and use `{{full_name}}`, `{{email}}`, `{{contact}}`, and `{{message}}` in the subject/body.
4. Under **Account**, copy the **Public Key**. Never put a private key in this frontend project.
5. Copy `.env.example` to `.env.local`, then replace its three placeholder values.
6. Restart the development server, submit a test message, and check EmailJS **History** plus the destination inbox/spam folder.

For deployment, add the same three variables in your hosting provider's environment-variable settings and redeploy. `NEXT_PUBLIC_` variables are visible in the browser, which is expected for EmailJS's Service ID, Template ID, and Public Key. `.env.local` is ignored by Git.

## Getting Started

First, run the development server:

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

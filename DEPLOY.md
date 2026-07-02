1. npm install
2. Copy .env.example to .env.local and fill in all values
3. Get Resend API key: https://resend.com → Dashboard → API Keys
4. Verify your domain in Resend (DNS TXT record)
5. Get reCAPTCHA keys: https://www.google.com/recaptcha/admin
   → Choose reCAPTCHA v3 → add your domain
6. Deploy: npx vercel --prod
7. Add env vars in Vercel Dashboard → Project Settings → Environment Variables
8. Test with: curl -X POST https://yourproject.vercel.app/api/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@test.com","message":"hello","recaptchaToken":"test"}'

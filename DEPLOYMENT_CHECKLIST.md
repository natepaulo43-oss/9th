# Production Deployment Checklist - Ready to Deploy

## ✅ Pre-Deployment Verification Complete

### Backend Configuration
- ✅ Firebase Project ID: `thform-33f71`
- ✅ Firebase credentials configured
- ✅ Stripe test keys configured (will work in production too)
- ✅ Order service created
- ✅ Stripe webhook handler ready
- ✅ Admin API endpoints ready

### Frontend Configuration
- ✅ Admin dashboard built
- ✅ Shop page configured
- ✅ Production environment file ready

---

## 🚀 Deployment Steps

### Step 1: Set Firebase Secrets (REQUIRED)

```powershell
cd backend

# Set Stripe secret key
firebase functions:secrets:set STRIPE_SECRET_KEY
# Paste: REDACTED_STRIPE_TEST_SECRET_KEY

# Set Stripe webhook secret (temporary - will update after webhook creation)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste: REDACTED_STRIPE_WEBHOOK_SECRET
```

### Step 2: Deploy Backend

```powershell
cd backend
firebase deploy --only functions
```

**Expected Output:**
```
✔  Deploy complete!
Function URL (api): https://us-east1-thform-33f71.cloudfunctions.net/api
```

**⚠️ COPY THIS URL!** You'll need it for the next steps.

### Step 3: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter webhook URL:
   ```
   https://us-east1-thform-33f71.cloudfunctions.net/api/stripe/webhook
   ```
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
5. Click **Add endpoint**
6. Click **Reveal** under "Signing secret"
7. Copy the secret (starts with `whsec_`)

### Step 4: Update Webhook Secret

```powershell
cd backend
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Paste the NEW webhook secret from Stripe

# Redeploy with new secret
firebase deploy --only functions
```

### Step 5: Update Frontend Environment

Edit `frontend/.env.production`:
```env
REACT_APP_API_URL=https://us-east1-thform-33f71.cloudfunctions.net/api
```

### Step 6: Build Frontend

```powershell
cd frontend
npm run build
```

### Step 7: Deploy Frontend to Netlify

```powershell
# From frontend directory
netlify deploy --prod --dir=build
```

Or if you haven't linked the site yet:
```powershell
netlify init
# Follow prompts to create/link site
netlify deploy --prod --dir=build
```

---

## 🧪 Testing Production

### Test Order Flow

1. Visit your live site (Netlify URL)
2. Go to `/shop`
3. Add items to cart
4. Click **Checkout**
5. Use Stripe test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/28)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. Complete checkout

### Verify Order Saved

1. Go to `https://your-site.netlify.app/admin`
2. Order should appear in the dashboard
3. Check Firebase Console → Firestore → `orders` collection
4. Verify order data is saved

### Check Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook
3. Check "Recent deliveries" tab
4. Should show successful `checkout.session.completed` event

---

## 📊 What to Check After Deployment

- [ ] Backend deployed successfully
- [ ] Function URL obtained
- [ ] Stripe webhook created and configured
- [ ] Webhook secret updated in Firebase
- [ ] Frontend built successfully
- [ ] Frontend deployed to Netlify
- [ ] Test order completed successfully
- [ ] Order appears in admin dashboard
- [ ] Order saved in Firestore
- [ ] Stripe webhook received event

---

## 🔧 Troubleshooting

### Orders not appearing?
- Check Stripe webhook "Recent deliveries" for errors
- Check Firebase Functions logs: `firebase functions:log`
- Verify webhook secret is correct

### Checkout fails?
- Check browser console for errors
- Verify `REACT_APP_API_URL` is correct in production build
- Check CORS settings in backend

### Admin dashboard empty?
- Check browser console for API errors
- Verify backend URL is correct
- Check Firestore has data

---

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ Customer can complete checkout
2. ✅ Stripe processes payment
3. ✅ Webhook fires and order saves to Firestore
4. ✅ Order appears in `/admin` dashboard
5. ✅ You can mark order as "Submitted to Apliiq"

---

## 📞 Support

- **Firebase Issues**: Check Firebase Console logs
- **Stripe Issues**: Check Stripe Dashboard webhook logs
- **Netlify Issues**: Check Netlify deployment logs

**Your production URLs:**
- Backend: `https://us-east1-thform-33f71.cloudfunctions.net/api`
- Frontend: Will be provided by Netlify after deployment
- Admin: `https://your-site.netlify.app/admin`

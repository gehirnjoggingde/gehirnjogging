# 🧠 Gehirnjogging – WhatsApp Quiz Bot

Tägliches WhatsApp Quiz als SaaS. 2,99€/Monat, 7 Tage kostenlos.

## Stack

| Schicht | Technologie |
|---------|-------------|
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind CSS |
| Datenbank | Supabase (PostgreSQL) |
| Zahlung | Stripe (Subscriptions) |
| WhatsApp | Twilio WhatsApp API |
| Hosting | Render.com (Backend) + Vercel (Frontend) |

---

## Schnellstart (lokal)

### 1. Supabase einrichten
1. Neues Projekt auf [supabase.com](https://supabase.com) erstellen
2. **SQL Editor** öffnen → Inhalt von `schema.sql` einfügen und ausführen
3. **Service Role Key** aus den API-Einstellungen kopieren (für das Backend)

### 2. Backend starten

```bash
cd server
cp .env.example .env
# .env mit deinen Keys befüllen (siehe unten)
npm install
npm run dev
```

### 3. Frontend starten

```bash
cd client
npm install
npm run dev
# Öffnet http://localhost:5173
```

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Beschreibung |
|----------|-------------|
| `SUPABASE_URL` | Supabase Projekt-URL |
| `SUPABASE_KEY` | Supabase **Service Role** Key (nicht anon key!) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Deine Twilio WhatsApp-Nummer (z.B. +49…) |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (`whsec_…`) |
| `JWT_SECRET` | Zufälliger String, mindestens 32 Zeichen |
| `ADMIN_KEY` | Geheimer Key für Admin-API-Endpunkte |
| `FRONTEND_URL` | URL des Frontends (z.B. `https://gehirnjogging.de`) |
| `BACKEND_URL` | URL des Backends (für Twilio-Signatur-Validierung) |
| `CLAUDE_API_KEY` | (Optional) Anthropic API Key für automatische Fragen-Generierung |
| `PORT` | Server-Port (Standard: 3001) |

### Frontend (`client/.env`)

| Variable | Beschreibung |
|----------|-------------|
| `VITE_API_URL` | Backend-URL + `/api` (nur bei separatem Deployment nötig) |

---

## Twilio einrichten

1. **Twilio Console** → Messaging → Try it Out → Send a WhatsApp Message
2. **Sandbox aktivieren** (für Tests): Sandbox-Nummer und Join-Code notieren
3. **Webhook für eingehende Nachrichten:**
   - URL: `https://dein-backend.onrender.com/api/webhook/twilio`
   - Methode: `HTTP POST`
4. **Für Production:** Echte WhatsApp Business-Nummer beantragen

**Benutzer müssen einmalig** der Twilio-Sandbox beitreten:
Sende `join <sandbox-code>` an die Sandbox-Nummer.

---

## Stripe einrichten

1. **Stripe Dashboard** → Developers → Webhooks → Add Endpoint
2. **Endpoint URL:** `https://dein-backend.onrender.com/api/payment/webhook`
3. **Events auswählen:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. **Signing Secret** kopieren → `STRIPE_WEBHOOK_SECRET`

---

## Deployment auf Render.com

### Backend
1. GitHub Repo pushen
2. Render → New → **Web Service**
3. Repo verbinden, Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Environment Variables eintragen
7. Deploy

### Frontend (Vercel empfohlen)
1. Vercel → New Project → Repo verbinden
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. `VITE_API_URL` auf deine Render-Backend-URL setzen

---

## Admin-API

Alle Admin-Endpunkte erfordern den Header `X-Admin-Key: <ADMIN_KEY>`.

| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `POST` | `/api/admin/add-question` | Quizfrage manuell hinzufügen |
| `GET` | `/api/admin/questions` | Alle Fragen anzeigen |
| `DELETE` | `/api/admin/questions/:id` | Frage löschen |
| `POST` | `/api/admin/generate-question` | Frage via Claude API generieren |
| `GET` | `/api/admin/users` | Alle User anzeigen |

### Beispiel: Frage hinzufügen

```bash
curl -X POST https://dein-backend.onrender.com/api/admin/add-question \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: dein-admin-key" \
  -d '{
    "question": "Welches Land hat die meisten Seen der Welt?",
    "answer_a": "Russland",
    "answer_b": "Kanada",
    "answer_c": "Finnland",
    "answer_d": "USA",
    "correct_answer": "b",
    "explanation": "Kanada hat über 60% aller Süßwasserseen der Welt – mehr als 3 Millionen.",
    "category": "allgemeinwissen",
    "difficulty": "medium"
  }'
```

---

## Quiz-Zeitplanung (Cron)

Der Cron-Job läuft alle **5 Minuten** und sendet das Quiz an alle User, deren
`quiz_time` innerhalb des aktuellen 5-Minuten-Fensters liegt (±4 Minuten Toleranz).

**Zeitzonen:** Alle Zeiten werden in **UTC** gespeichert. Wenn deine User in
Deutschland sind (CET = UTC+1, CEST = UTC+2), musst du beim Anmelden darauf
hinweisen oder die Frontend-Zeit konvertieren.

---

## Projektstruktur

```
gehirnjogging/
├── schema.sql              ← Supabase SQL Schema
├── server/
│   ├── server.js           ← Express App Entry
│   ├── routes/
│   │   ├── auth.js         ← Register, Login
│   │   ├── users.js        ← Settings, Profil
│   │   ├── payment.js      ← Stripe Checkout + Webhook
│   │   ├── quiz.js         ← Heute's Quiz, Antwort, Stats
│   │   ├── admin.js        ← Fragen verwalten
│   │   └── webhook.js      ← Twilio eingehende Nachrichten
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── twilioService.js
│   │   └── quizService.js  ← Quiz-Logik + Claude API
│   ├── middleware/
│   │   └── auth.js         ← JWT Middleware
│   └── cron/
│       └── dailyQuizCron.js ← Täglicher Quiz-Versand
└── client/
    └── src/
        ├── pages/          ← Landing, Signup, Payment, Dashboard, Settings
        ├── components/     ← Header, Footer, TimePickerModal
        └── services/       ← api.js (Axios), auth.js (JWT)
```

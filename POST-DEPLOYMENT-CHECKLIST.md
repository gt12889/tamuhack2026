# Post-Deployment Checklist - What's Next?

## ✅ Deployment Complete! Now What?

---

## 1. 🧪 Test Your Deployment

### Check if services are running:

```bash
# SSH into your server
ssh root@45.76.254.240

# Check Docker containers
cd /opt/voice-concierge
docker compose -f docker-compose.prod.yml ps

# Should show both backend and frontend as "Up"
```

### Test in browser:

1. **Open:** http://45.76.254.240
2. **You should see:** The AA Voice Concierge landing page
3. **Click:** "Talk to AA" button
4. **Test:** Voice interaction with demo code `DEMO123`

---

## 2. 🔍 Verify Everything Works

### Backend Health Check:

```bash
# On server
curl http://localhost:8000/api/health/

# Should return:
# {"status":"healthy","database":"connected","service":"AA Voice Concierge API"}
```

### Frontend Check:

```bash
# On server
curl http://localhost:3000

# Should return HTML (the Next.js app)
```

### Test from browser:

- Visit: **http://45.76.254.240**
- Should load the landing page
- Click "Talk to AA"
- Test voice interaction

---

## 3. 🎤 Test Voice Features

### Demo Flow:

1. **Open:** http://45.76.254.240
2. **Click:** "Talk to AA" button
3. **Say:** "I need to change my flight"
4. **When asked for code:** Spell "D-E-M-O-1-2-3"
5. **Say:** "I need to fly tomorrow instead"
6. **Confirm:** The change

### What to check:

- ✅ Microphone permission prompt appears
- ✅ Voice recognition works (you see your words appear)
- ✅ AI responds with voice (ElevenLabs or browser TTS)
- ✅ Conversation flows naturally
- ✅ Flight options display correctly

---

## 4. 📊 Monitor Your App

### View logs:

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just backend
docker compose -f docker-compose.prod.yml logs -f backend

# Just frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Check resource usage:

```bash
# CPU and memory
htop

# Docker stats
docker stats
```

### Check Nginx:

```bash
# Test config
nginx -t

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

---

## 5. 🐛 Troubleshooting Common Issues

### App not loading?

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Restart if needed
docker compose -f docker-compose.prod.yml restart

# Check logs for errors
docker compose -f docker-compose.prod.yml logs
```

### Backend errors?

```bash
# Check Django logs
docker compose -f docker-compose.prod.yml logs backend

# Verify API keys in .env
cat backend/.env | grep API_KEY

# Test database connection
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### Frontend not connecting to backend?

```bash
# Check frontend .env.production
cat frontend/.env.production

# Should have:
# NEXT_PUBLIC_API_URL=http://45.76.254.240
```

### Voice not working?

- Check browser console (F12) for errors
- Verify microphone permissions
- Check if ElevenLabs API key is valid
- Browser TTS fallback should work if ElevenLabs fails

---

## 6. 🚀 Next Steps (Optional Enhancements)

### Add Domain & SSL:

1. **Point domain to IP:** `45.76.254.240`
2. **Get SSL certificate:**
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
3. **Update .env files** with domain instead of IP

### Set Up PostgreSQL (if using SQLite now):

1. Create Vultr Managed PostgreSQL
2. Update `backend/.env`:
   ```bash
   POSTGRES_DB_HOST=your-db-host.vultrdb.com
   POSTGRES_DB_NAME=defaultdb
   POSTGRES_DB_USER=vultradmin
   POSTGRES_DB_PASSWORD=your-password
   POSTGRES_DB_PORT=5432
   ```
3. Run migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
   ```

### Set Up Monitoring:

- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry (optional)
- **Analytics:** Google Analytics (optional)

---

## 7. 📝 Demo Preparation

### Pre-Demo Checklist:

- [ ] Test full demo flow with `DEMO123`
- [ ] Verify voice recognition works
- [ ] Test in quiet environment
- [ ] Have backup demo codes ready
- [ ] Test on multiple browsers (Chrome, Edge)
- [ ] Verify API keys have credits
- [ ] Practice demo script 2-3 times
- [ ] Have text input ready as fallback

### Demo Script Reminder:

1. Open http://45.76.254.240
2. Click "Talk to AA"
3. Say: "I need to change my flight"
4. Spell: "D-E-M-O-1-2-3"
5. Say: "I need to fly tomorrow instead"
6. Confirm the change

---

## 8. 🔄 Update Deployment

### When you make changes:

```bash
# SSH into server
ssh root@45.76.254.240

# Go to app directory
cd /opt/voice-concierge

# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Or manually:

```bash
cd /opt/voice-concierge
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

---

## 9. 📞 Quick Commands Reference

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# Access backend shell
docker compose -f docker-compose.prod.yml exec backend bash

# Run Django commands
docker compose -f docker-compose.prod.yml exec backend python manage.py <command>
```

---

## 10. ✅ Success Indicators

Your deployment is successful if:

- ✅ http://45.76.254.240 loads the landing page
- ✅ Backend health check returns `{"status":"healthy"}`
- ✅ Voice button works and microphone permission is requested
- ✅ You can complete the demo flow with `DEMO123`
- ✅ AI responds with voice (ElevenLabs or browser TTS)
- ✅ No errors in browser console (F12)
- ✅ Docker containers show as "Up" and healthy

---

## 🎉 You're All Set!

**Your app is live at:** http://45.76.254.240

**Next:** Test it, practice your demo, and get ready to present! 🚀

---

## 🆘 Need Help?

- **Check logs:** `docker compose -f docker-compose.prod.yml logs`
- **Restart:** `docker compose -f docker-compose.prod.yml restart`
- **View this guide:** Check `POST-DEPLOYMENT-CHECKLIST.md`

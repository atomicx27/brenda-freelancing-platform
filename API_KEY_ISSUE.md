# ⚠️ API Key Issue Detected

## Problem
The Gemini API key in your `.env` file is **invalid**.

Error: `API key not valid. Please pass a valid API key.`

## Solution: Get a Valid API Key

### Option 1: Google AI Studio (Recommended - Free)
1. **Visit**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Get API Key"** or "Create API Key"
4. **Create API key** (choose "Create API key in new project" or existing project)
5. **Copy the key** - it should look like: `AIzaSy...` (39-40 characters)
6. **Update .env file** with the new key

### Option 2: Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Generative Language API"
4. Go to "APIs & Services" > "Credentials"
5. Create API key
6. Copy and update .env file

## Update .env File

Open: `brenda-backend/.env`

Replace this line:
```
GEMINI_API_KEY=AIzaSyCsB5Gre3JdGupwUPNgNwJvbVKvepp9hjAp
```

With your new key:
```
GEMINI_API_KEY=your_new_valid_key_here
```

**Important**: 
- No spaces before or after the key
- No quotes around the key
- Just: `GEMINI_API_KEY=AIzaSy...`

## After Getting New Key

1. **Update .env** file with the new key
2. **Run test**: `node test-api-key.js`
3. **If successful**, run: `node test-gemini-direct.js`
4. **Start using** AI features!

## Quick Test Command

After updating the key, run:
```powershell
cd brenda-backend
node test-api-key.js
```

You should see: ✅ SUCCESS!

## Need Help?

- Google AI Studio: https://aistudio.google.com/
- Documentation: https://ai.google.dev/tutorials/setup
- API Keys: https://aistudio.google.com/app/apikey

## Note

The current API key format looks correct (starts with AIza, 40 characters), but Google is rejecting it. This could mean:
1. The key was deleted
2. The key belongs to a different project
3. The key restrictions don't allow Generative Language API
4. The key is from an expired trial

**Solution**: Just create a fresh new API key from Google AI Studio.

---

**Once you get a valid key, all 5 AI features will work perfectly!** 🚀

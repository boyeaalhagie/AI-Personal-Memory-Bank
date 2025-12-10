# Clean Git History - Instructions

The API key is still in git history. You have two options:

## Option 1: Use GitHub's Allow Feature (Quick Fix)

1. Visit: https://github.com/boyeaalhagie/AI-Personal-Memory-Bank/security/secret-scanning/unblock-secret/36dbtN9J98Up6hkHwirB1RkR74o
2. Click "Allow secret" (temporary - allows you to push)
3. Push your code
4. **IMPORTANT**: Revoke the exposed API key immediately at https://platform.openai.com/api-keys
5. Create a new API key

## Option 2: Use BFG Repo-Cleaner (Proper Fix)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Create `secrets.txt` with just the API key (one line - replace with your actual exposed key):
   ```
   YOUR_EXPOSED_API_KEY_HERE
   ```
3. Run:
   ```powershell
   java -jar bfg.jar --replace-text secrets.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git remote add origin https://github.com/boyeaalhagie/AI-Personal-Memory-Bank.git
   git push --force-with-lease origin main
   ```

## ⚠️ CRITICAL: Revoke the Exposed Key

The API key that was exposed MUST be revoked:
1. Go to https://platform.openai.com/api-keys
2. Find and delete the exposed key
3. Create a new key
4. Update your `.env` file


# 🔒 Security Guidelines

## 🚨 Important: API Keys & Secrets Management

### ✅ **Safe Practices:**
- Use `.cursor/mcp.json.template` as a reference for configuration
- Copy template to `.cursor/mcp.json.local` and add your real API keys there
- Never commit files containing real API keys to version control
- Use environment variables for production deployments

### 🔐 **API Key Storage:**

#### For Development:
1. Copy the template: `cp .cursor/mcp.json.template .cursor/mcp.json.local`
2. Add your real API keys to `.cursor/mcp.json.local`
3. Use `.cursor/mcp.json.local` for local development (auto-ignored by git)

#### For Production:
- Use environment variables or secure secret management services
- Never hardcode API keys in source code

### 📁 **Protected Files:**
The `.gitignore` file protects these sensitive files from being committed:
- `.env` files (all variants)
- `*.key`, `*.pem` files
- `secrets.json`, `api-keys.json`
- `firebase-adminsdk-*.json`
- `google-services.json`
- And many more...

### 🔍 **If API Keys Are Accidentally Exposed:**
1. **Immediately revoke/regenerate** the exposed keys
2. Remove them from the repository (edit files, commit changes)
3. Consider using `git filter-branch` or BFG Repo-Cleaner for git history cleanup
4. Push the cleaned repository

### ⚡ **Quick Setup for New Developers:**
```bash
# Copy template and add your keys
cp .cursor/mcp.json.template .cursor/mcp.json.local
# Edit .cursor/mcp.json.local with your real API keys
# Never commit .cursor/mcp.json.local
```

### 🛡️ **Additional Security Measures:**
- Regularly rotate API keys
- Use API key restrictions when available (IP restrictions, etc.)
- Monitor API key usage for unusual activity
- Use least-privilege access for all services

## 🆘 **Emergency Response:**
If you discover exposed secrets:
1. **Stop** - Don't panic
2. **Revoke** - Immediately disable the exposed keys
3. **Remove** - Edit files to remove secrets
4. **Report** - Inform team members if applicable
5. **Review** - Check for other potential exposures 
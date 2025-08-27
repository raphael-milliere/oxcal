# PWA Testing Checklist for OxCal

## Prerequisites
- [ ] Generate all icon files using `/public/icons/generate-icons.html`
- [ ] Save all generated icons to `/public/icons/` directory
- [ ] Run `pnpm build` to create production build

## Testing Steps

### 1. Local Development Testing
```bash
pnpm dev
```
- [ ] Open http://localhost:3000 in Chrome
- [ ] Open DevTools > Application tab
- [ ] Check "Manifest" section - should load without errors
- [ ] Check "Service Workers" section - should show registered SW
- [ ] Check Console for any SW errors

### 2. Production Build Testing
```bash
pnpm build
pnpm preview
```
- [ ] Open http://localhost:4173 in Chrome (or whatever port preview uses)
- [ ] Open DevTools > Application tab
- [ ] Verify manifest loads correctly
- [ ] Verify service worker registers
- [ ] Check that assets are being cached

### 3. PWA Installation Testing

#### Chrome Desktop (Windows/Mac/Linux)
- [ ] Navigate to the deployed site (HTTPS required, or localhost)
- [ ] Look for install icon in address bar (usually right side)
- [ ] Alternative: Chrome menu (⋮) > "Install OxCal..."
- [ ] Click install and verify app installs
- [ ] Launch installed PWA and verify it works offline

#### Chrome Mobile (Android)
- [ ] Navigate to the deployed site
- [ ] Chrome should show "Add to Home Screen" banner
- [ ] Or use Chrome menu > "Add to Home Screen"
- [ ] Verify icon appears on home screen
- [ ] Launch and verify standalone mode

### 4. Offline Testing
- [ ] Install the PWA
- [ ] Load the app once while online
- [ ] Turn off network/go offline
- [ aaph the app - should still work
- [ ] Verify calendar displays
- [ ] Verify search functionality works with cached data

## Common Issues & Solutions

### No Install Prompt Appears
**Check these requirements:**
- Site must be served over HTTPS (or localhost)
- manifest.json must be valid and accessible
- At least one icon (192x192 or 512x512) must exist
- Service worker must register successfully
- Site must have a `start_url` that responds with 200
- User engagement heuristics must be met

### Service Worker Fails to Register
**Check:**
- Console for specific error messages
- Network tab for 404s on SW file
- Application > Service Workers for registration issues
- Ensure SW scope is correct

### Icons Not Loading
**Check:**
- Network tab for 404s on icon files
- Ensure all declared icon sizes exist in `/icons/`
- Verify icon paths in manifest.json

## Chrome DevTools Checks

### Application > Manifest
Should show:
- ✓ Identity: Name and short name
- ✓ Presentation: Standalone display mode
- ✓ Icons: At least 192x192 and 512x512
- ✓ Protocol Handlers: start_url defined
- No errors or warnings

### Application > Service Workers
Should show:
- Status: Activated and running
- Clients: Current tab controlled by SW
- Update on reload: Can be checked for testing

### Lighthouse PWA Audit
Run Lighthouse audit (DevTools > Lighthouse):
- [ ] PWA badge should be awarded
- [ ] All PWA requirements should pass
- [ ] Offline capability should work

## Deployment Testing
After deploying to production (Vercel/Netlify):
- [ ] HTTPS is working
- [ ] Manifest loads from correct path
- [ ] Service worker registers
- [ ] Install prompt appears
- [ ] Icons load correctly
- [ ] Offline mode works

## Success Criteria
- ✅ Chrome shows install button/prompt
- ✅ App installs successfully
- ✅ Installed app launches in standalone mode
- ✅ App works offline after first visit
- ✅ Icons display correctly everywhere
/**
 * PWA Installation and Update Handler
 */

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.installButton = null;
    this.updateAvailable = false;
    
    this.init();
  }
  
  init() {
    // Check if PWA is already installed
    this.checkInstallState();
    
    // Register service worker
    this.registerServiceWorker();
    
    // Set up install prompt handler
    this.setupInstallPrompt();
    
    // Listen for app installed event
    this.setupInstalledListener();
    
    // Create install UI
    this.createInstallUI();
  }
  
  checkInstallState() {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return;
    }
    
    // Check if app was launched from home screen (iOS)
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      return;
    }
    
    // Check URL parameters for PWA launch
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('source') === 'pwa') {
      this.isInstalled = true;
    }
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateNotification();
            }
          });
        });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent default install prompt
      event.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = event;
      
      // Show custom install button
      this.showInstallButton();
      
      console.log('Install prompt deferred');
    });
  }
  
  setupInstalledListener() {
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
      
      // Track installation
      this.trackEvent('pwa_installed');
    });
  }
  
  createInstallUI() {
    // Create install button container
    const installContainer = document.createElement('div');
    installContainer.className = 'pwa-install-container';
    installContainer.setAttribute('aria-hidden', 'true');
    installContainer.innerHTML = `
      <div class="pwa-install-prompt">
        <div class="pwa-install-content">
          <p class="pwa-install-text">Install OxCal for offline access</p>
          <div class="pwa-install-actions">
            <button type="button" class="pwa-install-button" id="pwa-install-btn">
              Install App
            </button>
            <button type="button" class="pwa-dismiss-button" id="pwa-dismiss-btn" aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(installContainer);
    
    // Store button reference
    this.installButton = document.getElementById('pwa-install-btn');
    const dismissButton = document.getElementById('pwa-dismiss-btn');
    
    // Handle install button click
    this.installButton?.addEventListener('click', () => {
      this.handleInstallClick();
    });
    
    // Handle dismiss button click
    dismissButton?.addEventListener('click', () => {
      this.hideInstallButton();
      this.trackEvent('pwa_install_dismissed');
    });
  }
  
  showInstallButton() {
    if (this.isInstalled) return;
    
    const container = document.querySelector('.pwa-install-container');
    if (container) {
      container.classList.add('visible');
      container.setAttribute('aria-hidden', 'false');
      
      // Auto-hide after 30 seconds if not interacted
      setTimeout(() => {
        if (container.classList.contains('visible')) {
          this.hideInstallButton();
        }
      }, 30000);
    }
  }
  
  hideInstallButton() {
    const container = document.querySelector('.pwa-install-container');
    if (container) {
      container.classList.remove('visible');
      container.setAttribute('aria-hidden', 'true');
    }
  }
  
  async handleInstallClick() {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return;
    }
    
    // Hide install button
    this.hideInstallButton();
    
    // Show the install prompt
    this.deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    
    // Track the outcome
    this.trackEvent('pwa_install_' + outcome);
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
  }
  
  showUpdateNotification() {
    this.updateAvailable = true;
    
    // Create update notification
    const updateContainer = document.createElement('div');
    updateContainer.className = 'pwa-update-container visible';
    updateContainer.innerHTML = `
      <div class="pwa-update-prompt">
        <p class="pwa-update-text">A new version of OxCal is available!</p>
        <button type="button" class="pwa-update-button" id="pwa-update-btn">
          Update Now
        </button>
      </div>
    `;
    
    document.body.appendChild(updateContainer);
    
    // Handle update button click
    const updateButton = document.getElementById('pwa-update-btn');
    updateButton?.addEventListener('click', () => {
      this.handleUpdate();
    });
  }
  
  handleUpdate() {
    if (!this.updateAvailable) return;
    
    // Send message to service worker to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING'
      });
    }
    
    // Reload the page to get the new version
    window.location.reload();
  }
  
  trackEvent(eventName) {
    // Analytics tracking placeholder
    console.log('PWA Event:', eventName);
    
    // Future: Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'PWA'
      });
    }
  }
}

// Initialize PWA manager when DOM is ready
let pwaManager = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
  });
} else {
  pwaManager = new PWAManager();
}

export { pwaManager };
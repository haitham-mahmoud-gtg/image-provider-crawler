// src/auth.js

async function loginToGumtree(page, email, password) {
  console.log(`🔐 Logging in as ${email}...`);
  
  try {
    // Navigate to login page
    await page.goto("https://www.staging.p.nonprod.gtau.net/t-login.html", { 
      waitUntil: "domcontentloaded", 
      timeout: 60000 
    });
    
    // Wait for login form to be ready
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill in email using exact ID
    await page.fill('#login-email', email);
    await page.waitForTimeout(500);
    
    // Fill in password using exact ID
    await page.fill('#login-password', password);
    await page.waitForTimeout(500);
    
    // Click login button using exact ID
    await page.click('#btn-submit-login');
    
    // Wait for navigation after login
    await page.waitForTimeout(5000);
    
    // Wait for network to stabilize after login
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check if login was successful by looking for user-specific elements
    const loginCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasLogout = document.querySelector('[href*="logout"]') !== null ||
                        document.querySelector('a:has-text("Sign out")') !== null ||
                        document.querySelector('a:has-text("Log out")') !== null;
      const hasMyGumtree = bodyText.includes('My Gumtree') || bodyText.includes('My Account');
      const hasLoginError = bodyText.includes('incorrect') ||
                            bodyText.includes('invalid') ||
                            bodyText.includes('failed');
      
      return {
        hasLogout,
        hasMyGumtree,
        hasLoginError,
        currentUrl: window.location.href
      };
    });
    
    console.log(`  🔍 Login check: Logout=${loginCheck.hasLogout}, MyGumtree=${loginCheck.hasMyGumtree}, Error=${loginCheck.hasLoginError}`);
    console.log(`  🔍 Current URL: ${loginCheck.currentUrl}`);
    
    const isLoggedIn = (loginCheck.hasLogout || loginCheck.hasMyGumtree) && !loginCheck.hasLoginError;
    
    if (isLoggedIn) {
      console.log(`✅ Successfully logged in as ${email}`);
      return true;
    } else {
      console.log(`❌ Login verification failed - authentication unsuccessful`);
      return false; // DO NOT continue if login failed
    }
  } catch (error) {
    console.error(`❌ Login error: ${error.message}`);
    return false;
  }
}

module.exports = { loginToGumtree };

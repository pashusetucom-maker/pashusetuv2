// =============================================================
//  MSG91 OTP – Web SDK (Custom UI) integration
//  Docs: https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget
//
//  Yeh frontend-safe tareeka hai: account ka main "authkey" browser
//  me kabhi expose nahi hota, sirf widget ka "tokenAuth" use hota hai.
//
//  Required .env values:
//    REACT_APP_MSG91_WIDGET_ID   = (MSG91 panel > OTP widget se)
//    REACT_APP_MSG91_TOKEN_AUTH  = (MSG91 panel > OTP widget token)
// =============================================================

const WIDGET_ID = process.env.REACT_APP_MSG91_WIDGET_ID;
const TOKEN_AUTH = process.env.REACT_APP_MSG91_TOKEN_AUTH;
const SCRIPT_SRC = 'https://verify.msg91.com/otp-provider.js';

let initPromise = null;

/**
 * MSG91 ka script ek hi baar load karke widget initialize karta hai.
 * exposeMethods:true -> window.sendOtp / window.verifyOtp / window.retryOtp
 * available ho jaate hain aur koi popup UI show nahi hota.
 */
export const initMsg91 = () => {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    if (!WIDGET_ID || !TOKEN_AUTH) {
      reject(
        new Error(
          'MSG91 config missing. Set REACT_APP_MSG91_WIDGET_ID and REACT_APP_MSG91_TOKEN_AUTH in your .env file.'
        )
      );
      return;
    }

    // Already initialized
    if (
      typeof window.sendOtp === 'function' &&
      typeof window.verifyOtp === 'function' &&
      typeof window.retryOtp === 'function'
    ) {
      resolve();
      return;
    }

    const configuration = {
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      exposeMethods: true, // expose methods on window, no default popup
      success: (data) => {
        // Per-call callbacks handle success; kept for SDK requirement.
        console.log('MSG91 success', data);
      },
      failure: (error) => {
        console.log('MSG91 failure', error);
      },
    };

    const onReady = () => {
      try {
        if (typeof window.initSendOTP === 'function') {
          window.initSendOTP(configuration);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    };

    const existing = document.getElementById('msg91-otp-provider');
    if (existing) {
      onReady();
      return;
    }

    const script = document.createElement('script');
    script.id = 'msg91-otp-provider';
    script.type = 'text/javascript';
    script.src = SCRIPT_SRC;
    script.onload = onReady;
    script.onerror = () => reject(new Error('Failed to load MSG91 OTP script'));
    document.body.appendChild(script);
  });

  return initPromise;
};

const toIdentifier = (mobile) => `91${String(mobile).replace(/\D/g, '').slice(-10)}`;

/**
 * OTP bhejta hai. Success par reqId return karta hai (ise verify/resend me use karo).
 * @param {string} mobile - 10 digit mobile number
 * @returns {Promise<string>} reqId
 */
export const sendOtp = async (mobile) => {
  await initMsg91();
  const identifier = toIdentifier(mobile);
  return new Promise((resolve, reject) => {
    window.sendOtp(
      identifier,
      (data) => resolve(data && (data.message || data.reqId) ? (data.message || data.reqId) : data),
      (error) => reject(error)
    );
  });
};

/**
 * OTP dobara bhejta hai.
 * @param {string} reqId - sendOtp se mila reqId
 * @param {string|null} channel - null = widget ka default channel
 */
export const retryOtp = async (reqId, channel = null) => {
  await initMsg91();
  return new Promise((resolve, reject) => {
    window.retryOtp(
      channel,
      (data) => resolve(data),
      (error) => reject(error),
      reqId
    );
  });
};

/**
 * User ka daala hua OTP verify karta hai.
 * @param {string|number} otp
 * @param {string} reqId - sendOtp se mila reqId
 */
export const verifyOtp = async (otp, reqId) => {
  await initMsg91();
  return new Promise((resolve, reject) => {
    window.verifyOtp(
      otp,
      (data) => resolve(data),
      (error) => reject(error),
      reqId
    );
  });
};

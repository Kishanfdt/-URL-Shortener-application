const parseUserAgent = (uaString) => {
  if (!uaString) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  }

  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let device = 'Desktop';
  let os = 'Unknown';

  // 1. Determine Browser
  if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  }

  // 2. Determine Operating System (OS)
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os x') || ua.includes('mac_powerpc')) {
    os = 'macOS';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // 3. Determine Device
  if (ua.includes('mobi') || ua.includes('iphone') || ua.includes('ipod') || ua.includes('android')) {
    device = 'Mobile';
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  }

  return { browser, os, device };
};

module.exports = { parseUserAgent };

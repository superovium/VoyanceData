/**
 * collector.js
 * Récolte asynchrone des données publiques du navigateur.
 * Toutes les fonctions renvoient une Promise et ne jettent jamais d'exception :
 * en cas d'échec (API bloquée, navigateur non supporté), la valeur est `null`
 * et le champ `_errors` du rapport final liste l'incident.
 *
 * Usage :
 *   const data = await Collector.collectAll();
 */

const Collector = (() => {
  const errors = [];

  const safe = async (label, fn) => {
    try {
      return await fn();
    } catch (err) {
      errors.push({ label, message: err?.message ?? String(err) });
      return null;
    }
  };

  // --- 1. Réseau : IP, géoloc approx., FAI -------------------------------
  // ip-api.com (gratuit, HTTPS, pas de clé requise pour < 45 req/min)
  const getNetworkInfo = () => safe('network', async () => {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    return {
      ip: j.ip,
      country: j.country_name,
      countryCode: j.country_code,
      region: j.region,
      city: j.city,
      postal: j.postal,
      lat: j.latitude,
      lon: j.longitude,
      timezone: j.timezone,
      isp: j.org,
      asn: j.asn,
    };
  });

  // --- 2. Navigateur & OS ------------------------------------------------
  const getBrowserInfo = () => safe('browser', async () => {
    const ua = navigator.userAgent;
    const uaData = navigator.userAgentData ?? null;
    let highEntropy = null;
    if (uaData?.getHighEntropyValues) {
      highEntropy = await uaData.getHighEntropyValues([
        'platform', 'platformVersion', 'architecture', 'model', 'bitness',
      ]);
    }
    return {
      userAgent: ua,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      languages: [...(navigator.languages ?? [])],
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory ?? null,
      uaData: highEntropy,
    };
  });

  // --- 3. Écran & fenêtre ------------------------------------------------
  const getDisplayInfo = () => safe('display', async () => {
    const screenHz = await detectRefreshRate();
    return {
      screenW: screen.width,
      screenH: screen.height,
      availW: screen.availWidth,
      availH: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      windowW: window.innerWidth,
      windowH: window.innerHeight,
      orientation: screen.orientation?.type ?? null,
      refreshHz: screenHz,
    };
  });

  // Estimation du taux de rafraîchissement via requestAnimationFrame
  const detectRefreshRate = () => new Promise((resolve) => {
    const frames = [];
    let prev = performance.now();
    let count = 0;
    const sample = (t) => {
      frames.push(t - prev);
      prev = t;
      if (++count < 60) return requestAnimationFrame(sample);
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      resolve(Math.round(1000 / avg));
    };
    requestAnimationFrame(sample);
  });

  // --- 4. GPU (WebGL) ----------------------------------------------------
  const getGPUInfo = () => safe('gpu', async () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    };
  });

  // --- 5. Paramètres locaux (heure, fuseau, langue) ----------------------
  const getLocaleInfo = () => safe('locale', async () => {
    const now = new Date();
    const fmt = Intl.DateTimeFormat().resolvedOptions();
    return {
      isoTime: now.toISOString(),
      localHour: now.getHours(),
      localMinutes: now.getMinutes(),
      dayOfWeek: now.getDay(),            // 0 = dimanche
      timezone: fmt.timeZone,
      tzOffsetMin: -now.getTimezoneOffset(),
      locale: fmt.locale,
      calendar: fmt.calendar,
      numberingSystem: fmt.numberingSystem,
    };
  });

  // --- 6. Thème (dark / light / motion) ----------------------------------
  const getPreferences = () => safe('preferences', async () => ({
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    reducedData: matchMedia('(prefers-reduced-data: reduce)').matches,
    highContrast: matchMedia('(prefers-contrast: more)').matches,
  }));

  // --- 7. Batterie -------------------------------------------------------
  const getBatteryInfo = () => safe('battery', async () => {
    if (!navigator.getBattery) return null;
    const b = await navigator.getBattery();
    return {
      level: b.level,                     // 0 → 1
      charging: b.charging,
      chargingTime: b.chargingTime,       // secondes
      dischargingTime: b.dischargingTime,
    };
  });

  // --- 8. Accéléromètre / mouvement (mobile) -----------------------------
  const getMotionInfo = () => safe('motion', async () => {
    if (typeof DeviceMotionEvent === 'undefined') return null;
    // iOS 13+ exige une permission explicite → on ne la demande pas ici
    // pour ne pas casser l'ambiance mystique. On note juste la dispo.
    return {
      supported: true,
      permissionRequired: typeof DeviceMotionEvent.requestPermission === 'function',
    };
  });

  // --- 9. Connexion réseau (Network Information API) ---------------------
  const getConnectionInfo = () => safe('connection', async () => {
    const c = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
    if (!c) return null;
    return {
      effectiveType: c.effectiveType,     // '4g', '3g', ...
      downlink: c.downlink,                // Mb/s estimés
      rtt: c.rtt,                          // latence estimée ms
      saveData: c.saveData,
    };
  });

  // --- Orchestration -----------------------------------------------------
  const collectAll = async () => {
    errors.length = 0;
    const [network, browser, display, gpu, locale, prefs, battery, motion, conn] =
      await Promise.all([
        getNetworkInfo(),
        getBrowserInfo(),
        getDisplayInfo(),
        getGPUInfo(),
        getLocaleInfo(),
        getPreferences(),
        getBatteryInfo(),
        getMotionInfo(),
        getConnectionInfo(),
      ]);

    return {
      collectedAt: new Date().toISOString(),
      network, browser, display, gpu, locale,
      preferences: prefs, battery, motion, connection: conn,
      _errors: [...errors],
    };
  };

  return { collectAll };
})();

export default Collector;

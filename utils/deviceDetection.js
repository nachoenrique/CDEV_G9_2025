/**
 * DeviceDetection - Utilidades para detectar el tipo de dispositivo
 */

/**
 * Detecta si el dispositivo es móvil basándose en el User Agent
 * @returns {boolean} True si es un dispositivo móvil
 */
export function isMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detectar dispositivos móviles comunes
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Detecta si el dispositivo es tablet
 * @returns {boolean} True si es una tablet
 */
export function isTablet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    return /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
}

/**
 * Detecta si el dispositivo es específicamente iOS
 * @returns {boolean} True si es iOS (iPhone, iPad, iPod)
 */
export function isIOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detección mejorada que incluye iOS 13+ y dispositivos más nuevos
    // También detecta iPads que se identifican como Mac en iOS 13+
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isIOSNewAPI = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    
    return isIOSDevice || isIOSNewAPI;
}

/**
 * Detecta si el dispositivo es Android
 * @returns {boolean} True si es Android
 */
export function isAndroid() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    return /android/i.test(userAgent);
}

/**
 * Detecta si el dispositivo tiene pantalla táctil
 * @returns {boolean} True si soporta touch
 */
export function isTouchDevice() {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Detecta si el dispositivo está en modo portrait (vertical)
 * @returns {boolean} True si está en vertical
 */
export function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

/**
 * Detecta si el dispositivo está en modo landscape (horizontal)
 * @returns {boolean} True si está en horizontal
 */
export function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

/**
 * Obtiene información completa del dispositivo
 * @returns {Object} Objeto con toda la información del dispositivo
 */
export function getDeviceInfo() {
    return {
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: !isMobile() && !isTablet(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        isTouchDevice: isTouchDevice(),
        isPortrait: isPortrait(),
        isLandscape: isLandscape(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        userAgent: navigator.userAgent
    };
}

/**
 * Detecta si el dispositivo soporta giroscopio
 * @returns {boolean} True si soporta DeviceOrientation
 */
export function supportsGyroscope() {
    return 'DeviceOrientationEvent' in window;
}

/**
 * Detecta si el dispositivo requiere permisos para el giroscopio (iOS 13+)
 * @returns {boolean} True si requiere permisos explícitos
 */
export function requiresMotionPermission() {
    return typeof DeviceOrientationEvent !== 'undefined' && 
           typeof DeviceOrientationEvent.requestPermission === 'function';
}

/**
 * Detecta el tipo de dispositivo de forma simple
 * @returns {string} 'mobile', 'tablet', o 'desktop'
 */
export function getDeviceType() {
    if (isTablet()) return 'tablet';
    if (isMobile()) return 'mobile';
    return 'desktop';
}

// Log de información al importar (útil para debugging)
console.log('📱 Device Info:', getDeviceInfo());

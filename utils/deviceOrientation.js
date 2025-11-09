/**
 * DeviceOrientationController - Gestiona los controles de giroscopio/acelerómetro
 * Permite controlar el juego inclinando el dispositivo móvil
 */

export class DeviceOrientationController {
    constructor() {
        this.enabled = false;
        this.supported = false;
        this.permissionGranted = false;
        
        // Valores de orientación del dispositivo
        this.beta = 0;  // Inclinación adelante/atrás (X axis) - rango: -180 a 180
        this.gamma = 0; // Inclinación izquierda/derecha (Z axis) - rango: -90 a 90
        
        // Calibración - posición neutral
        this.calibrationBeta = 0;
        this.calibrationGamma = 0;
        
        // Configuración de sensibilidad y deadzone
        this.sensitivity = 1.5; // Multiplicador de sensibilidad
        this.deadzone = 3; // Grados de "zona muerta" para evitar movimientos no deseados
        
        // Valores normalizados para el juego (-1 a 1)
        this.tiltX = 0;
        this.tiltZ = 0;
        
        // Verificar soporte
        this.checkSupport();
    }

    /**
     * Verifica si el dispositivo soporta DeviceOrientation API
     */
    checkSupport() {
        if (window.DeviceOrientationEvent) {
            this.supported = true;
            console.log('📱 DeviceOrientation API soportada');
        } else {
            this.supported = false;
            console.warn('⚠️ DeviceOrientation API no soportada en este dispositivo');
        }
    }

    /**
     * Solicita permisos (necesario en iOS 13+) e inicia el listener
     * @returns {Promise<boolean>} True si se otorgaron permisos
     */
    async requestPermission() {
        if (!this.supported) {
            console.error('❌ DeviceOrientation no soportada');
            return false;
        }

        // iOS 13+ requiere permiso explícito
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.permissionGranted = permission === 'granted';
                
                if (this.permissionGranted) {
                    console.log('✅ Permiso de DeviceOrientation otorgado');
                } else {
                    console.warn('⚠️ Permiso de DeviceOrientation denegado');
                }
            } catch (error) {
                console.error('❌ Error al solicitar permiso:', error);
                this.permissionGranted = false;
            }
        } else {
            // Android y navegadores que no requieren permiso
            this.permissionGranted = true;
            console.log('✅ Permiso de DeviceOrientation automático (no iOS 13+)');
        }

        return this.permissionGranted;
    }

    /**
     * Activa el control por giroscopio
     */
    enable() {
        if (!this.supported || !this.permissionGranted) {
            console.warn('⚠️ No se puede activar: falta soporte o permiso');
            return false;
        }

        if (!this.enabled) {
            this.enabled = true;
            this.startListening();
            console.log('🎮 Control por giroscopio ACTIVADO');
        }
        
        return true;
    }

    /**
     * Desactiva el control por giroscopio
     */
    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.stopListening();
            this.tiltX = 0;
            this.tiltZ = 0;
            console.log('🎮 Control por giroscopio DESACTIVADO');
        }
    }

    /**
     * Inicia el listener de eventos de orientación
     */
    startListening() {
        this.handleOrientation = (event) => {
            // Beta: rotación alrededor del eje X (-180 a 180)
            // Gamma: rotación alrededor del eje Z (-90 a 90)
            this.beta = event.beta || 0;
            this.gamma = event.gamma || 0;
            
            // Calcular valores relativos a la calibración
            let relativeBeta = this.beta - this.calibrationBeta;
            let relativeGamma = this.gamma - this.calibrationGamma;
            
            // Aplicar deadzone
            if (Math.abs(relativeBeta) < this.deadzone) relativeBeta = 0;
            if (Math.abs(relativeGamma) < this.deadzone) relativeGamma = 0;
            
            // Normalizar y aplicar sensibilidad
            // Beta: -90 a 90 grados (restringido para uso práctico)
            // Gamma: -45 a 45 grados (rango confortable)
            this.tiltX = this.clamp((relativeBeta / 45) * this.sensitivity, -1, 1);
            this.tiltZ = this.clamp((relativeGamma / 45) * this.sensitivity, -1, 1);
        };

        window.addEventListener('deviceorientation', this.handleOrientation, true);
    }

    /**
     * Detiene el listener de eventos de orientación
     */
    stopListening() {
        if (this.handleOrientation) {
            window.removeEventListener('deviceorientation', this.handleOrientation, true);
        }
    }

    /**
     * Calibra la posición actual como posición neutral
     */
    calibrate() {
        this.calibrationBeta = this.beta;
        this.calibrationGamma = this.gamma;
        console.log('🎯 Calibrado:', { beta: this.calibrationBeta, gamma: this.calibrationGamma });
    }

    /**
     * Resetea la calibración a valores por defecto
     */
    resetCalibration() {
        this.calibrationBeta = 0;
        this.calibrationGamma = 0;
        console.log('🔄 Calibración reseteada');
    }

    /**
     * Ajusta la sensibilidad del giroscopio
     * @param {number} value - Nuevo valor de sensibilidad (0.5 - 3.0 recomendado)
     */
    setSensitivity(value) {
        this.sensitivity = this.clamp(value, 0.1, 5.0);
        console.log('⚙️ Sensibilidad ajustada a:', this.sensitivity);
    }

    /**
     * Ajusta el deadzone (zona muerta)
     * @param {number} value - Grados de deadzone (0 - 10 recomendado)
     */
    setDeadzone(value) {
        this.deadzone = this.clamp(value, 0, 20);
        console.log('⚙️ Deadzone ajustado a:', this.deadzone, 'grados');
    }

    /**
     * Obtiene los valores de inclinación normalizados
     * @returns {Object} { tiltX, tiltZ } valores entre -1 y 1
     */
    getTilt() {
        return {
            tiltX: this.tiltX,
            tiltZ: this.tiltZ
        };
    }

    /**
     * Obtiene información del estado actual
     * @returns {Object} Estado completo del controlador
     */
    getStatus() {
        return {
            supported: this.supported,
            permissionGranted: this.permissionGranted,
            enabled: this.enabled,
            beta: this.beta,
            gamma: this.gamma,
            tiltX: this.tiltX,
            tiltZ: this.tiltZ,
            sensitivity: this.sensitivity,
            deadzone: this.deadzone
        };
    }

    /**
     * Utilidad: Limita un valor entre min y max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Limpia recursos al destruir el controlador
     */
    destroy() {
        this.disable();
        console.log('🗑️ DeviceOrientationController destruido');
    }
}

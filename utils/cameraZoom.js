/**
 * CameraZoom - Controla el zoom de la cámara mediante scroll (desktop) y pinch (mobile)
 * - Desktop: Usa la rueda del mouse (wheel event)
 * - Mobile: Usa gestos de pinch con dos dedos (touch events)
 * - Modifica la posición Y de la cámara para simular zoom
 */

import { isMobile } from './deviceDetection.js';

export class CameraZoom {
    constructor(camera, minY = 30, maxY = 80, zoomSpeed = 2, smoothing = 0.15) {
        this.camera = camera;
        this.minY = minY;           // Posición Y mínima (más cerca)
        this.maxY = maxY;           // Posición Y máxima (más lejos)
        this.zoomSpeed = zoomSpeed; // Velocidad de zoom
        this.smoothing = smoothing; // Suavizado de la transición (0-1)
        
        // Estado actual y objetivo
        this.targetY = camera.position.y;
        this.currentY = camera.position.y;
        
        // Estado de touch para pinch
        this.touchState = {
            initialDistance: 0,
            isActive: false
        };
        
        // Detectar tipo de dispositivo
        this.isMobileDevice = isMobile();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log(`📷 CameraZoom inicializado - Dispositivo: ${this.isMobileDevice ? 'Mobile' : 'Desktop'}`);
        console.log(`   Rango Y: ${this.minY} a ${this.maxY}`);
    }

    /**
     * Configura los event listeners según el dispositivo
     */
    setupEventListeners() {
        if (this.isMobileDevice) {
            // Mobile: Usar touch events para pinch
            this.setupTouchListeners();
        } else {
            // Desktop: Usar wheel event para scroll
            this.setupWheelListener();
        }
    }

    /**
     * Configura el listener de rueda del mouse (desktop)
     */
    setupWheelListener() {
        this.wheelHandler = (event) => {
            event.preventDefault();
            
            // deltaY positivo = scroll hacia abajo = zoom out (alejar)
            // deltaY negativo = scroll hacia arriba = zoom in (acercar)
            const delta = Math.sign(event.deltaY) * this.zoomSpeed;
            
            this.targetY += delta;
            this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
            
            // Log para debug
            // console.log(`🖱️ Scroll: targetY = ${this.targetY.toFixed(1)}`);
        };
        
        window.addEventListener('wheel', this.wheelHandler, { passive: false });
        console.log('✅ Listener de wheel (scroll) configurado para desktop');
    }

    /**
     * Configura los listeners de touch para pinch (mobile)
     */
    setupTouchListeners() {
        // Touch Start - Detectar inicio de pinch
        this.touchStartHandler = (event) => {
            if (event.touches.length === 2) {
                this.touchState.isActive = true;
                this.touchState.initialDistance = this.getTouchDistance(event.touches);
                
                // console.log('🤏 Pinch iniciado');
            }
        };
        
        // Touch Move - Calcular cambio de distancia
        this.touchMoveHandler = (event) => {
            if (this.touchState.isActive && event.touches.length === 2) {
                event.preventDefault();
                
                const currentDistance = this.getTouchDistance(event.touches);
                const distanceDelta = currentDistance - this.touchState.initialDistance;
                
                // Pinch out (separar dedos) = zoom in (acercar) = Y menor
                // Pinch in (juntar dedos) = zoom out (alejar) = Y mayor
                const zoomDelta = -distanceDelta * 0.1; // Ajustar sensibilidad
                
                this.targetY = this.currentY + zoomDelta;
                this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
                
                // console.log(`🤏 Pinch: distancia=${currentDistance.toFixed(1)}, targetY=${this.targetY.toFixed(1)}`);
            }
        };
        
        // Touch End - Terminar pinch
        this.touchEndHandler = (event) => {
            if (event.touches.length < 2) {
                if (this.touchState.isActive) {
                    // Guardar la posición actual como la nueva base
                    this.currentY = this.targetY;
                    // console.log('🤏 Pinch finalizado');
                }
                this.touchState.isActive = false;
            }
        };
        
        window.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        window.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        window.addEventListener('touchend', this.touchEndHandler, { passive: false });
        
        console.log('✅ Listeners de touch (pinch) configurados para mobile');
    }

    /**
     * Calcula la distancia entre dos puntos de touch
     * @param {TouchList} touches - Lista de touches
     * @returns {number} Distancia entre los dos primeros touches
     */
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Actualiza la posición de la cámara con suavizado
     * Debe llamarse en cada frame del loop de animación
     */
    update() {
        // Interpolar suavemente hacia la posición objetivo
        this.currentY += (this.targetY - this.currentY) * this.smoothing;
        
        // Aplicar a la cámara
        this.camera.position.y = this.currentY;
    }

    /**
     * Establece una nueva posición Y objetivo directamente
     * @param {number} y - Nueva posición Y
     */
    setTargetY(y) {
        this.targetY = Math.max(this.minY, Math.min(this.maxY, y));
    }

    /**
     * Establece la posición Y actual sin suavizado
     * @param {number} y - Nueva posición Y
     */
    setCurrentY(y) {
        y = Math.max(this.minY, Math.min(this.maxY, y));
        this.currentY = y;
        this.targetY = y;
        this.camera.position.y = y;
    }

    /**
     * Resetea el zoom a una posición específica
     * @param {number} y - Posición Y a resetear (por defecto: promedio de min/max)
     */
    reset(y = null) {
        const resetY = y !== null ? y : (this.minY + this.maxY) / 2;
        this.setCurrentY(resetY);
        console.log(`🔄 Zoom reseteado a Y = ${resetY}`);
    }

    /**
     * Ajusta los límites de zoom
     * @param {number} minY - Nueva posición Y mínima
     * @param {number} maxY - Nueva posición Y máxima
     */
    setLimits(minY, maxY) {
        this.minY = minY;
        this.maxY = maxY;
        
        // Asegurar que los valores actuales estén dentro de los nuevos límites
        this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
        this.currentY = Math.max(this.minY, Math.min(this.maxY, this.currentY));
        
        console.log(`📏 Límites de zoom actualizados: ${minY} a ${maxY}`);
    }

    /**
     * Ajusta la velocidad de zoom (solo para desktop)
     * @param {number} speed - Nueva velocidad de zoom
     */
    setZoomSpeed(speed) {
        this.zoomSpeed = speed;
        console.log(`⚡ Velocidad de zoom actualizada: ${speed}`);
    }

    /**
     * Ajusta el suavizado de la transición
     * @param {number} smoothing - Nuevo valor de suavizado (0-1)
     */
    setSmoothing(smoothing) {
        this.smoothing = Math.max(0, Math.min(1, smoothing));
        console.log(`🌊 Suavizado actualizado: ${this.smoothing}`);
    }

    /**
     * Obtiene información del estado actual del zoom
     * @returns {Object} Estado del zoom
     */
    getStatus() {
        return {
            currentY: this.currentY,
            targetY: this.targetY,
            minY: this.minY,
            maxY: this.maxY,
            isMobile: this.isMobileDevice,
            pinchActive: this.touchState.isActive
        };
    }

    /**
     * Limpia los event listeners (importante para evitar memory leaks)
     */
    dispose() {
        if (this.isMobileDevice) {
            window.removeEventListener('touchstart', this.touchStartHandler);
            window.removeEventListener('touchmove', this.touchMoveHandler);
            window.removeEventListener('touchend', this.touchEndHandler);
        } else {
            window.removeEventListener('wheel', this.wheelHandler);
        }
        
        console.log('🗑️ CameraZoom listeners removidos');
    }
}

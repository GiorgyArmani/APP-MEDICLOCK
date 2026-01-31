/**
 * Notification sound utility using Web Audio API
 * Plays a pleasant notification sound when new notifications arrive
 */

let audioContext: AudioContext | null = null
let isMuted = false

// Initialize audio context on first use
function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext
}

/**
 * Play a notification sound
 * Uses Web Audio API to generate a pleasant "ding" sound
 */
export function playNotificationSound() {
    if (isMuted || typeof window === "undefined") return

    try {
        const ctx = getAudioContext()
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        // Create a pleasant "ding" sound (two-tone)
        oscillator.frequency.setValueAtTime(800, ctx.currentTime)
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
    } catch (error) {
        console.error("Error playing notification sound:", error)
    }
}

/**
 * Toggle mute state
 */
export function toggleMute() {
    isMuted = !isMuted
    return isMuted
}

/**
 * Get current mute state
 */
export function isSoundMuted() {
    return isMuted
}

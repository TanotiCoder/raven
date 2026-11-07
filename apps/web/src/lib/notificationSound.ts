import { getDefaultStore } from "jotai"
import { NotificationVolumeAtom } from "@utils/preferences"

const NOTIFICATION_SOUND = "/assets/raven/sounds/raven_notification_1.mp3"

/**
 * Plays the new-message sound at the given volume (0–100), defaulting to the
 * user's stored preference. Browsers block audio until the first interaction —
 * the play() rejection is expected before that and is swallowed.
 */
export const playNotificationSound = (volumePercent?: number) => {
    const volume = volumePercent ?? getDefaultStore().get(NotificationVolumeAtom)
    if (volume <= 0) return

    const audio = new Audio(NOTIFICATION_SOUND)
    audio.volume = Math.min(volume, 100) / 100
    audio.play().catch(() => undefined)
}

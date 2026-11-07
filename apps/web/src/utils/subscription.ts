import { atom, getDefaultStore } from "jotai"

/** Open state of the subscription-expired renewal dialog. */
export const subscriptionExpiredModalAtom = atom(false)

/** Opens the renewal dialog from non-React code (the send pipeline). */
export const showSubscriptionExpired = () => getDefaultStore().set(subscriptionExpiredModalAtom, true)

/**
 * Whether a failed send was rejected because the OpsDesk subscription expired.
 * A 403 response doesn't carry the server message, so fall back to asking the
 * subscription API directly.
 */
export const isSubscriptionExpired = async (error: unknown): Promise<boolean> => {
    const message = (error as { message?: string })?.message ?? ""
    if (message.includes("Subscription Expired")) return true

    try {
        const response = await fetch("/api/method/opsdesk.subscription.get_subscription_info", {
            credentials: "same-origin",
        })
        const data = await response.json()
        return data?.message?.status === "Expired"
    } catch {
        return false
    }
}

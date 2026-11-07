import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@components/ui/alert-dialog"
import { useAtom } from "jotai"
import { subscriptionExpiredModalAtom } from "@utils/subscription"
import _ from "@lib/translate"

/**
 * Shown when a message is rejected because the OpsDesk subscription expired.
 * Mounted once in the AppShell — the send pipeline opens it from non-React code.
 */
export const SubscriptionExpiredModal = () => {
    const [open, setOpen] = useAtom(subscriptionExpiredModalAtom)

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{_("Subscription expired")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {_("Your message could not be sent because your subscription has expired. Please renew your subscription and try again.")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{_("Close")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => window.open("/app/subscription", "_blank")}>
                        {_("Renew now")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

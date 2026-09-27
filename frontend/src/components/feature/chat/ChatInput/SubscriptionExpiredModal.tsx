import { AlertDialog, Button, Callout, Flex } from "@radix-ui/themes"
import { atom, useAtom } from "jotai"
import { FiAlertTriangle } from "react-icons/fi"

/** Global flag — set from useSendMessage when a send fails due to expired subscription. */
export const subscriptionExpiredModalAtom = atom(false)

export const SubscriptionExpiredModal = () => {
    const [open, setOpen] = useAtom(subscriptionExpiredModalAtom)

    return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Content maxWidth="480px">
                <AlertDialog.Title size="5">
                    Subscription Expired
                </AlertDialog.Title>
                <AlertDialog.Description size="3">
                    Your message could not be sent because your subscription has expired.
                </AlertDialog.Description>
                <Flex direction="column" gap="3" mt="4">
                    <Callout.Root color="red" size="2">
                        <Callout.Icon>
                            <FiAlertTriangle size="20" />
                        </Callout.Icon>
                        <Callout.Text size="3" weight="bold">
                           Please renew your subscription and try sending the message again.
                        </Callout.Text>
                    </Callout.Root>
                </Flex>
                <Flex gap="3" mt="5" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray" size="3">
                            Close
                        </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button
                            variant="solid"
                            color="red"
                            size="3"
                            onClick={() => window.open('/app/subscription', '_blank')}>
                            Renew Now
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    )
}

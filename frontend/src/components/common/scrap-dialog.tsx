import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ScrapDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => Promise<void>
    itemName?: string
}

export function ScrapDialog({ isOpen, onClose, onConfirm, itemName }: ScrapDialogProps) {
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = async () => {
        if (!reason.trim()) return
        setIsSubmitting(true)
        try {
            await onConfirm(reason)
            setReason("")
            onClose()
        } catch (e) {
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Scrap</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for scrapping {itemName ? `this ${itemName}` : "this item"}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="scrap-reason">Reason</Label>
                        <Input
                            id="scrap-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for scrapping..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!reason.trim() || isSubmitting} variant="destructive">
                        {isSubmitting ? "Scrapping..." : "Confirm Scrap"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

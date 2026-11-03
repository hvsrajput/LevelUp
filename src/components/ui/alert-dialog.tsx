"use client"

import * as React from "react"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

function AlertDialog({ ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof DialogPortal>) {
  return <DialogPortal {...props} />
}

function AlertDialogOverlay({ ...props }: React.ComponentProps<typeof DialogOverlay>) {
  return <DialogOverlay {...props} />
}

function AlertDialogContent({
  size = "sm",
  showCloseButton = false,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      size={size}
      showCloseButton={showCloseButton}
      className={className}
      {...props}
    />
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<typeof DialogHeader>) {
  return <DialogHeader className={className} {...props} />
}

function AlertDialogBody({ className, ...props }: React.ComponentProps<typeof DialogBody>) {
  return <DialogBody className={className} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={className} {...props} />
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={className} {...props} />
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={className} {...props} />
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button className={cn("rounded-lg", className)} {...props} />
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <DialogClose
      render={
        <Button
          variant="outline"
          className={cn("rounded-lg", className)}
          {...props}
        />
      }
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  type DialogSize as AlertDialogSize,
}

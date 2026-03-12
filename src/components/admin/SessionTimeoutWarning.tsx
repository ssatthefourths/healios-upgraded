import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface SessionTimeoutWarningProps {
  open: boolean;
  formattedTime: string;
  onExtendSession: () => void;
  onLogout: () => void;
}

/**
 * Session timeout warning dialog for admin users
 * Displays countdown and allows extending session or logging out
 */
const SessionTimeoutWarning = ({
  open,
  formattedTime,
  onExtendSession,
  onLogout,
}: SessionTimeoutWarningProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Your session will expire due to inactivity. You will be logged out in{" "}
            <span className="font-mono font-semibold text-foreground">
              {formattedTime}
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Log out now</AlertDialogCancel>
          <AlertDialogAction onClick={onExtendSession}>
            Stay logged in
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning;

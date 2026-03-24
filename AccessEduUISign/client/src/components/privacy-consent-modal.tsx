import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Camera, Shield, Lock, Database, ExternalLink } from "lucide-react";
import { useState } from "react";

type PrivacyConsentModalProps = {
  open: boolean;
  onConsent: (storeMedia: boolean) => void;
  onCancel: () => void;
};

export function PrivacyConsentModal({ open, onConsent, onCancel }: PrivacyConsentModalProps) {
  const [storeMedia, setStoreMedia] = useState(false);

  const handleConsent = () => {
    onConsent(storeMedia);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg" data-testid="modal-privacy-consent">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl">Camera Access Required</DialogTitle>
          <DialogDescription className="text-center">
            AccessEdu needs access to your camera for real-time sign language recognition.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">How we use your data:</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-green-500" aria-hidden="true" />
                </div>
                <span>Video frames are processed locally in your browser using TensorFlow.js</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-3 h-3 text-blue-500" aria-hidden="true" />
                </div>
                <span>Camera stream is never stored or transmitted without your explicit consent</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Database className="w-3 h-3 text-purple-500" aria-hidden="true" />
                </div>
                <span>Recognized text and translations can be saved to your history (optional)</span>
              </li>
            </ul>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border">
            <Checkbox
              id="store-media"
              checked={storeMedia}
              onCheckedChange={(checked) => setStoreMedia(checked === true)}
              data-testid="checkbox-store-media"
            />
            <div className="space-y-1">
              <Label htmlFor="store-media" className="font-medium cursor-pointer">
                Save media thumbnails
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow AccessEdu to save thumbnails of recognized signs for your translation history. You can delete these at any time.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto" data-testid="button-cancel-consent">
            Cancel
          </Button>
          <Button onClick={handleConsent} className="w-full sm:w-auto gap-2" data-testid="button-allow-consent">
            <Camera className="w-4 h-4" aria-hidden="true" />
            Allow and Continue
          </Button>
        </DialogFooter>

        <div className="text-center">
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            Learn more about our privacy policy
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

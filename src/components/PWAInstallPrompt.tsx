import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Only show prompt if not already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the default browser prompt
            e.preventDefault();
            // Store the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            const hasDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
            if (!isStandalone && !hasDismissed) {
                setShowPrompt(true);
            }
        };

        const handleAppInstalled = () => {
            console.log('PWA was installed');
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-300">
                <DialogHeader className="flex flex-col items-center gap-4 py-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center p-4 relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <Download className="w-12 h-12 text-primary relative z-10 animate-bounce" />
                    </div>
                    <DialogTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                        SportsBracket
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg font-medium text-foreground/80">
                        Take your sports management to the next level
                    </DialogDescription>
                    <p className="text-center text-sm text-muted-foreground max-w-[280px]">
                        Install our app for a faster, smoother experience and offline access to your brackets.
                    </p>
                </DialogHeader>

                {isIOS && (
                    <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl text-sm mb-4">
                        <p className="font-semibold text-primary mb-2 flex items-center gap-2">
                            How to install on iOS:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Tap the <span className="font-bold text-foreground">Share</span> button below</li>
                            <li>Scroll down to find <span className="font-bold text-foreground">"Add to Home Screen"</span></li>
                            <li>Tap <span className="font-bold text-foreground">Add</span> in the top right</li>
                        </ol>
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="flex-1 hover:bg-secondary/10 text-muted-foreground font-medium"
                    >
                        Maybe later
                    </Button>
                    {!isIOS && (
                        <Button
                            onClick={handleInstallClick}
                            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold shadow-lg shadow-primary/25 transform active:scale-95 transition-all"
                        >
                            Install Now
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PWAInstallPrompt;

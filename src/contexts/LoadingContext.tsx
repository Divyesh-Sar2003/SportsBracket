import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
    setIsLoading: (loading: boolean) => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card shadow-2xl border animate-in zoom-in-95">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                        </div>
                        <p className="text-lg font-bold tracking-tight text-foreground animate-pulse">
                            SYNCING DATA...
                        </p>
                    </div>
                </div>
            )}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

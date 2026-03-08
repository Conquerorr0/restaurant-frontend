"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface ModalContextType {
    showAlert: (message: string, type?: "info" | "success" | "warning" | "error") => Promise<void>;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error("useModal must be used within a ModalProvider");
    return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: "info" | "success" | "warning" | "error"; resolve: () => void } | null>(null);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; message: string; title: string; resolve: (value: boolean) => void } | null>(null);

    const showAlert = (message: string, type: "info" | "success" | "warning" | "error" = "info"): Promise<void> => {
        return new Promise((resolve) => {
            setAlertState({ isOpen: true, message, type, resolve });
        });
    };

    const showConfirm = (message: string, title: string = "Onay"): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({ isOpen: true, message, title, resolve });
        });
    };

    const closeAlert = () => {
        if (alertState) {
            alertState.resolve();
            setAlertState(null);
        }
    };

    const confirmAction = (value: boolean) => {
        if (confirmState) {
            confirmState.resolve(value);
            setConfirmState(null);
        }
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Alert Modal */}
            {alertState?.isOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
                    <div style={{ width: "90%", maxWidth: "400px", background: "var(--card-alt)", border: "1px solid var(--border)", borderRadius: "24px", padding: "24px", color: "var(--foreground)", display: "flex", flexDirection: "column", gap: "16px", transform: "scale(1)", animation: "modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {alertState.type === "success" && <CheckCircle color="#22c55e" size={28} />}
                            {alertState.type === "error" && <AlertCircle color="#ef4444" size={28} />}
                            {alertState.type === "warning" && <AlertCircle color="#fbbf24" size={28} />}
                            {alertState.type === "info" && <Info color="#3b82f6" size={28} />}
                            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: alertState.type === "warning" ? "#fbbf24" : alertState.type === "error" ? "#ef4444" : alertState.type === "success" ? "#22c55e" : "#3b82f6" }}>
                                {alertState.type === "success" ? "Başarılı" : alertState.type === "error" ? "Hata" : alertState.type === "warning" ? "Uyarı" : "Bilgi"}
                            </h3>
                        </div>
                        <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.5, margin: 0 }}>{alertState.message}</p>
                        <button onClick={closeAlert} style={{ marginTop: "8px", width: "100%", padding: "12px", borderRadius: "12px", background: "var(--border)", border: "none", color: "var(--foreground)", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--border-alt)"} onMouseOut={(e) => e.currentTarget.style.background = "var(--border)"}>Tamam</button>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmState?.isOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
                    <div style={{ width: "90%", maxWidth: "420px", background: "var(--card-alt)", border: "1px solid var(--border)", borderRadius: "24px", padding: "24px", color: "var(--foreground)", display: "flex", flexDirection: "column", gap: "16px", transform: "scale(1)", animation: "modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <AlertCircle color="#fbbf24" size={28} />
                                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#fbbf24" }}>{confirmState.title}</h3>
                            </div>
                            <button onClick={() => confirmAction(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={20} /></button>
                        </div>
                        <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.5, margin: 0 }}>{confirmState.message}</p>
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            <button onClick={() => confirmAction(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "var(--border)", border: "none", color: "var(--foreground)", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--border-alt)"} onMouseOut={(e) => e.currentTarget.style.background = "var(--border)"}>İptal</button>
                            <button onClick={() => confirmAction(true)} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#fbbf24", border: "none", color: "var(--background)", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"} onMouseOut={(e) => e.currentTarget.style.filter = "none"}>Onayla</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </ModalContext.Provider>
    );
};

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ReceiptData {
    restaurantName: string;
    tableName: string;
    waiterName: string;
    dateStr: string;
    timeStr: string;
    items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
    payments: { method: string; amount: number }[];
    total: number;
}

const METHOD_LABELS: Record<string, string> = {
    CASH: "Nakit",
    CREDIT_CARD: "Kart",
    MEAL_CARD: "Yemek Kartı",
};

export default function ReceiptPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("rms_token");
        if (!token || !orderId) { setError(true); return; }

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/print/receipt/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setReceipt(data.data);
                else setError(true);
            })
            .catch(() => setError(true));
    }, [orderId]);

    useEffect(() => {
        if (!receipt) return;
        const timer = setTimeout(() => {
            window.print();
        }, 400);
        window.onafterprint = () => window.close();
        return () => clearTimeout(timer);
    }, [receipt]);

    if (error) {
        return (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace" }}>
                <p>Fiş verisi yüklenemedi!</p>
                <button onClick={() => window.close()} style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}>
                    Kapat
                </button>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace" }}>
                Yükleniyor...
            </div>
        );
    }

    return (
        <>
            <style>{`
                @page {
                    size: 80mm auto;
                    margin: 4mm;
                }
                @media print {
                    html, body { margin: 0; padding: 0; background: #fff; }
                    .no-print { display: none !important; }
                }
                body { background: #f5f5f5; }
            `}</style>

            <div className="no-print" style={{ padding: "12px 16px", background: "#1a1a1a", color: "#fbbf24", fontFamily: "monospace", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Fiş hazır — yazdırma penceresi açılıyor...</span>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#fbbf24", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                        Tekrar Yazdır
                    </button>
                    <button onClick={() => window.close()} style={{ padding: "6px 14px", background: "transparent", color: "#aaa", border: "1px solid #444", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                        Kapat
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "24px", background: "#f5f5f5", minHeight: "calc(100vh - 44px)" }}>
                <div id="receipt" style={{
                    width: "72mm",
                    background: "#fff",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    padding: "4mm 2mm",
                    color: "#000",
                }}>
                    <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                        {receipt.restaurantName}
                    </div>

                    <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "4px 0", margin: "6px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Masa: {receipt.tableName}</span>
                            <span>Garson: {receipt.waiterName}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{receipt.dateStr}</span>
                            <span>{receipt.timeStr}</span>
                        </div>
                    </div>

                    <div style={{ margin: "4px 0" }}>
                        {receipt.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
                                <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                    {item.name}
                                </span>
                                <span style={{ whiteSpace: "nowrap" }}>x{item.quantity}</span>
                                <span style={{ whiteSpace: "nowrap", minWidth: "52px", textAlign: "right" }}>
                                    {item.subtotal.toFixed(2)} TL
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", margin: "6px 0 4px" }}>
                        {receipt.payments.map((p, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{METHOD_LABELS[p.method] || p.method}:</span>
                                <span>{p.amount.toFixed(2)} TL</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                        <span>TOPLAM:</span>
                        <span>{receipt.total.toFixed(2)} TL</span>
                    </div>

                    <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px" }}>
                        <div>Teşekkürler!</div>
                        <div style={{ marginTop: "4px" }}>* * *</div>
                    </div>
                </div>
            </div>
        </>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";

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

const LABELS = {
    tr: {
        table: "Masa", waiter: "Garson", total: "TOPLAM", thanks: "Teşekkürler!",
        loading: "Yükleniyor...", error: "Fiş verisi yüklenemedi.",
        print: "Tekrar Yazdır", close: "Kapat",
        ready: "Fiş hazır — yazdırma penceresi açılıyor...",
    },
    en: {
        table: "Table", waiter: "Waiter", total: "TOTAL", thanks: "Thank you!",
        loading: "Loading...", error: "Receipt data could not be loaded.",
        print: "Print Again", close: "Close",
        ready: "Receipt ready — print dialog opening...",
    },
    ar: {
        table: "الطاولة", waiter: "النادل", total: "المجموع", thanks: "شكراً!",
        loading: "جار التحميل...", error: "تعذر تحميل بيانات الفاتورة.",
        print: "طباعة مجدداً", close: "إغلاق",
        ready: "الفاتورة جاهزة — يتم فتح نافذة الطباعة...",
    },
} as const;

const METHOD_LABELS: Record<string, Record<string, string>> = {
    tr: { CASH: "Nakit", CREDIT_CARD: "Kart", MEAL_CARD: "Yemek Kartı" },
    en: { CASH: "Cash", CREDIT_CARD: "Card", MEAL_CARD: "Meal Card" },
    ar: { CASH: "نقدي", CREDIT_CARD: "بطاقة", MEAL_CARD: "بطاقة وجبات" },
};

export default function ReceiptPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const locale = useLocale();
    const labels = LABELS[locale as keyof typeof LABELS] ?? LABELS.tr;
    const methodLabels = METHOD_LABELS[locale] ?? METHOD_LABELS.tr;
    const dir = locale === "ar" ? "rtl" : "ltr";

    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("rms_token");
        if (!token || !orderId) { setError(true); return; }

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/print/receipt/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Accept-Language": locale,
            },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setReceipt(data.data);
                else setError(true);
            })
            .catch(() => setError(true));
    }, [orderId, locale]);

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
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace" }} dir={dir}>
                <p>{labels.error}</p>
                <button onClick={() => window.close()} style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}>
                    {labels.close}
                </button>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace" }} dir={dir}>
                {labels.loading}
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

            <div className="no-print" style={{ padding: "12px 16px", background: "#1a1a1a", color: "#fbbf24", fontFamily: "monospace", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }} dir={dir}>
                <span>{labels.ready}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#fbbf24", color: "#000", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                        {labels.print}
                    </button>
                    <button onClick={() => window.close()} style={{ padding: "6px 14px", background: "transparent", color: "#aaa", border: "1px solid #444", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                        {labels.close}
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "24px", background: "#f5f5f5", minHeight: "calc(100vh - 44px)" }}>
                <div id="receipt" dir={dir} style={{
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
                            <span>{labels.table}: {receipt.tableName}</span>
                            <span>{labels.waiter}: {receipt.waiterName}</span>
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
                                <span>{methodLabels[p.method] || p.method}:</span>
                                <span>{p.amount.toFixed(2)} TL</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: "1px dashed #000", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                        <span>{labels.total}:</span>
                        <span>{receipt.total.toFixed(2)} TL</span>
                    </div>

                    <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px" }}>
                        <div>{labels.thanks}</div>
                        <div style={{ marginTop: "4px" }}>* * *</div>
                    </div>
                </div>
            </div>
        </>
    );
}

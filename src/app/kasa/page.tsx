"use client";

import React, { useState, useEffect } from "react";
import { Clock, Printer, ArrowRightLeft, X, Check, Search, CreditCard, Banknote, Ban, Gift } from "lucide-react";

type TableStatus = "EMPTY" | "OCCUPIED";

interface Product {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface TableData {
    id: string;
    name: string;
    status: TableStatus;
    totalAmount: number;
    time?: string;
    duration?: string;
    items?: Product[];
    hasNewOrder?: boolean;
}

const mockTables: TableData[] = [
    {
        id: "1",
        name: "A1",
        status: "OCCUPIED",
        totalAmount: 580,
        time: "14:20",
        duration: "45 DK",
        items: [
            { id: "p1", name: "Mercimek Çorbası", quantity: 2, unitPrice: 85, totalPrice: 170 },
            { id: "p2", name: "Adana Kebap", quantity: 1, unitPrice: 340, totalPrice: 340 },
            { id: "p3", name: "Ayran", quantity: 2, unitPrice: 35, totalPrice: 70 },
        ],
    },
    { id: "2", name: "A2", status: "EMPTY", totalAmount: 0 },
    { id: "3", name: "A3", status: "EMPTY", totalAmount: 0 },
    {
        id: "4",
        name: "B1",
        status: "OCCUPIED",
        totalAmount: 1410,
        time: "13:10",
        duration: "1 SA 55 DK",
        items: [
            { id: "p4", name: "Karışık Izgara", quantity: 2, unitPrice: 500, totalPrice: 1000 },
            { id: "p5", name: "Çoban Salata", quantity: 1, unitPrice: 150, totalPrice: 150 },
            { id: "p6", name: "Şalgam", quantity: 4, unitPrice: 40, totalPrice: 160 },
            { id: "p7", name: "Künefe", quantity: 1, unitPrice: 100, totalPrice: 100 },
        ],
    },
    { id: "5", name: "B2", status: "EMPTY", totalAmount: 0 },
    { id: "6", name: "B3", status: "EMPTY", totalAmount: 0 },
    { id: "7", name: "T1", status: "EMPTY", totalAmount: 0 },
    {
        id: "8",
        name: "T2",
        status: "OCCUPIED",
        totalAmount: 1660,
        time: "12:45",
        duration: "2 SA 20 DK",
        hasNewOrder: true,
        items: [
            { id: "p8", name: "Bonfile", quantity: 2, unitPrice: 700, totalPrice: 1400 },
            { id: "p9", name: "Kola", quantity: 2, unitPrice: 60, totalPrice: 120 },
            { id: "p10", name: "Sufle", quantity: 1, unitPrice: 140, totalPrice: 140 },
        ],
    },
];

export default function KasaDashboard() {
    const [tables, setTables] = useState<TableData[]>(mockTables);
    const [selectedTableId, setSelectedTableId] = useState<string | null>("1");
    const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
    const [processingPayment, setProcessingPayment] = useState(false);
    const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });

    const emptyCount = tables.filter(t => t.status === "EMPTY").length;
    const occupiedCount = tables.filter(t => t.status === "OCCUPIED").length;

    const selectedTable = tables.find(t => t.id === selectedTableId);

    const handleTableClick = (id: string) => {
        const t = tables.find(tbl => tbl.id === id);
        if (t && t.status === "OCCUPIED") {
            setSelectedTableId(id);
            setTables(prev => prev.map(tbl => tbl.id === id ? { ...tbl, hasNewOrder: false } : tbl));
        } else {
            setSelectedTableId(null);
        }
    };

    const toggleItemSelection = (itemId: string, maxQty: number) => {
        setSelectedQuantities(prev => {
            const current = prev[itemId] || 0;
            if (current > 0) {
                const next = { ...prev };
                delete next[itemId];
                return next;
            } else {
                return { ...prev, [itemId]: maxQty };
            }
        });
    };

    const updateQuantity = (itemId: string, delta: number, maxQty: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedQuantities(prev => {
            const current = prev[itemId] || 0;
            const next = current + delta;
            if (next <= 0) {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            }
            if (next > maxQty) return prev;
            return { ...prev, [itemId]: next };
        });
    };

    const calculateSelectedTotal = () => {
        if (!selectedTable || !selectedTable.items) return 0;
        return selectedTable.items.reduce((sum, item) => {
            const qty = selectedQuantities[item.id] || 0;
            return sum + (qty * item.unitPrice);
        }, 0);
    };

    const handleFullPayment = async (method: "CASH" | "CREDIT_CARD" | "MEAL_CARD") => {
        if (!selectedTable) return;
        setProcessingPayment(true);
        try {
            // Simulated API call matching the requested post format
            const payload = {
                orderId: selectedTable.id, // using table id as order uuid for mockup
                paymentMethod: method,
                amount: selectedTable.totalAmount,
            };
            console.log("POST /payments", payload);
            await new Promise(res => setTimeout(res, 800)); // Simulate network delay

            // Trigger success popup
            setSuccessPopup({ isOpen: true, message: `Masa ${selectedTable.name} ödemesi başarıyla alındı!` });

            // Auto hide
            setTimeout(() => {
                setSuccessPopup(prev => ({ ...prev, isOpen: false }));
            }, 3000);

            // Update UI: Mark table as empty
            setTables(prev => prev.map(t =>
                t.id === selectedTable.id ? { ...t, status: "EMPTY", totalAmount: 0, items: [] } : t
            ));
            setSelectedTableId(null);

        } catch (error) {
            console.error("Payment failed", error);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handlePartialPayment = async (method: "CASH" | "CREDIT_CARD" | "CANCEL" | "TREAT") => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0) return;
        setProcessingPayment(true);
        const amountToPay = calculateSelectedTotal();

        try {
            // Simulated API call
            const payload = {
                orderId: selectedTable.id,
                paymentMethod: method,
                amount: (method === "CANCEL" || method === "TREAT") ? 0 : amountToPay,
                originalAmount: amountToPay, // To track value of cancelled/treated items
            };
            console.log("POST /payments (Partial)", payload);
            await new Promise(res => setTimeout(res, 800)); // Simulate network delay

            // Update UI
            setTables(prev => prev.map(t => {
                if (t.id === selectedTable.id) {
                    const updatedItems = t.items?.map(item => {
                        const paidQty = selectedQuantities[item.id] || 0;
                        return { ...item, quantity: item.quantity - paidQty, totalPrice: (item.quantity - paidQty) * item.unitPrice };
                    }).filter(item => item.quantity > 0) || [];

                    const remainingAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

                    if (remainingAmount <= 0) {
                        return { ...t, status: "EMPTY", totalAmount: 0, items: [], hasNewOrder: false };
                    }
                    return { ...t, items: updatedItems, totalAmount: remainingAmount };
                }
                return t;
            }));

            setSelectedQuantities({});

            // if zero total left, close selection
            if (selectedTable.totalAmount - amountToPay <= 0) {
                setIsPartialPaymentModalOpen(false);
                setSelectedTableId(null);
            }

        } catch (error) {
            console.error("Payment failed", error);
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <div className="min-h-screen font-sans flex items-center justify-center p-4" style={{ background: "#0d0d0d" }}>

            {/* Main Wrapper matching the desired centered layout */}
            <div style={{
                width: "100%",
                maxWidth: "1100px",
                display: "flex",
                gap: "32px",
                alignItems: "flex-start",
            }}>

                {/* ── Left Side: Table Grid ── */}
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h1 style={{ color: "#fbbf24", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
                            KASA DASHBOARD
                        </h1>
                        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                                <span style={{ color: "#a1a1aa", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>BOŞ: {emptyCount}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                <span style={{ color: "#a1a1aa", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>DOLU: {occupiedCount}</span>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes pulseScale {
                            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                            50% { transform: scale(1.05); box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.4); }
                            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                        }
                    `}</style>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "16px",
                    }}>
                        {tables.map(table => {
                            const isOccupied = table.status === "OCCUPIED";
                            const isSelected = selectedTableId === table.id;

                            return (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableClick(table.id)}
                                    style={{
                                        position: "relative",
                                        aspectRatio: "1/1.05",
                                        borderRadius: "24px",
                                        background: "#18181b", // very dark gray
                                        border: isSelected ? "1.5px solid rgba(251, 191, 36, 0.4)" : "1.5px solid transparent",
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        transition: "all 0.2s ease",
                                        boxShadow: isOccupied ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)" : "none",
                                        animation: table.hasNewOrder ? "pulseScale 1.5s infinite" : "none",
                                    }}
                                >
                                    {/* Small icon for occupied tables in top right */}
                                    {isOccupied && (
                                        <div style={{
                                            position: "absolute",
                                            top: "10px", right: "10px",
                                            width: "20px", height: "20px",
                                            borderRadius: "50%",
                                            background: "#ef4444",
                                            display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                        </div>
                                    )}

                                    {/* Table Name */}
                                    <span style={{
                                        fontSize: "28px",
                                        fontWeight: 800,
                                        color: isOccupied ? "#ef4444" : "#22c55e",
                                    }}>
                                        {table.name}
                                    </span>

                                    {/* Status Label */}
                                    <span style={{
                                        fontSize: "11px",
                                        fontWeight: 800,
                                        letterSpacing: "0.1em",
                                        color: isOccupied ? "#ef4444" : "#22c55e",
                                    }}>
                                        {isOccupied ? "DOLU" : "BOŞ"}
                                    </span>

                                    {/* Amount */}
                                    <span style={{
                                        fontSize: "18px",
                                        fontWeight: 800,
                                        color: "#ffffff",
                                    }}>
                                        {isOccupied ? `₺${table.totalAmount}` : "-"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right Side: Order Info ── */}
                <div style={{
                    width: "420px",
                    flexShrink: 0,
                    background: "transparent"
                }}>
                    {selectedTable ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: "0 0 20px 0", borderBottom: "1px solid #27272a" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h2 style={{ color: "#fbbf24", fontSize: "36px", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                                            MASA {selectedTable.name}
                                        </h2>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "#a1a1aa" }}>
                                            <Clock size={14} />
                                            <span style={{ fontSize: "12px", fontWeight: 600 }}>
                                                {selectedTable.time} ({selectedTable.duration})
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button title="Adisyon Yazdır" style={{
                                            width: "36px", height: "36px",
                                            borderRadius: "10px",
                                            background: "#18181b", // very dark
                                            border: "none",
                                            display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                                            color: "#a1a1aa",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#a1a1aa"}>
                                            <Printer size={16} />
                                        </button>
                                        <button title="Masa Taşı" style={{
                                            width: "36px", height: "36px",
                                            borderRadius: "10px",
                                            background: "#18181b",
                                            border: "none",
                                            display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                                            color: "#a1a1aa",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#a1a1aa"}>
                                            <ArrowRightLeft size={16} />
                                        </button>
                                        <button title="Masa Seçimini Kapat" onClick={() => setSelectedTableId(null)} style={{
                                            width: "36px", height: "36px",
                                            borderRadius: "10px",
                                            background: "rgba(239, 68, 68, 0.1)",
                                            border: "none",
                                            display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                                            color: "#ef4444",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items List */}
                            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "40vh", overflowY: "auto" }}>
                                {selectedTable.items?.map(item => (
                                    <div key={item.id} style={{
                                        background: "#18181b",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <div>
                                            <div style={{ color: "#f4f4f5", fontWeight: 700, fontSize: "15px" }}>{item.name}</div>
                                            <div style={{ color: "#71717a", fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>
                                                X{item.quantity} - ₺{item.unitPrice} / AD.
                                            </div>
                                        </div>
                                        <div style={{ color: "#fbbf24", fontWeight: 900, fontSize: "17px" }}>
                                            ₺{item.totalPrice}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Section */}
                            <div style={{
                                marginTop: "24px",
                                padding: "24px",
                                background: "#18181b",
                                borderRadius: "20px",
                                border: "1px solid #27272a"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                                    <span style={{ color: "#a1a1aa", fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em" }}>GENEL TOPLAM</span>
                                    <span style={{ color: "#fbbf24", fontSize: "36px", fontWeight: 900, lineHeight: 1 }}>₺{selectedTable.totalAmount}</span>
                                </div>

                                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                    <button
                                        onClick={() => handleFullPayment("CASH")}
                                        disabled={processingPayment}
                                        style={{
                                            flex: 1,
                                            padding: "20px 0",
                                            borderRadius: "16px",
                                            background: "#27272a",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                                            opacity: processingPayment ? 0.5 : 1
                                        }}
                                    >
                                        <Banknote size={24} color="#a1a1aa" />
                                        <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>NAKİT</span>
                                    </button>
                                    <button
                                        onClick={() => handleFullPayment("CREDIT_CARD")}
                                        disabled={processingPayment}
                                        style={{
                                            flex: 1,
                                            padding: "20px 0",
                                            borderRadius: "16px",
                                            background: "#27272a",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                                            opacity: processingPayment ? 0.5 : 1
                                        }}
                                    >
                                        <CreditCard size={24} color="#a1a1aa" />
                                        <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>KREDİ KARTI</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedQuantities({});
                                        setIsPartialPaymentModalOpen(true);
                                    }}
                                    disabled={processingPayment}
                                    style={{
                                        width: "100%",
                                        padding: "20px",
                                        borderRadius: "16px",
                                        background: "linear-gradient(135deg, #fde047 0%, #ca8a04 100%)",
                                        border: "none",
                                        color: "#000",
                                        fontSize: "16px",
                                        fontWeight: 800,
                                        letterSpacing: "0.05em",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}
                                >
                                    <span>PARÇALI ÖDEME</span>
                                    <span>{">"}</span>
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {/* ── Modal Overlay for Partial Payment ── */}
            {isPartialPaymentModalOpen && selectedTable && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 50,
                    padding: "20px"
                }}>
                    <div style={{
                        width: "100%",
                        maxWidth: "500px",
                        background: "#111113",
                        border: "1px solid #27272a",
                        borderRadius: "24px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        maxHeight: "90vh"
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: "24px",
                            borderBottom: "1px solid #27272a",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start"
                        }}>
                            <div>
                                <h3 style={{ color: "#fbbf24", fontSize: "24px", fontWeight: 900, margin: 0 }}>
                                    PARÇALI ÖDEME
                                </h3>
                                <p style={{ color: "#a1a1aa", fontSize: "14px", marginTop: "4px" }}>
                                    Ödemesi alınacak ürünleri seçiniz.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPartialPaymentModalOpen(false)}
                                style={{
                                    width: "40px", height: "40px",
                                    borderRadius: "12px",
                                    background: "#18181b",
                                    border: "none",
                                    color: "#a1a1aa",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer"
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items to select */}
                        <div style={{
                            padding: "24px",
                            flex: 1,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}>
                            {selectedTable.items?.map(item => {
                                const selectedQty = selectedQuantities[item.id] || 0;
                                const isSelected = selectedQty > 0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItemSelection(item.id, item.quantity)}
                                        style={{
                                            padding: "16px 20px",
                                            background: "#18181b",
                                            border: "1px solid transparent",
                                            borderRadius: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <div style={{
                                            width: "24px", height: "24px",
                                            borderRadius: "50%",
                                            border: isSelected ? "none" : "2px solid #3f3f46",
                                            background: isSelected ? "#fbbf24" : "transparent",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0
                                        }}>
                                            {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "#f4f4f5", fontWeight: 700, fontSize: "16px" }}>{item.name}</div>
                                            <div style={{ color: "#71717a", fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
                                                X{item.quantity} ADET (Birim: ₺{item.unitPrice})
                                            </div>
                                        </div>

                                        {/* Quantity Selector */}
                                        {isSelected && item.quantity > 1 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "10px" }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => updateQuantity(item.id, -1, item.quantity, e)}
                                                    style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#27272a", border: "none", color: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                                >
                                                    -
                                                </button>
                                                <span style={{ color: "#f4f4f5", fontWeight: 800, fontSize: "16px", minWidth: "20px", textAlign: "center" }}>{selectedQty}</span>
                                                <button
                                                    onClick={(e) => updateQuantity(item.id, 1, item.quantity, e)}
                                                    style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#27272a", border: "none", color: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}

                                        <div style={{ color: "#f4f4f5", fontWeight: 800, fontSize: "18px", width: "80px", textAlign: "right" }}>
                                            ₺{isSelected ? selectedQty * item.unitPrice : item.totalPrice}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: "24px",
                            background: "#18181b",
                            borderTop: "1px solid #27272a",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ color: "#71717a", fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em" }}>
                                    SEÇİLEN TOPLAM
                                </div>
                                <div style={{ color: "#fbbf24", fontSize: "28px", fontWeight: 900 }}>
                                    ₺{calculateSelectedTotal()}
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <button
                                    onClick={() => handlePartialPayment("CASH")}
                                    disabled={Object.keys(selectedQuantities).length === 0 || processingPayment}
                                    style={{
                                        padding: "14px",
                                        background: Object.keys(selectedQuantities).length > 0 ? "#27272a" : "#1f1f22",
                                        color: Object.keys(selectedQuantities).length > 0 ? "#f4f4f5" : "#52525b",
                                        border: Object.keys(selectedQuantities).length > 0 ? "1px solid #3f3f46" : "1px solid transparent",
                                        borderRadius: "12px",
                                        fontSize: "14px", fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        cursor: Object.keys(selectedQuantities).length > 0 ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <Banknote size={18} /> NAKİT
                                </button>
                                <button
                                    onClick={() => handlePartialPayment("CREDIT_CARD")}
                                    disabled={Object.keys(selectedQuantities).length === 0 || processingPayment}
                                    style={{
                                        padding: "14px",
                                        background: Object.keys(selectedQuantities).length > 0 ? "#27272a" : "#1f1f22",
                                        color: Object.keys(selectedQuantities).length > 0 ? "#f4f4f5" : "#52525b",
                                        border: Object.keys(selectedQuantities).length > 0 ? "1px solid #3f3f46" : "1px solid transparent",
                                        borderRadius: "12px",
                                        fontSize: "14px", fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        cursor: Object.keys(selectedQuantities).length > 0 ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <CreditCard size={18} /> KART
                                </button>
                                <button
                                    onClick={() => handlePartialPayment("CANCEL")}
                                    disabled={Object.keys(selectedQuantities).length === 0 || processingPayment}
                                    style={{
                                        padding: "14px",
                                        background: Object.keys(selectedQuantities).length > 0 ? "rgba(239, 68, 68, 0.1)" : "#1f1f22",
                                        color: Object.keys(selectedQuantities).length > 0 ? "#ef4444" : "#52525b",
                                        border: Object.keys(selectedQuantities).length > 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent",
                                        borderRadius: "12px",
                                        fontSize: "14px", fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        cursor: Object.keys(selectedQuantities).length > 0 ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <Ban size={18} /> İPTAL ET
                                </button>
                                <button
                                    onClick={() => handlePartialPayment("TREAT")}
                                    disabled={Object.keys(selectedQuantities).length === 0 || processingPayment}
                                    style={{
                                        padding: "14px",
                                        background: Object.keys(selectedQuantities).length > 0 ? "rgba(34, 197, 94, 0.1)" : "#1f1f22",
                                        color: Object.keys(selectedQuantities).length > 0 ? "#22c55e" : "#52525b",
                                        border: Object.keys(selectedQuantities).length > 0 ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid transparent",
                                        borderRadius: "12px",
                                        fontSize: "14px", fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        cursor: Object.keys(selectedQuantities).length > 0 ? "pointer" : "not-allowed",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <Gift size={18} /> İKRAM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Success Popup ── */}
            {successPopup.isOpen && (
                <div style={{
                    position: "fixed",
                    top: "32px",
                    right: "32px",
                    background: "#22c55e",
                    color: "#000",
                    padding: "16px 24px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)",
                    zIndex: 100,
                    animation: "slideInRight 0.3s ease-out forwards",
                }}>
                    <style>{`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                    <div style={{
                        width: "36px", height: "36px",
                        background: "rgba(0,0,0,0.15)",
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Check size={20} color="#000" strokeWidth={3} />
                    </div>
                    <div>
                        <div style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em" }}>Ödeme Alındı</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.7)", marginTop: "2px" }}>{successPopup.message}</div>
                    </div>
                    <button
                        onClick={() => setSuccessPopup(prev => ({ ...prev, isOpen: false }))}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(0,0,0,0.5)",
                            cursor: "pointer",
                            marginLeft: "12px",
                            padding: "4px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

        </div>
    );
}

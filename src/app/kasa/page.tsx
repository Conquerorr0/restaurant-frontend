"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, Printer, ArrowRightLeft, X, Check, Search, CreditCard, Banknote, Ban, Gift, LogOut, GitMerge } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tableService } from "@/services/tableService";
import { orderService, Order } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";

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
    floor?: string;
    time?: string;
    duration?: string;
    items?: Product[];
    hasNewOrder?: boolean;
}

export default function KasaDashboard() {
    const { token, logout } = useAuth();
    const [tables, setTables] = useState<TableData[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectionMode, setSelectionMode] = useState<"VIEW" | "MOVE" | "MERGE">("VIEW");
    const [selectedFloor, setSelectedFloor] = useState<string>("Tümü");
    const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
    const [processingPayment, setProcessingPayment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });

    const floors = useMemo(() => {
        const floorSet = new Set<string>();
        tables.forEach(t => { if (t.floor) floorSet.add(t.floor); });
        return ["Tümü", ...Array.from(floorSet).sort()];
    }, [tables]);

    const fetchTablesAndDetails = async () => {
        if (!token) return;
        try {
            const tableRes = await tableService.getTables(token);
            if (tableRes.success) {
                const mappedTables: TableData[] = await Promise.all(tableRes.data.map(async (t) => {
                    let items: Product[] = [];
                    let duration = "---";
                    if (t.status === "OCCUPIED") {
                        try {
                            const orderRes = await orderService.getActiveOrder(t.id, token);
                            if (orderRes.success && orderRes.data) {
                                if (t.id === selectedTableId) {
                                    items = orderRes.data.items.map(item => ({
                                        id: item.id,
                                        name: item.product_name,
                                        quantity: item.quantity,
                                        unitPrice: item.unit_price,
                                        totalPrice: item.subtotal
                                    }));
                                }

                                // Calculate duration
                                if (orderRes.data.created_at) {
                                    const start = new Date(orderRes.data.created_at).getTime();
                                    const now = Date.now();
                                    const diffMs = now - start;
                                    const diffMins = Math.floor(diffMs / 60000);
                                    if (diffMins < 60) duration = `${diffMins} dk`;
                                    else duration = `${Math.floor(diffMins / 60)} sa ${diffMins % 60} dk`;
                                }
                            }
                        } catch (e) {
                            console.error("Error fetching order for table", t.id, e);
                        }
                    }
                    return {
                        id: t.id,
                        name: t.name,
                        status: t.status,
                        totalAmount: t.current_remaining_amount,
                        items: items,
                        floor: t.floor,
                        time: "---",
                        duration: duration
                    };
                }));
                setTables(mappedTables);
            }
        } catch (error) {
            console.error("Error loading cashier data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTablesAndDetails();
        const interval = setInterval(fetchTablesAndDetails, 30000);
        return () => clearInterval(interval);
    }, [token, selectedTableId]);

    // Initial table selection update
    useEffect(() => {
        if (selectedTableId && token) {
            const table = tables.find(t => t.id === selectedTableId);
            if (table && table.status === "OCCUPIED" && (!table.items || table.items.length === 0)) {
                fetchTablesAndDetails();
            }
        }
    }, [selectedTableId]);

    const selectedTable = tables.find(t => t.id === selectedTableId);

    const filteredTables = useMemo(() => {
        return selectedFloor === "Tümü"
            ? tables
            : tables.filter(t => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    const fEmptyCount = filteredTables.filter(t => t.status === "EMPTY").length;
    const fOccupiedCount = filteredTables.filter(t => t.status === "OCCUPIED").length;

    const handleTableClick = async (id: string) => {
        const t = tables.find(tbl => tbl.id === id);
        if (!t) return;

        if (selectionMode === "MOVE" && selectedTableId) {
            if (t.status === "OCCUPIED") {
                alert("Hedef masa dolu olamaz!");
                return;
            }
            if (confirm(`${selectedTable?.name} masasını ${t.name} masasına taşımak istediğinize emin misiniz?`)) {
                try {
                    const res = await tableService.moveTable(selectedTableId, id, token!);
                    if (res.success) {
                        setSuccessPopup({ isOpen: true, message: "Masa başarıyla taşındı." });
                        setSelectedTableId(id);
                        setSelectionMode("VIEW");
                        await fetchTablesAndDetails();
                    }
                } catch (e: any) { alert(e.message); }
            }
            return;
        }

        if (selectionMode === "MERGE" && selectedTableId) {
            if (id === selectedTableId) return;
            if (t.status === "EMPTY") {
                alert("Sadece dolu masalar birleştirilebilir!");
                return;
            }
            if (confirm(`${selectedTable?.name} masasını ${t.name} masası ile birleştirmek istediğinize emin misiniz?`)) {
                try {
                    const res = await tableService.mergeTable(selectedTableId, id, token!);
                    if (res.success) {
                        setSuccessPopup({ isOpen: true, message: "Masalar başarıyla birleştirildi." });
                        setSelectedTableId(id);
                        setSelectionMode("VIEW");
                        await fetchTablesAndDetails();
                    }
                } catch (e: any) { alert(e.message); }
            }
            return;
        }

        if (t.status === "OCCUPIED") {
            setSelectedTableId(id);
            setSelectionMode("VIEW");
        } else {
            setSelectedTableId(null);
            setSelectionMode("VIEW");
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

    const handleFullPayment = async (method: "CASH" | "CREDIT_CARD") => {
        if (!selectedTable || !token) return;
        setProcessingPayment(true);
        try {
            const orderRes = await orderService.getActiveOrder(selectedTable.id, token);
            if (!orderRes.success || !orderRes.data) throw new Error("Aktif sipariş bulunamadı.");

            const response = await paymentService.processPayment({
                orderId: orderRes.data.id,
                paymentMethod: method,
                amount: selectedTable.totalAmount
            }, token);

            if (response.success) {
                setSuccessPopup({ isOpen: true, message: `Masa ${selectedTable.name} ödemesi başarıyla alındı!` });
                setTimeout(() => setSuccessPopup(prev => ({ ...prev, isOpen: false })), 3000);
                setSelectedTableId(null);
                await fetchTablesAndDetails();
            }
        } catch (error: any) {
            alert("Ödeme hatası: " + (error.message || "Bilinmeyen hata"));
        } finally {
            setProcessingPayment(false);
        }
    };

    const handlePartialPayment = async (method: "CASH" | "CREDIT_CARD") => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0 || !token) return;
        setProcessingPayment(true);
        const amountToPay = calculateSelectedTotal();

        try {
            const orderRes = await orderService.getActiveOrder(selectedTable.id, token);
            if (!orderRes.success || !orderRes.data) throw new Error("Aktif sipariş bulunamadı.");

            const itemsToPay = Object.keys(selectedQuantities).map(id => ({
                orderItemId: id,
                quantity: selectedQuantities[id]
            }));

            const response = await paymentService.processPayment({
                orderId: orderRes.data.id,
                paymentMethod: method,
                amount: amountToPay,
                items: itemsToPay
            }, token);

            if (response.success) {
                setSelectedQuantities({});
                if (response.data.isFullyPaid) {
                    setIsPartialPaymentModalOpen(false);
                    setSelectedTableId(null);
                    setSuccessPopup({ isOpen: true, message: "Ödeme başarıyla alındı, masa kapatıldı." });
                } else {
                    setSuccessPopup({ isOpen: true, message: "Parçalı ödeme başarıyla kaydedildi." });
                }
                await fetchTablesAndDetails();
            }
        } catch (error: any) {
            alert("Ödeme hatası: " + (error.message || "Bilinmeyen hata"));
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleTreat = async () => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0 || !token) {
            alert("Lütfen ikram edilecek ürünleri adet seçerek işaretleyin!");
            return;
        }
        if (confirm("Seçili ürünleri ikram etmek istediğinize emin misiniz?")) {
            setProcessingPayment(true);
            try {
                for (const itemId of Object.keys(selectedQuantities)) {
                    await orderService.treatItem(itemId, selectedQuantities[itemId], token);
                }
                setSuccessPopup({ isOpen: true, message: "İkram işlemi başarıyla tamamlandı." });
                setSelectedQuantities({});
                setIsPartialPaymentModalOpen(false);
                await fetchTablesAndDetails();
            } catch (error: any) { alert(error.message); } finally { setProcessingPayment(false); }
        }
    };

    const handleCancel = async () => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0 || !token) {
            alert("Lütfen iptal edilecek ürünleri adet seçerek işaretleyin!");
            return;
        }
        if (confirm("Seçili ürünleri iptal etmek istediğinize emin misiniz?")) {
            setProcessingPayment(true);
            try {
                for (const itemId of Object.keys(selectedQuantities)) {
                    await orderService.cancelItem(itemId, selectedQuantities[itemId], token);
                }
                setSuccessPopup({ isOpen: true, message: "İptal işlemi başarıyla tamamlandı." });
                setSelectedQuantities({});
                setIsPartialPaymentModalOpen(false);
                await fetchTablesAndDetails();
            } catch (error: any) { alert(error.message); } finally { setProcessingPayment(false); }
        }
    };

    return (
        <div className="min-h-screen font-sans p-6" style={{ background: "#0d0d0d" }}>
            <div style={{ width: "100%", maxWidth: "1300px", margin: "0 auto", display: "flex", gap: "32px", alignItems: "flex-start" }}>

                {/* ── Left Side: Table Grid ── */}
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <h1 style={{ color: "#fbbf24", fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
                                KASA DASHBOARD
                            </h1>
                            <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px rgba(34,197,94,0.4)" }} />
                                    <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>BOŞ: {fEmptyCount}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px rgba(239,68,68,0.4)" }} />
                                    <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>DOLU: {fOccupiedCount}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            {floors.map(floor => (
                                <button key={floor} onClick={() => setSelectedFloor(floor)} style={{
                                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                    background: selectedFloor === floor ? "#fbbf24" : "transparent",
                                    color: selectedFloor === floor ? "#000" : "#71717a", border: "none"
                                }}>{floor}</button>
                            ))}
                        </div>

                        <button onClick={logout} style={{
                            padding: "10px 16px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "12px",
                            color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 800
                        }}><LogOut size={16} /> ÇIKIŞ</button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
                        {filteredTables.map(table => {
                            const isOccupied = table.status === "OCCUPIED";
                            const isSelected = selectedTableId === table.id;
                            const isTargetForMove = selectionMode === "MOVE" && !isSelected && !isOccupied;
                            const isTargetForMerge = selectionMode === "MERGE" && !isSelected && isOccupied;

                            return (
                                <button key={table.id} onClick={() => handleTableClick(table.id)} style={{
                                    position: "relative", aspectRatio: "1/1.05", borderRadius: "24px", background: "#18181b",
                                    border: isSelected ? "2px solid #fbbf24" : (isTargetForMove || isTargetForMerge ? "2px dashed #fbbf24" : "2px solid transparent"),
                                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
                                    transition: "all 0.2s ease", boxShadow: isOccupied ? "0 4px 10px rgba(0,0,0,0.5)" : "none"
                                }}>
                                    {isOccupied && <div style={{ position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={12} color="#fff" /></div>}
                                    <span style={{ fontSize: "24px", fontWeight: 800, color: isOccupied ? "#ef4444" : "#22c55e" }}>{table.name}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#71717a" }}>{table.duration !== "---" ? table.duration : (isOccupied ? "DOLU" : "BOŞ")}</span>
                                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>{isOccupied ? `₺${table.totalAmount}` : "-"}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right Side: Order Info ── */}
                <div style={{ width: "420px", flexShrink: 0 }}>
                    {selectedTable ? (
                        <>
                            <div style={{ paddingBottom: "20px", borderBottom: "1px solid #27272a" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h2 style={{ color: "#fbbf24", fontSize: "36px", fontWeight: 900, margin: 0 }}>MASA {selectedTable.name}</h2>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: "#a1a1aa" }}>
                                            <Clock size={14} /> <span style={{ fontSize: "12px", fontWeight: 600 }}>{selectedTable.duration} süredir açık</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button title="Masa Birleştir" onClick={() => setSelectionMode(selectionMode === "MERGE" ? "VIEW" : "MERGE")} style={{
                                            width: "40px", height: "40px", borderRadius: "12px", background: selectionMode === "MERGE" ? "#fbbf24" : "#18181b", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: selectionMode === "MERGE" ? "#000" : "#a1a1aa", cursor: "pointer"
                                        }}><GitMerge size={18} /></button>
                                        <button title="Masa Taşı" onClick={() => setSelectionMode(selectionMode === "MOVE" ? "VIEW" : "MOVE")} style={{
                                            width: "40px", height: "40px", borderRadius: "12px", background: selectionMode === "MOVE" ? "#fbbf24" : "#18181b", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: selectionMode === "MOVE" ? "#000" : "#a1a1aa", cursor: "pointer"
                                        }}><ArrowRightLeft size={18} /></button>
                                        <button onClick={() => setSelectedTableId(null)} style={{
                                            width: "40px", height: "40px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", cursor: "pointer"
                                        }}><X size={18} /></button>
                                    </div>
                                </div>
                                {selectionMode !== "VIEW" && (
                                    <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: "8px", color: "#fbbf24", fontSize: "12px", fontWeight: 600 }}>
                                        {selectionMode === "MOVE" ? "Lütfen taşımak istediğiniz BOŞ masayı seçin." : "Lütfen birleştirmek istediğiniz DOLU masayı seçin."}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "40vh", overflowY: "auto" }}>
                                {selectedTable.items?.map(item => (
                                    <div key={item.id} style={{ background: "#18181b", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ color: "#f4f4f5", fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ color: "#71717a", fontSize: "12px" }}>X{item.quantity} - ₺{item.unitPrice} / AD.</div>
                                        </div>
                                        <div style={{ color: "#fbbf24", fontWeight: 900 }}>₺{item.totalPrice}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "24px", padding: "24px", background: "#18181b", borderRadius: "20px", border: "1px solid #27272a" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                    <span style={{ color: "#a1a1aa", fontSize: "12px", fontWeight: 800 }}>TOPLAM</span>
                                    <span style={{ color: "#fbbf24", fontSize: "32px", fontWeight: 900 }}>₺{selectedTable.totalAmount}</span>
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                    <button onClick={() => handleFullPayment("CASH")} disabled={processingPayment} style={{ flex: 1, padding: "16px", borderRadius: "14px", background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}><Banknote size={20} /><span>NAKİT</span></button>
                                    <button onClick={() => handleFullPayment("CREDIT_CARD")} disabled={processingPayment} style={{ flex: 1, padding: "16px", borderRadius: "14px", background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}><CreditCard size={20} /><span>KART</span></button>
                                </div>
                                <button onClick={() => { setSelectedQuantities({}); setIsPartialPaymentModalOpen(true); }} disabled={processingPayment} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #fde047 0%, #ca8a04 100%)", border: "none", color: "#000", fontSize: "15px", fontWeight: 900, cursor: "pointer" }}>PARÇALI ÖDEME / İPTAL / İKRAM</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111113", borderRadius: "32px", border: "2px dashed #27272a", color: "#3f3f46" }}>
                            <Search size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                            <p style={{ fontWeight: 600 }}>Lütfen detayları görmek için bir masa seçin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Partial Payment Modal */}
            {isPartialPaymentModalOpen && selectedTable && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                    <div style={{ width: "100%", maxWidth: "500px", background: "#111113", border: "1px solid #27272a", borderRadius: "28px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                        <div style={{ padding: "24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ color: "#fbbf24", fontSize: "20px", fontWeight: 900 }}>PARÇALI İŞLEMLER</h3>
                            <button onClick={() => setIsPartialPaymentModalOpen(false)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer" }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {selectedTable.items?.map(item => {
                                const selectedQty = selectedQuantities[item.id] || 0;
                                return (
                                    <div key={item.id} onClick={() => toggleItemSelection(item.id, item.quantity)} style={{ padding: "16px", background: "#18181b", borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", border: selectedQty > 0 ? "1px solid #fbbf24" : "1px solid transparent" }}>
                                        <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: selectedQty > 0 ? "none" : "2px solid #3f3f46", background: selectedQty > 0 ? "#fbbf24" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{selectedQty > 0 && <Check size={14} color="#000" strokeWidth={4} />}</div>
                                        <div style={{ flex: 1 }}><div style={{ color: "#fff", fontWeight: 700 }}>{item.name}</div><div style={{ color: "#71717a", fontSize: "12px" }}>X{item.quantity} (Birim: ₺{item.unitPrice})</div></div>
                                        {selectedQty > 0 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => updateQuantity(item.id, -1, item.quantity, e)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#27272a", border: "none", color: "#fff" }}>-</button>
                                                <span style={{ color: "#fff", fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{selectedQty}</span>
                                                <button onClick={(e) => updateQuantity(item.id, 1, item.quantity, e)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#27272a", border: "none", color: "#fff" }}>+</button>
                                            </div>
                                        )}
                                        <div style={{ color: "#fff", fontWeight: 800, minWidth: "60px", textAlign: "right" }}>₺{selectedQty > 0 ? selectedQty * item.unitPrice : item.totalPrice}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ padding: "24px", background: "#18181b", borderTop: "1px solid #27272a", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "#71717a", fontSize: "11px", fontWeight: 800 }}>SEÇİLEN TOPLAM</span><span style={{ color: "#fbbf24", fontSize: "24px", fontWeight: 900 }}>₺{calculateSelectedTotal()}</span></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <button onClick={() => handlePartialPayment("CASH")} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "#27272a", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>NAKİT</button>
                                <button onClick={() => handlePartialPayment("CREDIT_CARD")} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "#27272a", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>KART</button>
                                <button onClick={handleCancel} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>İPTAL ET</button>
                                <button onClick={handleTreat} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>İKRAM ET</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {successPopup.isOpen && (
                <div style={{ position: "fixed", top: "32px", right: "32px", background: "#22c55e", color: "#000", padding: "16px 24px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)", zIndex: 200 }}>
                    <Check size={20} strokeWidth={3} />
                    <div><div style={{ fontSize: "16px", fontWeight: 800 }}>Başarılı</div><div style={{ fontSize: "13px", fontWeight: 600 }}>{successPopup.message}</div></div>
                    <button onClick={() => setSuccessPopup(prev => ({ ...prev, isOpen: false }))} style={{ background: "none", border: "none", opacity: 0.5, cursor: "pointer" }}><X size={18} /></button>
                </div>
            )}
        </div>
    );
}

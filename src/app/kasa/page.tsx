"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Clock, Printer, ArrowRightLeft, X, Check, Search, CreditCard, Banknote, Ban, Gift, LogOut, GitMerge } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { tableService } from "@/services/tableService";
import { orderService, Order } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { socketService } from "@/services/socketService";

const playNotificationSound = (type: 'NEW_ORDER' | 'ADD_ITEM' | 'MOVE_MERGE') => {
    try {
        let url = "";
        switch (type) {
            case 'NEW_ORDER':
                url = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
                break;
            case 'ADD_ITEM':
                url = "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3";
                break;
            case 'MOVE_MERGE':
                url = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";
                break;
        }
        if (url) {
            const audio = new Audio(url);
            audio.play().catch(e => console.log("Audio play failed:", e));
        }
    } catch (e) {
        console.log("Audio error:", e);
    }
};

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
    orderId?: string;
    note?: string;
    hasNewOrder?: boolean;
}

export default function KasaDashboard() {
    const { token, logout } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [tables, setTables] = useState<TableData[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectionMode, setSelectionMode] = useState<"VIEW" | "MOVE" | "MERGE">("VIEW");
    const [selectedFloor, setSelectedFloor] = useState<string>("Tümü");
    const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
    const [processingPayment, setProcessingPayment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: "" });
    const [seenOrderIds, setSeenOrderIds] = useState<string[]>([]);

    useEffect(() => {
        if (!token) return;

        socketService.connect(token);

        const handleNewOrder = (data: any) => {
            console.log("New order received:", data);
            fetchTablesAndDetails();

            // Eğer yeni bir sipariş geldiyse, doğrudan orderId'yi seen tablosundan çıkaralım.
            if (data.orderId) {
                setSeenOrderIds(prev => {
                    if (prev.includes(data.orderId)) {
                        const newSeen = prev.filter(id => id !== data.orderId);
                        localStorage.setItem('seenOrderIds', JSON.stringify(newSeen));
                        return newSeen;
                    }
                    return prev;
                });
            }
        };

        const handleTableUpdate = (data: any) => {
            console.log("Table update received:", data);
            fetchTablesAndDetails();

            // Bazı payloadlarda type gelebiliyor.
            if (data && data.type) {
                if (data.type === 'MOVE' || data.type === 'MERGE') {
                    playNotificationSound('MOVE_MERGE');
                }
            }
        };

        socketService.onNewOrder(handleNewOrder);
        socketService.onTableUpdate(handleTableUpdate);

        return () => {
            socketService.offNewOrder();
            socketService.offTableUpdate();
            socketService.disconnect();
        };
    }, [token]);

    useEffect(() => {
        const saved = localStorage.getItem('seenOrderIds');
        if (saved) {
            try {
                setSeenOrderIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse seenOrderIds from localStorage", e);
                setSeenOrderIds([]);
            }
        }
    }, []);

    const markAsSeen = (orderId: string) => {
        if (!orderId || seenOrderIds.includes(orderId)) return;
        const newSeen = [...seenOrderIds, orderId];
        setSeenOrderIds(newSeen);
        localStorage.setItem('seenOrderIds', JSON.stringify(newSeen));
    };

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
                    let orderId = undefined;
                    let note = undefined;
                    if (t.status === "OCCUPIED") {
                        try {
                            const orderRes = await orderService.getActiveOrder(t.id, token);
                            if (orderRes.success && orderRes.data) {
                                orderId = orderRes.data.id;
                                note = orderRes.data.note;
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
                        duration: duration,
                        orderId,
                        note
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
        const interval = setInterval(fetchTablesAndDetails, 60000);
        return () => clearInterval(interval);
    }, [token, selectedTableId, seenOrderIds]); // Added seenOrderIds to dependencies to re-evaluate unread status

    const prevTablesRef = useRef<TableData[]>([]);

    useEffect(() => {
        if (tables.length > 0 && prevTablesRef.current.length > 0) {
            tables.forEach(table => {
                const prevTable = prevTablesRef.current.find(t => t.id === table.id);
                // Eğer masa önceden boştu şimdi doluysa, taze bir "Yeni Sipariş" demektir.
                if (prevTable && prevTable.status === "EMPTY" && table.status === "OCCUPIED") {
                    playNotificationSound('NEW_ORDER');
                }
                // Eğer masa doluysa ve total amount (hesap) artmışsa ek ürün eklenmiştir!
                else if (prevTable && prevTable.status === "OCCUPIED" && table.status === "OCCUPIED") {
                    if (table.totalAmount > prevTable.totalAmount) {
                        playNotificationSound('ADD_ITEM');
                        if (table.orderId) {
                            setSeenOrderIds(prev => {
                                if (!prev.includes(table.orderId as string)) return prev;
                                const newSeen = prev.filter(id => id !== table.orderId);
                                localStorage.setItem('seenOrderIds', JSON.stringify(newSeen));
                                return newSeen;
                            });
                        }
                    }
                }
            });
        }
        prevTablesRef.current = tables;
    }, [tables]);

    // Initial table selection update
    useEffect(() => {
        if (selectedTableId && token) {
            const table = tables.find(t => t.id === selectedTableId);
            if (table && table.status === "OCCUPIED" && (!table.items || table.items.length === 0)) {
                fetchTablesAndDetails();
            }
        }
    }, [selectedTableId, tables, token]); // Added tables to dependencies

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

        if (t.orderId) markAsSeen(t.orderId);

        if (selectionMode === "MOVE" && selectedTableId) {
            if (t.status === "OCCUPIED") {
                await showAlert("Hedef masa dolu olamaz!", "warning");
                return;
            }
            if (await showConfirm(`${selectedTable?.name} masasını ${t.name} masasına taşımak istediğinize emin misiniz?`)) {
                try {
                    const res = await tableService.moveTable(selectedTableId, id, token!);
                    if (res.success) {
                        setSuccessPopup({ isOpen: true, message: "Masa başarıyla taşındı." });
                        setSelectedTableId(id);
                        setSelectionMode("VIEW");
                        await fetchTablesAndDetails();
                    }
                } catch (e: any) { await showAlert(e.message, "error"); }
            }
            return;
        }

        if (selectionMode === "MERGE" && selectedTableId) {
            if (id === selectedTableId) return;
            if (t.status === "EMPTY") {
                await showAlert("Sadece dolu masalar birleştirilebilir!", "warning");
                return;
            }
            if (await showConfirm(`${selectedTable?.name} masasını ${t.name} masası ile birleştirmek istediğinize emin misiniz?`)) {
                try {
                    const res = await tableService.mergeTable(selectedTableId, id, token!);
                    if (res.success) {
                        setSuccessPopup({ isOpen: true, message: "Masalar başarıyla birleştirildi." });
                        setSelectedTableId(id);
                        setSelectionMode("VIEW");
                        await fetchTablesAndDetails();
                    }
                } catch (e: any) { await showAlert(e.message, "error"); }
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

            const fullAmount = Number(orderRes.data.total_amount);
            const allItems = orderRes.data.items.map((item: any) => ({
                orderItemId: item.id,
                quantity: item.quantity
            }));

            const response = await paymentService.processPayment({
                orderId: orderRes.data.id,
                paymentMethod: method,
                amount: fullAmount,
                items: allItems
            }, token);

            if (response.success) {
                setSuccessPopup({ isOpen: true, message: `Masa ${selectedTable.name} ödemesi başarıyla alındı!` });
                setTimeout(() => setSuccessPopup(prev => ({ ...prev, isOpen: false })), 3000);
                setSelectedTableId(null);
                await fetchTablesAndDetails();
            }
        } catch (error: any) {
            await showAlert("Ödeme hatası: " + (error.message || "Bilinmeyen hata"), "error");
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
            await showAlert("Ödeme hatası: " + (error.message || "Bilinmeyen hata"), "error");
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleTreat = async () => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0 || !token) {
            await showAlert("Lütfen ikram edilecek ürünleri adet seçerek işaretleyin!", "warning");
            return;
        }
        if (await showConfirm("Seçili ürünleri ikram etmek istediğinize emin misiniz?")) {
            setProcessingPayment(true);
            try {
                let orderClosed = false;
                for (const itemId of Object.keys(selectedQuantities)) {
                    const res = await orderService.treatItem(itemId, selectedQuantities[itemId], token);
                    if (res.success && res.data && res.data.balance <= 0.01) {
                        orderClosed = true;
                    }
                }

                await fetchTablesAndDetails();
                setSelectedQuantities({});

                if (orderClosed) {
                    setIsPartialPaymentModalOpen(false);
                    setSelectedTableId(null);
                    setSuccessPopup({ isOpen: true, message: "İkramlar sonrası masa hesabı kapandı." });
                } else {
                    setSuccessPopup({ isOpen: true, message: "İkram işlemi başarıyla tamamlandı." });
                }

                setTimeout(() => setSuccessPopup(prev => ({ ...prev, isOpen: false })), 3000);
            } catch (error: any) {
                await showAlert(error.message, "error");
            } finally {
                setProcessingPayment(false);
            }
        }
    };

    const handleCancel = async () => {
        if (!selectedTable || Object.keys(selectedQuantities).length === 0 || !token) {
            await showAlert("Lütfen iptal edilecek ürünleri adet seçerek işaretleyin!", "warning");
            return;
        }
        if (await showConfirm("Seçili ürünleri iptal etmek istediğinize emin misiniz?")) {
            setProcessingPayment(true);
            try {
                let orderClosed = false;
                for (const itemId of Object.keys(selectedQuantities)) {
                    const res = await orderService.cancelItem(itemId, selectedQuantities[itemId], token);
                    if (res.success && res.data && res.data.balance <= 0.01) {
                        orderClosed = true;
                    }
                }

                await fetchTablesAndDetails();
                setSelectedQuantities({});

                if (orderClosed) {
                    setIsPartialPaymentModalOpen(false);
                    setSelectedTableId(null);
                    setSuccessPopup({ isOpen: true, message: "İptaller sonrası masa hesabı kapandı." });
                } else {
                    setSuccessPopup({ isOpen: true, message: "İptal işlemi başarıyla tamamlandı." });
                }

                setTimeout(() => setSuccessPopup(prev => ({ ...prev, isOpen: false })), 3000);
            } catch (error: any) {
                await showAlert(error.message, "error");
            } finally {
                setProcessingPayment(false);
            }
        }
    };

    return (
        <div className="min-h-screen font-sans p-6" style={{ background: "var(--background)" }}>
            <style>{`
                @keyframes pulse-gold {
                    0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); transform: scale(1); }
                    50% { box-shadow: 0 0 20px 10px rgba(251, 191, 36, 0.1); transform: scale(1.02); }
                    100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); transform: scale(1); }
                }
                @keyframes spin { 
                    0% { transform: rotate(0deg); } 
                    100% { transform: rotate(360deg); } 
                }
                .pulse-new-order {
                    animation: pulse-gold 2s infinite ease-in-out;
                    border: 2px solid #fbbf24 !important;
                }
                .spinner-anim {
                    animation: spin 1s linear infinite;
                }
            `}</style>
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
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--table-text-empty)", boxShadow: "0 0 10px rgba(34,197,94,0.4)" }} />
                                    <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>BOŞ: {fEmptyCount}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--table-text-occupied)", boxShadow: "0 0 10px rgba(239,68,68,0.4)" }} />
                                    <span style={{ color: "var(--muted)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>DOLU: {fOccupiedCount}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            {floors.map(floor => (
                                <button key={floor} onClick={() => setSelectedFloor(floor)} style={{
                                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                    background: selectedFloor === floor ? "#fbbf24" : "transparent",
                                    color: selectedFloor === floor ? "var(--background)" : "var(--muted)", border: "none"
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
                            const isUnread = isOccupied && table.orderId && !seenOrderIds.includes(table.orderId);

                            return (
                                <div key={table.id} onClick={() => handleTableClick(table.id)} className={isUnread ? "pulse-new-order" : ""} style={{
                                    padding: "24px",
                                    background: isSelected ? "linear-gradient(135deg, #fde047 0%, #ca8a04 100%)" : (isTargetForMove || isTargetForMerge) ? "rgba(251, 191, 36, 0.1)" : (isOccupied ? "var(--table-occupied-bg)" : "var(--table-empty-bg)"),
                                    border: isSelected ? "none" : (isTargetForMove || isTargetForMerge) ? "2px dashed #fbbf24" : "1px solid var(--border)",
                                    borderRadius: "32px", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", textAlign: "center", position: "relative",
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", aspectRatio: "1/1.05"
                                }}>
                                    {isOccupied && <div style={{ position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", borderRadius: "50%", background: isSelected ? "var(--background)" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={12} color={isSelected ? "var(--accent)" : "var(--foreground)"} /></div>}
                                    <span style={{ fontSize: "24px", fontWeight: 800, color: isSelected ? "var(--table-text-selected)" : (isOccupied ? "var(--table-text-occupied)" : "var(--table-text-empty)") }}>{table.name}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 800, color: isSelected ? "var(--table-text-selected)" : "var(--muted)", opacity: isSelected ? 0.7 : 1 }}>{table.duration !== "---" ? table.duration : (isOccupied ? "DOLU" : "BOŞ")}</span>
                                    <span style={{ fontSize: "16px", fontWeight: 800, color: isSelected ? "var(--table-text-selected)" : (isOccupied ? "var(--table-amount)" : "var(--foreground)") }}>{isOccupied ? `₺${table.totalAmount}` : "-"}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right Side: Order Info ── */}
                <div style={{ width: "420px", flexShrink: 0, marginTop: "40px" }}>
                    {selectedTable ? (
                        <>
                            <div style={{ paddingBottom: "20px", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h2 style={{ color: "#fbbf24", fontSize: "36px", fontWeight: 900, margin: 0 }}>MASA {selectedTable.name}</h2>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: "var(--muted)" }}>
                                            <Clock size={14} /> <span style={{ fontSize: "12px", fontWeight: 600 }}>{selectedTable.duration} süredir açık</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button title="Masa Birleştir" onClick={() => setSelectionMode(selectionMode === "MERGE" ? "VIEW" : "MERGE")} style={{
                                            width: "40px", height: "40px", borderRadius: "12px", background: selectionMode === "MERGE" ? "#fbbf24" : "var(--card)", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: selectionMode === "MERGE" ? "var(--background)" : "var(--muted)", cursor: "pointer"
                                        }}><GitMerge size={18} /></button>
                                        <button title="Masa Taşı" onClick={() => setSelectionMode(selectionMode === "MOVE" ? "VIEW" : "MOVE")} style={{
                                            width: "40px", height: "40px", borderRadius: "12px", background: selectionMode === "MOVE" ? "#fbbf24" : "var(--card)", border: "none",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: selectionMode === "MOVE" ? "var(--background)" : "var(--muted)", cursor: "pointer"
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
                                    <div key={item.id} style={{ background: "var(--card)", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ color: "var(--foreground)", fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 600 }}>X{item.quantity} - ₺{item.unitPrice} / AD.</div>
                                        </div>
                                        <div style={{ color: "#fbbf24", fontWeight: 900 }}>₺{item.totalPrice}</div>
                                    </div>
                                ))}
                                {selectedTable.note && (
                                    <div style={{ marginTop: "12px", padding: "12px", background: "rgba(251, 191, 36, 0.05)", border: "1px dashed rgba(251, 191, 36, 0.3)", borderRadius: "12px" }}>
                                        <div style={{ fontSize: "10px", color: "#fbbf24", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "4px" }}>GARSON NOTU</div>
                                        <div style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.4" }}>{selectedTable.note}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "24px", padding: "24px", background: "var(--card)", borderRadius: "20px", border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                    <span style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 800 }}>TOPLAM</span>
                                    <span style={{ color: "#fbbf24", fontSize: "32px", fontWeight: 900 }}>₺{selectedTable.totalAmount}</span>
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                    <button onClick={() => handleFullPayment("CASH")} disabled={processingPayment} style={{ flex: 1, padding: "16px", borderRadius: "14px", background: "var(--border)", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}><Banknote size={20} /><span>NAKİT</span></button>
                                    <button onClick={() => handleFullPayment("CREDIT_CARD")} disabled={processingPayment} style={{ flex: 1, padding: "16px", borderRadius: "14px", background: "var(--border)", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}><CreditCard size={20} /><span>KART</span></button>
                                </div>
                                <button onClick={() => { setSelectedQuantities({}); setIsPartialPaymentModalOpen(true); }} disabled={processingPayment} style={{ width: "100%", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #fde047 0%, #ca8a04 100%)", border: "none", color: "var(--background)", fontSize: "15px", fontWeight: 900, cursor: "pointer" }}>PARÇALI ÖDEME / İPTAL / İKRAM</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--card-alt)", borderRadius: "32px", border: "2px dashed var(--border)", color: "var(--border-alt)" }}>
                            <Search size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                            <p style={{ fontWeight: 600 }}>Lütfen detayları görmek için bir masa seçin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Partial Payment Modal */}
            {isPartialPaymentModalOpen && selectedTable && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                    <div style={{ width: "100%", maxWidth: "500px", background: "var(--card-alt)", border: "1px solid var(--border)", borderRadius: "28px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                        <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ color: "#fbbf24", fontSize: "20px", fontWeight: 900 }}>PARÇALI İŞLEMLER</h3>
                            <button onClick={() => setIsPartialPaymentModalOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {selectedTable.items?.map(item => {
                                const selectedQty = selectedQuantities[item.id] || 0;
                                return (
                                    <div key={item.id} onClick={() => toggleItemSelection(item.id, item.quantity)} style={{ padding: "16px", background: "var(--card)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", border: selectedQty > 0 ? "1px solid #fbbf24" : "1px solid transparent" }}>
                                        <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: selectedQty > 0 ? "none" : "2px solid var(--border-alt)", background: selectedQty > 0 ? "#fbbf24" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{selectedQty > 0 && <Check size={14} color="var(--background)" strokeWidth={4} />}</div>
                                        <div style={{ flex: 1 }}><div style={{ color: "var(--foreground)", fontWeight: 700 }}>{item.name}</div><div style={{ color: "var(--muted)", fontSize: "12px" }}>X{item.quantity} (Birim: ₺{item.unitPrice})</div></div>
                                        {selectedQty > 0 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => updateQuantity(item.id, -1, item.quantity, e)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--border)", border: "none", color: "var(--foreground)" }}>-</button>
                                                <span style={{ color: "var(--foreground)", fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{selectedQty}</span>
                                                <button onClick={(e) => updateQuantity(item.id, 1, item.quantity, e)} style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--border)", border: "none", color: "var(--foreground)" }}>+</button>
                                            </div>
                                        )}
                                        <div style={{ color: "var(--foreground)", fontWeight: 800, minWidth: "60px", textAlign: "right" }}>₺{selectedQty > 0 ? selectedQty * item.unitPrice : item.totalPrice}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ padding: "24px", background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "var(--muted)", fontSize: "11px", fontWeight: 800 }}>SEÇİLEN TOPLAM</span><span style={{ color: "#fbbf24", fontSize: "24px", fontWeight: 900 }}>₺{calculateSelectedTotal()}</span></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <button onClick={() => handlePartialPayment("CASH")} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "var(--border)", color: "var(--foreground)", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>NAKİT</button>
                                <button onClick={() => handlePartialPayment("CREDIT_CARD")} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "var(--border)", color: "var(--foreground)", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>KART</button>
                                <button onClick={handleCancel} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>İPTAL ET</button>
                                <button onClick={handleTreat} disabled={Object.keys(selectedQuantities).length === 0} style={{ padding: "12px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>İKRAM ET</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Processing Overlay */}
            {processingPayment && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                    <div className="spinner-anim" style={{ width: "60px", height: "60px", border: "4px solid var(--border-alt)", borderTopColor: "#fbbf24", borderRadius: "50%" }} />
                    <h2 style={{ marginTop: "24px", color: "#fbbf24", fontSize: "24px", fontWeight: 800, letterSpacing: "1px" }}>Ödeme İşleniyor...</h2>
                    <p style={{ marginTop: "8px", color: "var(--muted)", fontSize: "14px" }}>Lütfen bekleyiniz, işlem tamamlanıyor</p>
                </div>
            )}

            {/* Success Popup */}
            {successPopup.isOpen && (
                <div style={{ position: "fixed", top: "32px", right: "32px", background: "#22c55e", color: "var(--background)", padding: "16px 24px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)", zIndex: 200 }}>
                    <Check size={20} strokeWidth={3} />
                    <div><div style={{ fontSize: "16px", fontWeight: 800 }}>Başarılı</div><div style={{ fontSize: "13px", fontWeight: 600 }}>{successPopup.message}</div></div>
                    <button onClick={() => setSuccessPopup(prev => ({ ...prev, isOpen: false }))} style={{ background: "none", border: "none", opacity: 0.5, cursor: "pointer" }}><X size={18} /></button>
                </div>
            )}
        </div>
    );
}

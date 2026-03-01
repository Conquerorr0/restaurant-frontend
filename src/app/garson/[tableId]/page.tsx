"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, Search, ShoppingBag, CheckCircle2, ChevronRight, UtensilsCrossed } from "lucide-react";

// Types
interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface Order {
    id: string;
    table_id: string;
    status: string;
    total_amount: number;
    items: OrderItem[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
}

interface Category {
    id: string;
    name: string;
    products: Product[];
}

// Mock Data APIs
const fetchCategoriesWithProductsMock = async (): Promise<Category[]> => {
    return [
        {
            id: "cat-1",
            name: "BAŞLANGIÇLAR",
            products: [
                { id: "p-1", name: "Mercimek Çorbası", price: 85 },
                { id: "p-2", name: "Paçanga Böreği", price: 120 },
                { id: "p-3", name: "İçli Köfte", price: 90 },
            ]
        },
        {
            id: "cat-2",
            name: "ANA YEMEKLER",
            products: [
                { id: "p-4", name: "Adana Kebap", price: 200 },
                { id: "p-5", name: "Izgara Köfte", price: 250 },
                { id: "p-6", name: "Tavuk Şiş", price: 210 },
            ]
        },
        {
            id: "cat-3",
            name: "İÇECEKLER",
            products: [
                { id: "p-7", name: "Kutu Kola", price: 40 },
                { id: "p-8", name: "Ayran", price: 30 },
                { id: "p-9", name: "Su", price: 15 },
            ]
        },
        {
            id: "cat-4",
            name: "TATLILAR",
            products: [
                { id: "p-10", name: "Sütlaç", price: 85 },
                { id: "p-11", name: "Künefe", price: 150 },
                { id: "p-12", name: "Katmer", price: 180 },
            ]
        }
    ];
};

const fetchOrderMock = async (tableId: string): Promise<Order | null> => {
    if (tableId === "1" || tableId === "4" || tableId === "7") { // simulating OCCUPIED tables
        return {
            id: "order-" + tableId,
            table_id: tableId,
            status: "OPEN",
            total_amount: 580,
            items: [
                { id: "item-1", product_name: "Adana Kebap", quantity: 2, unit_price: 200, subtotal: 400 },
                { id: "item-2", product_name: "Mercimek Çorbası", quantity: 2, unit_price: 85, subtotal: 170 },
            ]
        };
    }
    return null;
}

export default function OrderPage({ params }: { params: Promise<{ tableId: string }> | { tableId: string } }) {
    const router = useRouter();

    // Unwrap params depending on React version (Next 15 requires awaiting params, but older works without, so we do both gracefully if possible or use React.use)
    const resolvedParams = "then" in params ? use(params as any) : params;
    const tableId = (resolvedParams as any).tableId;

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");

    const [order, setOrder] = useState<Order | null>(null);
    const [localCart, setLocalCart] = useState<{ product: Product, quantity: number }[]>([]);

    useEffect(() => {
        const init = async () => {
            const cats = await fetchCategoriesWithProductsMock();
            setCategories(cats);
            if (cats.length > 0) setActiveCategoryId(cats[0].id);

            const existingOrder = await fetchOrderMock(tableId);
            if (existingOrder) {
                setOrder(existingOrder);
            }
            setLoading(false);
        };
        init();
    }, [tableId]);

    const handleAddToCart = (product: Product) => {
        setLocalCart((prev) => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const handleRemoveFromCart = (productId: string) => {
        setLocalCart((prev) => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter(item => item.quantity > 0));
    };

    const getProductQuantity = (productId: string) => {
        return localCart.find(item => item.product.id === productId)?.quantity || 0;
    };

    const calculateLocalTotal = () => {
        return localCart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    };

    const currentCategory = categories.find(c => c.id === activeCategoryId);
    const cartTotalItems = localCart.reduce((acc, i) => acc + i.quantity, 0);
    const grandTotal = (order?.total_amount || 0) + calculateLocalTotal();

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex flex-col font-sans text-gray-200">

            {/* Header Panel */}
            <div className="bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/5 px-4 pt-3 pb-5 sm:p-5 sticky top-0 z-20 shadow-sm flex flex-col gap-4">

                {/* Top Navbar */}
                <div className="flex items-center justify-between">

                    <button
                        onClick={() => router.back()}
                        className="p-2 sm:p-3 bg-[#1c1c1c] border border-white/5 rounded-xl sm:rounded-2xl hover:bg-[#252525] active:scale-95 transition-all shadow-sm text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <div className="flex bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold tracking-widest items-center gap-2 shadow-inner text-sm sm:text-base">
                        <UtensilsCrossed size={18} />
                        MASA {tableId}
                    </div>

                    <button className="p-2 sm:p-3 bg-[#1c1c1c] border border-white/5 rounded-xl sm:rounded-2xl hover:bg-[#252525] active:scale-95 transition-all shadow-sm text-gray-400 hover:text-white">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                </div>

                {/* Current Order Status Banner */}
                <div className="bg-[#1c1c1c] p-4 sm:p-5 rounded-3xl border border-white/5 flex justify-between items-center shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#eab308]/5 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="z-10">
                        <h2 className="text-gray-500 text-[10px] sm:text-xs font-medium tracking-widest uppercase mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-pulse" />
                            GÜNCEL TOPLAM
                        </h2>
                        <div className="text-2xl sm:text-3xl font-bold text-[#eab308]">
                            ₺{grandTotal.toLocaleString("tr-TR")}
                        </div>
                    </div>
                    <div className="text-right z-10 flex flex-col items-end">
                        <div className={`text-xs sm:text-sm font-bold tracking-wider px-2 sm:px-3 py-1 rounded-lg inline-flex mb-2 shadow-inner border ${order ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                            {order ? "Açık Sipariş" : "Yeni Sipariş"}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                            {cartTotalItems > 0 ? "Sepette bekleyen ürünler var" : "Siparişe başlamak için ekle"}
                        </div>
                    </div>
                </div>

            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eab308]"></div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pb-40">

                    {/* Categories Horizontal Scroll */}
                    <div className="overflow-x-auto hide-scrollbar border-b border-white/5 bg-[#0d0d0d]/95 backdrop-blur-md sticky top-[180px] sm:top-[200px] z-10 pt-2 pb-3">
                        <div className="flex px-4 sm:px-5 gap-2.5 sm:gap-3 w-max">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold tracking-wider whitespace-nowrap transition-all duration-300 text-xs sm:text-sm shadow-sm ${activeCategoryId === cat.id
                                            ? "bg-[#eab308] text-black shadow-lg shadow-yellow-500/20"
                                            : "bg-[#1c1c1c] border border-white/5 text-gray-400 hover:text-white"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
                        {currentCategory?.products.map((product) => {
                            const quantity = getProductQuantity(product.id);
                            const isSelected = quantity > 0;

                            return (
                                <div
                                    key={product.id}
                                    className={`p-3 sm:p-4 rounded-3xl flex items-center justify-between transition-all duration-300 border ${isSelected
                                            ? "bg-[#eab308]/5 border-[#eab308]/30 shadow-inner"
                                            : "bg-[#1c1c1c] border-white/5 hover:bg-[#252525]"
                                        }`}
                                >
                                    {/* Product Info */}
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl shadow-inner transition-colors duration-300 ${isSelected ? "bg-[#eab308] text-black shadow-[#eab308]/20" : "bg-[#121212] text-[#eab308]/70 border border-white/5"
                                            }`}>
                                            {product.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-200 text-sm sm:text-[17px] leading-tight tracking-wide">{product.name}</h3>
                                            <p className="text-[#eab308] font-bold mt-1 sm:mt-1.5 text-xs sm:text-[15px]">₺{product.price}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {isSelected ? (
                                            <div className="flex items-center gap-2 sm:gap-3 bg-[#121212] px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-2xl border border-[#eab308]/20 shadow-inner">
                                                <button
                                                    onClick={() => handleRemoveFromCart(product.id)}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#1c1c1c] hover:bg-[#252525] rounded-xl text-white transition-all active:scale-95 border border-white/5"
                                                >
                                                    <Minus size={16} strokeWidth={2.5} />
                                                </button>
                                                <span className="font-bold w-4 sm:w-6 text-center text-sm sm:text-lg">{quantity}</span>
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#eab308] hover:bg-[#dca500] rounded-xl text-black transition-all active:scale-95 shadow-sm"
                                                >
                                                    <Plus size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[#121212] hover:bg-[#eab308] hover:text-black text-gray-400 rounded-2xl transition-all duration-300 border border-white/5 active:scale-95"
                                            >
                                                <Plus size={20} strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Existing Order Items Display */}
                    {order && order.items.length > 0 && (
                        <div className="px-4 sm:px-5 pb-8 mt-2 sm:mt-4 pt-5 sm:pt-6 border-t border-white/10">
                            <h3 className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4 px-1 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                Mevcut Siparişteki Ürünler
                            </h3>
                            <div className="flex flex-col gap-2 sm:gap-3">
                                {order.items.map(item => (
                                    <div key={item.id} className="bg-[#1c1c1c] border border-white/5 p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="bg-[#121212] text-gray-300 font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm border border-white/5 shadow-inner">
                                                {item.quantity}x
                                            </div>
                                            <span className="text-gray-300 font-medium tracking-wide text-xs sm:text-[15px]">{item.product_name}</span>
                                        </div>
                                        <span className="text-[#eab308] font-bold text-xs sm:text-sm">₺{item.subtotal}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Floating Action Button (Siparişi Tamamla) */}
            {cartTotalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/90 to-transparent pt-16 sm:pt-20 z-30">
                    <button
                        className="w-full bg-[#eab308] text-black p-4 sm:p-5 rounded-3xl font-bold text-base sm:text-lg shadow-[0_8px_30px_rgba(234,179,8,0.25)] hover:bg-[#dca500] active:scale-[0.98] transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-black/10 p-2 sm:p-2.5 rounded-2xl shadow-inner">
                                <ShoppingBag size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                            <span className="tracking-widest">SİPARİŞİ ONAYLA</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="bg-black/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-black/5 shadow-inner">
                                {cartTotalItems} Ürün
                            </span>
                            <ChevronRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

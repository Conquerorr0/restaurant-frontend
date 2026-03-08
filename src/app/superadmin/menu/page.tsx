"use client";

import React, { useState } from "react";
import { Search, Pencil, Trash2, Package, Layers, X } from "lucide-react";

// Mock Data
const MOCK_CATEGORIES = [
    { id: "1", name: "Başlangıçlar", productCount: 2 },
    { id: "2", name: "Ana Yemekler", productCount: 2 },
    { id: "3", name: "Tatlılar", productCount: 2 },
    { id: "4", name: "İçecekler", productCount: 2 },
];

const MOCK_PRODUCTS = [
    { id: "1", name: "Mercimek Çorbası", category: "BAŞLANGIÇLAR", categoryId: "1", price: 85, initial: "M" },
    { id: "2", name: "Paçanga Böreği", category: "BAŞLANGIÇLAR", categoryId: "1", price: 120, initial: "P" },
    { id: "3", name: "Adana Kebap", category: "ANA YEMEKLER", categoryId: "2", price: 340, initial: "A" },
    { id: "4", name: "Kuzu Şiş", category: "ANA YEMEKLER", categoryId: "2", price: 420, initial: "K" },
    { id: "5", name: "Sütlaç", category: "TATLILAR", categoryId: "3", price: 85, initial: "S" },
    { id: "6", name: "Künefe", category: "TATLILAR", categoryId: "3", price: 150, initial: "K" },
    { id: "7", name: "Ayran", category: "İÇECEKLER", categoryId: "4", price: 35, initial: "A" },
    { id: "8", name: "Kola", category: "İÇECEKLER", categoryId: "4", price: 50, initial: "K" },
];

type Product = typeof MOCK_PRODUCTS[number];
type Category = typeof MOCK_CATEGORIES[number];

export default function MenuManagement() {
    const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
    const [searchTerm, setSearchTerm] = useState("");

    // Product form state
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productName, setProductName] = useState("");
    const [productCategoryId, setProductCategoryId] = useState("");
    const [productPrice, setProductPrice] = useState("");

    // Category form state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState("");

    const filteredProducts = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductName(product.name);
        setProductCategoryId(product.categoryId);
        setProductPrice(String(product.price));
        setActiveTab("products");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelProductEdit = () => {
        setEditingProduct(null);
        setProductName("");
        setProductCategoryId("");
        setProductPrice("");
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setActiveTab("categories");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelCategoryEdit = () => {
        setEditingCategory(null);
        setCategoryName("");
    };

    const handleTabChange = (tab: "products" | "categories") => {
        setActiveTab(tab);
        if (tab === "products") {
            handleCancelCategoryEdit();
        } else {
            handleCancelProductEdit();
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md">
                        MENÜ YÖNETİMİ
                    </h1>
                    <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                        Kategori ve ürünlerinizi yönetin
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#1c1c1c] p-1.5 rounded-[16px] shadow-sm">
                    <button
                        onClick={() => handleTabChange("products")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] tracking-wide transition-all duration-300 ${activeTab === "products"
                            ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                            : "text-[#a1a1aa] hover:text-white"
                            }`}
                    >
                        <Package size={16} className={activeTab === "products" ? "text-black" : ""} />
                        ÜRÜNLER
                    </button>
                    <button
                        onClick={() => handleTabChange("categories")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] tracking-wide transition-all duration-300 ${activeTab === "categories"
                            ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                            : "text-[#a1a1aa] hover:text-white"
                            }`}
                    >
                        <Layers size={16} className={activeTab === "categories" ? "text-black" : ""} />
                        KATEGORİLER
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Form Section */}
                <div className="w-full lg:w-[380px] flex-shrink-0 bg-[#1c1c1c] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    {/* Subtle aesthetic gradient background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    {activeTab === "products" ? (
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Package size={24} className="text-[#eab308]" />
                                    <h2 className="text-xl font-black text-white tracking-wide">
                                        {editingProduct ? "ÜRÜNÜ DÜZENLE" : "YENİ ÜRÜN EKLE"}
                                    </h2>
                                </div>
                                {editingProduct && (
                                    <button
                                        onClick={handleCancelProductEdit}
                                        className="w-8 h-8 rounded-[8px] bg-[#27272a] text-[#a1a1aa] flex items-center justify-center hover:bg-[#3f3f46] hover:text-white transition-colors"
                                        title="İptal"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {editingProduct && (
                                <div className="bg-[#eab308]/10 border border-[#eab308]/20 rounded-[12px] px-4 py-2.5">
                                    <p className="text-[#eab308] text-[11px] font-black uppercase tracking-widest">
                                        Düzenleniyor: {editingProduct.name}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">ÜRÜN ADI</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Adana Kebap"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">KATEGORİ</label>
                                <div className="relative">
                                    <select
                                        value={productCategoryId}
                                        onChange={(e) => setProductCategoryId(e.target.value)}
                                        className="bg-[#0d0d0d] text-white px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium appearance-none border border-transparent hover:border-[#27272a]"
                                    >
                                        <option value="" disabled className="text-[#52525b]">Kategori Seçin</option>
                                        {MOCK_CATEGORIES.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#a1a1aa]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">FİYAT (₺)</label>
                                <input
                                    type="number"
                                    placeholder="Örn: 250"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300">
                                    {editingProduct ? "DEĞİŞİKLİKLERİ KAYDET" : "ÜRÜNÜ KAYDET"}
                                </button>
                                {editingProduct && (
                                    <button
                                        onClick={handleCancelProductEdit}
                                        className="w-full bg-[#27272a] text-[#a1a1aa] font-black py-3.5 rounded-[16px] hover:bg-[#3f3f46] hover:text-white transition-all duration-300"
                                    >
                                        İPTAL
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Layers size={24} className="text-[#eab308]" />
                                    <h2 className="text-xl font-black text-white tracking-wide">
                                        {editingCategory ? "KATEGORİ DÜZENLE" : "YENİ KATEGORİ"}
                                    </h2>
                                </div>
                                {editingCategory && (
                                    <button
                                        onClick={handleCancelCategoryEdit}
                                        className="w-8 h-8 rounded-[8px] bg-[#27272a] text-[#a1a1aa] flex items-center justify-center hover:bg-[#3f3f46] hover:text-white transition-colors"
                                        title="İptal"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {editingCategory && (
                                <div className="bg-[#eab308]/10 border border-[#eab308]/20 rounded-[12px] px-4 py-2.5">
                                    <p className="text-[#eab308] text-[11px] font-black uppercase tracking-widest">
                                        Düzenleniyor: {editingCategory.name}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#808080] font-black uppercase tracking-[0.15em]">KATEGORİ ADI</label>
                                <input
                                    type="text"
                                    placeholder="Örn: Tatlılar"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    className="bg-[#0d0d0d] text-white placeholder-[#52525b] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium border border-transparent hover:border-[#27272a]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-1 transition-all duration-300">
                                    {editingCategory ? "DEĞİŞİKLİKLERİ KAYDET" : "KATEGORİYİ EKLE"}
                                </button>
                                {editingCategory && (
                                    <button
                                        onClick={handleCancelCategoryEdit}
                                        className="w-full bg-[#27272a] text-[#a1a1aa] font-black py-3.5 rounded-[16px] hover:bg-[#3f3f46] hover:text-white transition-all duration-300"
                                    >
                                        İPTAL
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Grid Section */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {activeTab === "products" && (
                        <div className="relative text-[#a1a1aa] focus-within:text-white transition-colors w-full">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Ürünlerde ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1c1c1c] border border-transparent text-white placeholder-[#52525b] py-4 pl-14 pr-5 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-medium hover:border-[#27272a]"
                            />
                        </div>
                    )}

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {activeTab === "products" ? (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className={`bg-[#1c1c1c] border rounded-[24px] p-4 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${editingProduct?.id === product.id
                                        ? "border-[#eab308]/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                                        : "border-transparent hover:border-[#eab308]/30"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-[52px] h-[52px] rounded-[14px] text-[#eab308] flex items-center justify-center font-black text-lg shadow-inner transition-colors ${editingProduct?.id === product.id ? "bg-[#eab308]/20" : "bg-[#27272a] group-hover:bg-[#eab308]/10"}`}>
                                            {product.initial}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className={`font-bold text-[15px] leading-tight mb-1 transition-colors ${editingProduct?.id === product.id ? "text-[#eab308]" : "text-white group-hover:text-[#eab308]"}`}>
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase">
                                                <span className="text-[#a1a1aa]">{product.category}</span>
                                                <span className="text-[#3f3f46]">•</span>
                                                <span className="text-[#eab308]">₺{product.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pr-1">
                                        <button
                                            onClick={() => handleEditProduct(product)}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors ${editingProduct?.id === product.id
                                                ? "bg-[#eab308] text-[#0d0d0d]"
                                                : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white"
                                                }`}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button className="w-9 h-9 rounded-[10px] bg-[#3f1515] text-[#ef4444] border border-[#ef4444]/10 flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all shadow-sm">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            MOCK_CATEGORIES.map((category) => (
                                <div
                                    key={category.id}
                                    className={`bg-[#1c1c1c] border rounded-[24px] p-5 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${editingCategory?.id === category.id
                                        ? "border-[#eab308]/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                                        : "border-transparent hover:border-[#eab308]/30"
                                        }`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-[52px] h-[52px] rounded-[14px] text-[#eab308] flex items-center justify-center shadow-inner transition-colors ${editingCategory?.id === category.id ? "bg-[#eab308]/20" : "bg-[#27272a] group-hover:bg-[#eab308]/10"}`}>
                                            <Layers size={22} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className={`font-bold text-[16px] leading-tight mb-1 transition-colors ${editingCategory?.id === category.id ? "text-[#eab308]" : "text-white group-hover:text-[#eab308]"}`}>
                                                {category.name}
                                            </h3>
                                            <p className="text-[11px] text-[#a1a1aa] font-black tracking-widest uppercase mt-0.5">
                                                {category.productCount} Ürün
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pr-1">
                                        <button
                                            onClick={() => handleEditCategory(category)}
                                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors ${editingCategory?.id === category.id
                                                ? "bg-[#eab308] text-[#0d0d0d]"
                                                : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white"
                                                }`}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button className="w-9 h-9 rounded-[10px] bg-[#3f1515] text-[#ef4444] border border-[#ef4444]/10 flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all shadow-sm">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {(activeTab === "products" && filteredProducts.length === 0) && (
                            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 text-center">
                                <Search size={48} className="text-[#27272a] mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Ürün bulunamadı</h3>
                                <p className="text-[#a1a1aa]">Arama kriterlerinize uygun ürün bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

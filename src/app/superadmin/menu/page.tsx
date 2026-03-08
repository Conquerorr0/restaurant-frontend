"use client";

import React, { useState, useEffect } from "react";
import {
    Utensils, Plus, Search, Edit2, Trash2, X, Check,
    ChevronRight, Tag, DollarSign, Image as ImageIcon,
    Loader2, AlertCircle, LayoutGrid
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { menuService, Category, Product } from "@/services/menuService";

export default function MenuManagement() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'ALL'>('ALL');

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form states
    const [productForm, setProductForm] = useState({
        name: "",
        price: 0,
        cost_price: 0,
        category_id: "",
        description: "",
        is_active: true
    });
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        sort_order: 0,
        is_active: true
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                menuService.getCategories(token!),
                menuService.getProducts(token!)
            ]);
            if (catRes.success) setCategories(catRes.data);
            if (prodRes.success) setProducts(prodRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Product Handlers
    const handleOpenProductAdd = () => {
        setEditingProduct(null);
        setProductForm({
            name: "",
            price: 0,
            cost_price: 0,
            category_id: categories[0]?.id || "",
            description: "",
            is_active: true
        });
        setError("");
        setShowProductModal(true);
    };

    const handleOpenProductEdit = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price,
            cost_price: (product as any).cost_price || 0,
            category_id: product.category_id,
            description: product.description || "",
            is_active: product.is_active
        });
        setError("");
        setShowProductModal(true);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            if (editingProduct) {
                await menuService.updateProduct(editingProduct.id, productForm, token!);
            } else {
                await menuService.createProduct(productForm, token!);
            }
            setShowProductModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    const handleProductDelete = async (id: string) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
        try {
            const res = await menuService.deleteProduct(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    // Category Handlers
    const handleOpenCategoryAdd = () => {
        setEditingCategory(null);
        setCategoryForm({ name: "", sort_order: categories.length + 1, is_active: true });
        setError("");
        setShowCategoryModal(true);
    };

    const handleOpenCategoryEdit = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            sort_order: category.sort_order,
            is_active: category.is_active
        });
        setError("");
        setShowCategoryModal(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            if (editingCategory) {
                await menuService.updateCategory(editingCategory.id, categoryForm, token!);
            } else {
                await menuService.createCategory(categoryForm, token!);
            }
            setShowCategoryModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCategoryDelete = async (id: string) => {
        if (!confirm("DİKKAT: Bu kategoriyi silerseniz içindeki ürünler kategorisiz kalabilir. Devam edilsin mi?")) return;
        try {
            const res = await menuService.deleteCategory(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    const filteredProducts = selectedCategoryId === 'ALL'
        ? products
        : products.filter(p => p.category_id === selectedCategoryId);

    return (
        <div className="flex flex-col gap-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-wide mb-1">MENÜ YÖNETİMİ</h1>
                    <p className="text-[#a1a1aa] text-[15px] font-medium font-bold">
                        Kategorileri ve ürünleri düzenleyin
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleOpenCategoryAdd}
                        className="bg-[#27272a] text-white px-5 py-3 rounded-[16px] font-bold flex items-center gap-2 hover:bg-[#3f3f46] transition-all"
                    >
                        <LayoutGrid size={18} /> KATEGORİ EKLE
                    </button>
                    <button
                        onClick={handleOpenProductAdd}
                        className="bg-[#eab308] text-[#0d0d0d] px-6 py-3 rounded-[16px] font-black flex items-center gap-2 hover:scale-[1.05] transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                        <Plus size={20} /> ÜRÜN EKLE
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-[#18181b] w-fit rounded-[20px] border border-[#27272a]">
                <button
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`px-8 py-3 rounded-[14px] font-black text-xs tracking-widest transition-all ${activeTab === 'PRODUCTS' ? 'bg-[#eab308] text-[#0d0d0d] shadow-lg' : 'text-[#71717a] hover:text-white'
                        }`}
                >
                    ÜRÜNLER
                </button>
                <button
                    onClick={() => setActiveTab('CATEGORIES')}
                    className={`px-8 py-3 rounded-[14px] font-black text-xs tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-[#eab308] text-[#0d0d0d] shadow-lg' : 'text-[#71717a] hover:text-white'
                        }`}
                >
                    KATEGORİLER
                </button>
            </div>

            {activeTab === 'PRODUCTS' && (
                <div className="flex flex-col gap-6">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategoryId('ALL')}
                            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedCategoryId === 'ALL' ? 'bg-[#eab308] text-[#0d0d0d]' : 'bg-[#18181b] border border-[#27272a] text-[#71717a]'
                                }`}
                        >
                            TÜMÜ
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-[#eab308] text-[#0d0d0d]' : 'bg-[#18181b] border border-[#27272a] text-[#71717a]'
                                    }`}
                            >
                                {cat.name.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="w-full h-[300px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#eab308]" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="bg-[#18181b] border border-[#27272a] rounded-[24px] overflow-hidden flex flex-col group hover:border-[#eab308]/30 transition-all"
                                >
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="text-[#eab308] font-black text-xl italic">
                                                ₺{product.price}
                                            </div>
                                            {!product.is_active && (
                                                <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded">PASİF</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-lg uppercase leading-tight">{product.name}</h3>
                                            <p className="text-[#71717a] text-xs font-bold line-clamp-2 mt-1">
                                                {product.description || "Açıklama girilmemiş."}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 mt-auto">
                                            <button
                                                onClick={() => handleOpenProductEdit(product)}
                                                className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white py-2 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Edit2 size={14} /> DÜZENLE
                                            </button>
                                            <button
                                                onClick={() => handleProductDelete(product.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[12px] transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'CATEGORIES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className="bg-[#18181b] border border-[#27272a] rounded-[24px] p-6 flex flex-col gap-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[16px] bg-[#27272a] flex items-center justify-center text-[#eab308]">
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg uppercase">{cat.name}</h3>
                                        <p className="text-[#71717a] text-xs font-bold">Sıra: {cat.sort_order}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenCategoryEdit(cat)}
                                        className="p-2 bg-[#27272a] hover:text-[#eab308] rounded-[10px] transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleCategoryDelete(cat.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-[10px] transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#18181b] border border-[#27272a] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-white">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic">
                                {editingProduct ? 'ÜRÜN DÜZENLE' : 'YENİ ÜRÜN'}
                            </h2>
                            <button onClick={() => setShowProductModal(false)} className="text-[#71717a] hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleProductSubmit} className="p-8 pt-4 flex flex-col gap-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-sm font-bold flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">ÜRÜN ADI</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none"
                                    placeholder="Örn: Adana Kebap"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">SATIŞ FİYATI (₺)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none"
                                        placeholder="0.00"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">MALİYET (₺)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-[#0d0d0d] border border-red-500/30 rounded-[16px] py-3 px-4 font-bold focus:border-red-500 outline-none"
                                        placeholder="0.00"
                                        value={productForm.cost_price}
                                        onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">KATEGORİ</label>
                                <select
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none appearance-none"
                                    value={productForm.category_id}
                                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">AÇIKLAMA</label>
                                <textarea
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none h-24 resize-none"
                                    placeholder="Ürün açıklaması..."
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#eab308] py-4 rounded-[18px] text-[#0d0d0d] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {editingProduct ? 'GÜNCELLE' : 'ÜRÜNÜ EKLE'}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
                    <div className="bg-[#18181b] border border-[#27272a] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black italic">
                                {editingCategory ? 'KAT. DÜZENLE' : 'YENİ KATEGORİ'}
                            </h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-[#71717a] hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="p-8 pt-4 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">KATEGORİ ADI</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none"
                                    placeholder="Örn: Ana Yemekler"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black text-[#71717a] tracking-widest uppercase">GÖRÜNÜM SIRASI</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-[16px] py-3 px-4 font-bold focus:border-[#eab308] outline-none"
                                    value={categoryForm.sort_order}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#eab308] py-4 rounded-[18px] text-[#0d0d0d] font-black text-lg mt-4 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Check size={24} /> {editingCategory ? 'GÜNCELLE' : 'KATEGORİ EKLE'}</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

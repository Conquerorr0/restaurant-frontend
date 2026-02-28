// src/lib/mock-data.ts

// 1. Users (Kullanıcılar)
export const mockUsers = [
  {
    id: "uuid-1",
    name_surname: "Ahmet Yılmaz",
    username: "admin",
    password_hash: "hashed_password", // Şifresi "admin123" gibi farz edelim
    pin_code: null,
    role: "SUPER_ADMIN",
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "uuid-2",
    name_surname: "Ayşe Kasa",
    username: "kasa1",
    password_hash: "hashed_password",
    pin_code: null,
    role: "CASHIER",
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "uuid-3",
    name_surname: "Mehmet Garson",
    username: "garson1",
    password_hash: null,
    pin_code: "1453",
    role: "WAITER",
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
  },
];

// 2. Categories & Products (Menü)
export const mockMenu = [
  {
    id: 1,
    name: "Başlangıçlar",
    order_index: 1,
    is_active: true,
    products: [
      { id: 101, name: "Günün Çorbası", price: 80.0, image_url: "https://via.placeholder.com/150", is_active: true },
      { id: 102, name: "Paçanga Böreği", price: 120.0, image_url: "https://via.placeholder.com/150", is_active: true },
    ],
  },
  {
    id: 2,
    name: "Ana Yemekler",
    order_index: 2,
    is_active: true,
    products: [
      { id: 201, name: "Izgara Köfte", price: 250.0, image_url: "https://via.placeholder.com/150", is_active: true },
      { id: 202, name: "Tavuk Şiş", price: 210.0, image_url: "https://via.placeholder.com/150", is_active: true },
      { id: 203, name: "Dana Bonfile", price: 450.0, image_url: "https://via.placeholder.com/150", is_active: true },
    ],
  },
  {
    id: 3,
    name: "İçecekler",
    order_index: 3,
    is_active: true,
    products: [
      { id: 301, name: "Kutu Kola", price: 40.0, image_url: "https://via.placeholder.com/150", is_active: true },
      { id: 302, name: "Ayran", price: 30.0, image_url: "https://via.placeholder.com/150", is_active: true },
      { id: 303, name: "Su", price: 15.0, image_url: "https://via.placeholder.com/150", is_active: true },
    ],
  },
];

// 3. Tables (Masalar)
export const mockTables = [
  {
    id: 1,
    name: "Bahçe-1",
    status: "OCCUPIED",
    capacity: 4,
    activeOrderId: 450,
    totalAmount: 510.0,
  },
  {
    id: 2,
    name: "Bahçe-2",
    status: "EMPTY",
    capacity: 4,
    activeOrderId: null,
    totalAmount: 0,
  },
  {
    id: 3,
    name: "Salon-1",
    status: "OCCUPIED",
    capacity: 2,
    activeOrderId: 451,
    totalAmount: 120.0,
  },
  {
    id: 4,
    name: "Salon-2",
    status: "EMPTY",
    capacity: 6,
    activeOrderId: null,
    totalAmount: 0,
  },
];

// 4. Orders (Adisyon Detayı)
export const mockOrders = [
  {
    orderId: 450,
    table: { id: 1, name: "Bahçe-1" },
    status: "OPEN",
    totalAmount: 510.0,
    waiterId: "uuid-3",
    created_at: "2024-02-28T18:30:00Z",
    items: [
      {
        orderItemId: 1001,
        productId: 201,
        productName: "Izgara Köfte",
        quantity: 2,
        unitPrice: 200.0,
        totalPrice: 400.0,
        note: "Biri acılı",
        status: "ACTIVE",
        added_by: "uuid-3",
        created_at: "2024-02-28T18:32:00Z"
      },
      {
        orderItemId: 1002,
        productId: 301,
        productName: "Kutu Kola",
        quantity: 2,
        unitPrice: 40.0,
        totalPrice: 80.0,
        note: "",
        status: "ACTIVE",
        added_by: "uuid-3",
        created_at: "2024-02-28T18:32:00Z"
      },
      {
        orderItemId: 1003,
        productId: 303,
        productName: "Su",
        quantity: 2,
        unitPrice: 15.0,
        totalPrice: 30.0,
        note: "",
        status: "ACTIVE",
        added_by: "uuid-3",
        created_at: "2024-02-28T18:32:00Z"
      }
    ],
  },
  {
    orderId: 451,
    table: { id: 3, name: "Salon-1" },
    status: "OPEN",
    totalAmount: 120.0,
    waiterId: "uuid-3",
    created_at: "2024-02-28T19:00:00Z",
    items: [
      {
        orderItemId: 1004,
        productId: 102,
        productName: "Paçanga Böreği",
        quantity: 1,
        unitPrice: 120.0,
        totalPrice: 120.0,
        note: "",
        status: "ACTIVE",
        added_by: "uuid-3",
        created_at: "2024-02-28T19:01:00Z"
      }
    ],
  }
];

// Helper wrapper functions simulating the API Responses
export const getStandardResponse = (data: any, success = true, message = "İşlem başarılı") => {
  return {
    success,
    message,
    data,
  };
};

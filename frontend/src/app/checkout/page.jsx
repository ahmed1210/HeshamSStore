"use client";
import { apiUrl } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import { getCart, saveCart } from "@/utils/cartStorage";



export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [deliveryPlaces, setDeliveryPlaces] = useState([]);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    deliveryPlaceId: "",
    paymentMethod: "cash",
  });

  useEffect(() => {
    const savedCart = getCart();
    setCart(savedCart);
    loadDeliveryPlaces();

    const update = () => {
      setCart(getCart());
    };

    window.addEventListener("cartUpdated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("cartUpdated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const loadDeliveryPlaces = async () => {
    try {
      setLoadingDelivery(true);

     const res = await fetch(apiUrl("/api/delivery/places"));
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load delivery places");
      }

      const activePlaces = Array.isArray(data)
        ? data.filter((place) => place.active !== false)
        : [];

      setDeliveryPlaces(activePlaces);

      if (activePlaces.length > 0) {
        setForm((prev) => ({
          ...prev,
          deliveryPlaceId: String(activePlaces[0].id),
        }));
      }
    } catch (error) {
      console.error("Delivery places error:", error);
      setDeliveryPlaces([]);
    } finally {
      setLoadingDelivery(false);
    }
  };

  const selectedDeliveryPlace = useMemo(() => {
    return deliveryPlaces.find(
      (place) => String(place.id) === String(form.deliveryPlaceId)
    );
  }, [deliveryPlaces, form.deliveryPlaceId]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.quantity || 1);
    }, 0);
  }, [cart]);

  const deliveryPrice = Number(selectedDeliveryPlace?.price || 0);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.type === "free_delivery") {
      return deliveryPrice;
    }

    if (appliedDiscount.type === "percentage") {
      return Math.round((subtotal * Number(appliedDiscount.value || 0)) / 100);
    }

    if (appliedDiscount.type === "fixed") {
      return Math.min(subtotal, Number(appliedDiscount.value || 0));
    }

    return 0;
  }, [appliedDiscount, subtotal, deliveryPrice]);

  const total = Math.max(0, subtotal + deliveryPrice - discountAmount);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const cleaned = value.replace(/[^\d+]/g, "");

      setForm((prev) => ({
        ...prev,
        phone: cleaned,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizePhone = (phone) => {
    const cleanPhone = String(phone || "").trim();

    if (cleanPhone.startsWith("+20")) {
      return cleanPhone;
    }

    if (cleanPhone.startsWith("20")) {
      return `+${cleanPhone}`;
    }

    if (cleanPhone.startsWith("0")) {
      return `+20${cleanPhone.slice(1)}`;
    }

    return cleanPhone;
  };

  const validateForm = () => {
    if (cart.length === 0) {
      showMessage("Your cart is empty. Please add products first.");
      return false;
    }

    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      showMessage("Please enter your full name.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      showMessage("Please enter a valid email address.");
      return false;
    }

    const phone = normalizePhone(form.phone);
    const egyptPhoneRegex = /^\+20(10|11|12|15)\d{8}$/;

    if (!egyptPhoneRegex.test(phone)) {
      showMessage("Please enter a valid Egyptian phone number.");
      return false;
    }

    if (!form.deliveryPlaceId) {
      showMessage("Please select your delivery area.");
      return false;
    }

    if (!form.address.trim() || form.address.trim().length < 8) {
      showMessage("Please enter a clear delivery address.");
      return false;
    }

    if (!["cash", "visa", "wallet"].includes(form.paymentMethod)) {
      showMessage("Please select a payment method.");
      return false;
    }

    return true;
  };

  const applyDiscountCode = async () => {
    const code = discountCode.trim().toUpperCase();

    if (!code) {
      showMessage("Please enter a discount code.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/discounts/validate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          subtotal,
          deliveryPrice,
        }),
      });

      const data = await res.json();

      if (res.ok && data.discount) {
        setAppliedDiscount(data.discount);
        showMessage("Discount code applied successfully.", "success");
        return;
      }

      throw new Error(data.message || "Invalid discount code");
    } catch (error) {
      const fallbackCodes = {
        HESHAM10: {
          code: "HESHAM10",
          type: "percentage",
          value: 10,
          label: "10% off",
        },
        HESHAM20: {
          code: "HESHAM20",
          type: "percentage",
          value: 20,
          label: "20% off",
        },
        FREEDELIVERY: {
          code: "FREEDELIVERY",
          type: "free_delivery",
          value: 0,
          label: "Free delivery",
        },
      };

      if (fallbackCodes[code]) {
        setAppliedDiscount(fallbackCodes[code]);
        showMessage("Discount code applied successfully.", "success");
        return;
      }

      setAppliedDiscount(null);
      showMessage("This discount code is not valid.");
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const buildOrderItems = () => {
    return cart.map((item) => {
      const quantity = Number(item.quantity || item.cartQuantity || 1);

      return {
        id: item.productId || item.id,
        productId: item.productId || item.id,
        name: item.name || item.productName || "Product",
        productName: item.productName || item.name || "Product",
        image: item.image || item.imageUrl || "",
        size: item.size || item.selectedSize || "",
        selectedSize: item.selectedSize || item.size || "",
        price: Number(item.price || 0),
        quantity,
        cartQuantity: quantity,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const customerPhone = normalizePhone(form.phone);

      const orderPayload = {
        customer: {
          fullName: form.fullName.trim(),
          name: form.fullName.trim(),
          email: form.email.trim(),
          phone: customerPhone,
          city: selectedDeliveryPlace?.name || "",
          address: form.address.trim(),
          notes: form.notes.trim(),
        },

        items: buildOrderItems(),

        deliveryPlaceId: selectedDeliveryPlace?.id || "",
        deliveryPlace: selectedDeliveryPlace?.name || "",
        deliveryPrice,

        discountCode: appliedDiscount?.code || "",
        discountType: appliedDiscount?.type || "",
        discountValue: appliedDiscount?.value || 0,
        discountAmount,

        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentMethod === "cash" ? "pending" : "pending",

        subtotal,
        shipping: deliveryPrice,
        total,
        totalPrice: total,

        orderStatus: "new",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

console.log("ORDER RESPONSE STATUS:", res.status);
console.log("ORDER RESPONSE DATA:", data);

if (!res.ok) {
  throw new Error(data.message || "Failed to create order");
}

      localStorage.setItem("lastOrder", JSON.stringify(data.order));

      saveCart([]);
      setCart([]);
      window.dispatchEvent(new Event("cartUpdated"));

      router.push("/checkout/success");
    } catch (error) {
      console.error("Checkout error:", error);

      const errorText = String(error.message || "").toLowerCase();

      if (
        errorText.includes("stock") ||
        errorText.includes("pieces left") ||
        errorText.includes("size") ||
        errorText.includes("not available")
      ) {
        showMessage(
          "Some items in your cart are no longer available in the selected size. Please update your cart and try again."
        );
        return;
      }

      if (
        errorText.includes("failed to fetch") ||
        errorText.includes("network") ||
        errorText.includes("cannot connect")
      ) {
        showMessage(
          "We could not connect to the store server right now. Please try again in a moment."
        );
        return;
      }

      showMessage(
        "We could not complete your order right now. Please check your information and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentCards = [
    {
      id: "cash",
      title: "Cash on Delivery",
      text: "Pay when your order arrives.",
      icon: Truck,
    },
    {
      id: "visa",
      title: "Visa / Card",
      text: "Ready for Paymob card payment.",
      icon: CreditCard,
    },
    {
      id: "wallet",
      title: "E-Wallet",
      text: "Ready for wallet payment.",
      icon: Wallet,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--page-bg)] py-20 text-[var(--text-main)]">
      <div className="container">
        <div className="mb-8">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/35 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            <ArrowLeft size={17} />
            Back to Cart
          </Link>

          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
            Secure Checkout
          </p>

          <h1 className="theme-text mt-3 text-4xl font-black uppercase leading-none md:text-6xl">
            Checkout
          </h1>

          <p className="theme-muted mt-3 max-w-2xl">
            Complete your order details. Delivery price is calculated from your
            selected area.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl border p-4 font-bold ${
              messageType === "success"
                ? "border-green-500/40 bg-green-500/10 text-green-500"
                : "border-red-500/40 bg-red-500/10 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {cart.length === 0 ? (
          <section className="mx-auto max-w-2xl rounded-[2.5rem] border border-yellow-400/25 bg-black/40 p-8 text-center shadow-2xl shadow-yellow-400/10 backdrop-blur-xl light:bg-white">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-400">
              <ShoppingBag size={52} />
            </div>

            <h2 className="mt-6 text-3xl font-black uppercase text-white light:text-zinc-950">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-zinc-400 light:text-zinc-600">
              Add products to your cart before checkout.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-yellow-400 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-yellow-300"
            >
              Shop Products
            </Link>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
            <section className="space-y-6">
              <div className="rounded-[2.5rem] border border-yellow-400/25 bg-black/45 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl light:bg-white">
                <div className="mb-5 flex items-center gap-2 text-yellow-400">
                  <ReceiptText size={20} />
                  <h2 className="text-xl font-black uppercase">
                    Customer Information
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Full Name
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                      placeholder="Ahmed Mohamed"
                    />
                  </div>

                  <div>
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Phone
                    </label>
                    <div className="theme-input flex items-center gap-2 rounded-2xl px-4">
                      <Phone size={17} className="text-yellow-400" />
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="theme-text w-full bg-transparent py-3 outline-none"
                        placeholder="01000000000"
                        inputMode="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Delivery Area
                    </label>

                    <div className="theme-input flex items-center gap-2 rounded-2xl px-4">
                      <MapPin size={17} className="text-yellow-400" />
                      <select
                        name="deliveryPlaceId"
                        value={form.deliveryPlaceId}
                        onChange={handleChange}
                        className="theme-text w-full bg-transparent py-3 outline-none"
                      >
                        {loadingDelivery ? (
                          <option value="">Loading areas...</option>
                        ) : deliveryPlaces.length > 0 ? (
                          deliveryPlaces.map((place) => (
                            <option key={place.id} value={place.id}>
                              {place.name} - {Number(place.price || 0)} EGP
                            </option>
                          ))
                        ) : (
                          <option value="">No delivery areas found</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Full Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="theme-input min-h-[110px] w-full resize-y rounded-2xl px-4 py-3 outline-none"
                      placeholder="Street, building number, floor, apartment..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="theme-muted mb-2 block text-sm font-bold">
                      Notes Optional
                    </label>
                    <input
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
                      placeholder="Any special delivery notes?"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-yellow-400/25 bg-black/45 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl light:bg-white">
                <div className="mb-5 flex items-center gap-2 text-yellow-400">
                  <ShieldCheck size={20} />
                  <h2 className="text-xl font-black uppercase">
                    Payment Method
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {paymentCards.map((method) => {
                    const Icon = method.icon;
                    const active = form.paymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            paymentMethod: method.id,
                          }))
                        }
                        className={`rounded-[1.5rem] border p-4 text-left transition ${
                          active
                            ? "border-yellow-400 bg-yellow-400 text-black"
                            : "border-white/15 bg-black/20 text-[var(--text-main)] hover:border-yellow-400 light:border-zinc-200 light:bg-zinc-50"
                        }`}
                      >
                        <Icon size={24} />
                        <h3 className="mt-3 font-black uppercase">
                          {method.title}
                        </h3>
                        <p
                          className={`mt-2 text-sm ${
                            active ? "text-black/70" : "theme-muted"
                          }`}
                        >
                          {method.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-yellow-400/25 bg-black/45 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl light:bg-white">
                <div className="mb-5 flex items-center gap-2 text-yellow-400">
                  <Tag size={20} />
                  <h2 className="text-xl font-black uppercase">
                    Discount Code
                  </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="theme-input flex-1 rounded-full px-5 py-4 font-bold uppercase outline-none"
                    placeholder="Enter code"
                  />

                  {appliedDiscount ? (
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="rounded-full border border-red-500/40 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyDiscountCode}
                      className="rounded-full bg-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-black hover:bg-yellow-300"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {appliedDiscount && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 font-bold text-green-500">
                    <CheckCircle size={18} />
                    {appliedDiscount.label || appliedDiscount.code} applied
                  </div>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-[2.5rem] border border-yellow-400/25 bg-black/60 p-6 shadow-2xl shadow-yellow-400/10 backdrop-blur-xl light:bg-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                Order Summary
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase text-white light:text-zinc-950">
                Summary
              </h2>

              <div className="mt-6 space-y-4 border-y border-yellow-400/20 py-5">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Items
                  </span>
                  <strong className="text-white light:text-zinc-950">
                    {totalItems}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Subtotal
                  </span>
                  <strong className="text-white light:text-zinc-950">
                    {subtotal} EGP
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-400 light:text-zinc-600">
                    Delivery
                  </span>
                  <strong className="text-white light:text-zinc-950">
                    {deliveryPrice} EGP
                  </strong>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-green-500">Discount</span>
                    <strong className="text-green-500">
                      -{discountAmount} EGP
                    </strong>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-between gap-4">
                <span className="text-lg font-black text-white light:text-zinc-950">
                  Total
                </span>

                <strong className="text-2xl font-black text-yellow-400">
                  {total} EGP
                </strong>
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black shadow-xl shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>

              <p className="theme-muted mt-4 text-center text-xs leading-5">
                Your order will be confirmed after our team contacts you.
              </p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
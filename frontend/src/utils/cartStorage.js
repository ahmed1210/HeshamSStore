const CART_KEY = "cart";

export function getCart() {
  if (typeof window === "undefined") return [];

  try {
    const savedCart = localStorage.getItem(CART_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

export function saveCart(cart) {
  if (typeof window === "undefined") return [];

  const safeCart = Array.isArray(cart) ? cart : [];

  localStorage.setItem(CART_KEY, JSON.stringify(safeCart));
  window.dispatchEvent(new Event("cartUpdated"));

  return safeCart;
}

export function clearCart() {
  if (typeof window === "undefined") return [];

  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));

  return [];
}

export function getCartCount() {
  const cart = getCart();

  return cart.reduce((sum, item) => {
    return sum + Number(item.quantity || item.cartQuantity || 1);
  }, 0);
}

export function getCartSubtotal() {
  const cart = getCart();

  return cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
}

export function addItemToCart(item) {
  const cart = getCart();

  const productId = item.productId || item.id;
  const selectedSize = item.selectedSize || item.size || "Default";
  const quantityToAdd = Number(item.quantity || item.cartQuantity || 1);
  const maxStock = Number(item.maxStock || item.stock || 999);

  const existingIndex = cart.findIndex(
    (cartItem) =>
      String(cartItem.productId || cartItem.id) === String(productId) &&
      String(cartItem.selectedSize || cartItem.size || "Default") ===
        String(selectedSize)
  );

  if (existingIndex >= 0) {
    const oldQuantity = Number(cart[existingIndex].quantity || 1);
    const newQuantity = Math.min(oldQuantity + quantityToAdd, maxStock);

    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: newQuantity,
      cartQuantity: newQuantity,
      stock: maxStock,
      maxStock,
    };
  } else {
    cart.push({
      ...item,
      id: productId,
      productId,
      selectedSize,
      size: selectedSize,
      quantity: Math.min(quantityToAdd, maxStock),
      cartQuantity: Math.min(quantityToAdd, maxStock),
      stock: maxStock,
      maxStock,
    });
  }

  return saveCart(cart);
}

export function updateCartItemQuantity(productId, selectedSize, quantity) {
  const cart = getCart();
  const safeQuantity = Number(quantity || 1);

  if (!Number.isInteger(safeQuantity) || safeQuantity <= 0) {
    return cart;
  }

  const updatedCart = cart.map((item) => {
    const sameProduct =
      String(item.productId || item.id) === String(productId);

    const sameSize =
      String(item.selectedSize || item.size || "Default") ===
      String(selectedSize || "Default");

    if (!sameProduct || !sameSize) return item;

    const maxStock = Number(item.maxStock || item.stock || 999);
    const newQuantity = Math.min(safeQuantity, maxStock);

    return {
      ...item,
      quantity: newQuantity,
      cartQuantity: newQuantity,
    };
  });

  return saveCart(updatedCart);
}

export function removeCartItem(productId, selectedSize) {
  const cart = getCart();

  const updatedCart = cart.filter((item) => {
    const sameProduct =
      String(item.productId || item.id) === String(productId);

    const sameSize =
      String(item.selectedSize || item.size || "Default") ===
      String(selectedSize || "Default");

    return !(sameProduct && sameSize);
  });

  return saveCart(updatedCart);
}
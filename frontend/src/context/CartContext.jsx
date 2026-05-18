"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export default function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const getSizeStock = (product, size) => {
    return Number(product.sizeStock?.[String(size)] ?? product.quantity ?? 0);
  };

  const getCartQuantityForSize = (productId, size) => {
    const item = cartItems.find(
      (cartItem) =>
        cartItem.id === productId && cartItem.selectedSize === String(size)
    );

    return item ? Number(item.cartQuantity) : 0;
  };

  const addToCart = (product, size = product.sizes?.[0], quantity = 1) => {
    const selectedSize = String(size || "");
    const orderQuantity = Number(quantity) || 1;
    const availableForSize = getSizeStock(product, selectedSize);

    if (!selectedSize) {
      return {
        success: false,
        message: "Please select a size first",
      };
    }

    if (availableForSize <= 0) {
      return {
        success: false,
        message: "This size is out of stock",
      };
    }

    let result = {
      success: true,
      message: "Added to cart",
    };

    setCartItems((prev) => {
      const existingItem = prev.find(
        (item) => item.id === product.id && item.selectedSize === selectedSize
      );

      const alreadyInCart = existingItem ? existingItem.cartQuantity : 0;
      const remainingToAdd = availableForSize - alreadyInCart;

      if (remainingToAdd <= 0) {
        result = {
          success: false,
          message: "Maximum available quantity already in cart",
        };

        return prev;
      }

      const quantityToAdd = Math.min(orderQuantity, remainingToAdd);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === selectedSize
            ? {
                ...item,
                cartQuantity: item.cartQuantity + quantityToAdd,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          selectedSize,
          cartQuantity: quantityToAdd,
        },
      ];
    });

    return result;
  };

  const removeFromCart = (id, size) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.selectedSize === size))
    );
  };

  const increaseQuantity = (id, size) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.selectedSize === size) {
          const availableForSize = getSizeStock(item, size);

          if (item.cartQuantity >= availableForSize) {
            return item;
          }

          return {
            ...item,
            cartQuantity: item.cartQuantity + 1,
          };
        }

        return item;
      })
    );
  };

  const decreaseQuantity = (id, size) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id && item.selectedSize === size
            ? {
                ...item,
                cartQuantity: item.cartQuantity - 1,
              }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce(
    (total, item) => total + item.cartQuantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
        getCartQuantityForSize,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
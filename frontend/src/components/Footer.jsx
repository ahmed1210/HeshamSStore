"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { Camera, MapPin, Phone, Mail, Send } from "lucide-react";

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch(apiUrl("/api/settings"))
      .then((res) => res.json())
      .then((data) => setSettings(data || {}))
      .catch(() => setSettings({}));
  }, []);

  const storeName = settings.store_name || "Hesham Store";

  return (
    <footer className="mt-20 border-t border-yellow-400/20 bg-black/80 text-white">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h2 className="text-2xl font-black uppercase text-yellow-400">
              {storeName}
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {settings.description ||
                "Modern shoes store for men, women, and kids."}
            </p>
          </div>

          <div>
            <h3 className="font-black uppercase text-yellow-400">Shop</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <Link href="/products" className="block hover:text-yellow-400">
                All Products
              </Link>
              <Link href="/offers" className="block hover:text-yellow-400">
                Offers
              </Link>
              <Link href="/products?category=men" className="block hover:text-yellow-400">
                Men
              </Link>
              <Link href="/products?category=women" className="block hover:text-yellow-400">
                Women
              </Link>
              <Link href="/products?category=kids" className="block hover:text-yellow-400">
                Kids
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-black uppercase text-yellow-400">Support</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <Link href="/location" className="block hover:text-yellow-400">
                Location
              </Link>
              <Link href="/delivery-policy" className="block hover:text-yellow-400">
                Delivery Policy
              </Link>
              <Link href="/return-policy" className="block hover:text-yellow-400">
                Return / Refund Policy
              </Link>
              <Link href="/faq" className="block hover:text-yellow-400">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-black uppercase text-yellow-400">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {settings.address && (
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-yellow-400" />
                  {settings.address}
                </p>
              )}

              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2 hover:text-yellow-400">
                  <Phone size={16} className="text-yellow-400" />
                  {settings.phone}
                </a>
              )}

              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-yellow-400">
                  <Mail size={16} className="text-yellow-400" />
                  {settings.email}
                </a>
              )}

              <div className="flex gap-3 pt-2">
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" className="rounded-full border border-yellow-400/30 p-2 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                    <Camera size={18} />
                  </a>
                )}

                {settings.telegram_url && (
                  <a href={settings.telegram_url} target="_blank" className="rounded-full border border-yellow-400/30 p-2 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                    <Send size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-sm font-bold text-yellow-400">Payment Methods</p>
          <p className="mt-2 text-sm text-zinc-300">
            Cash on Delivery now available. Visa, Mastercard, and Wallet payments will be available after Paymob integration.
          </p>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
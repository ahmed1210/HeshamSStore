"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { MapPin } from "lucide-react";

export default function LocationPage() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch(apiUrl("/api/settings"))
      .then((res) => res.json())
      .then((data) => setSettings(data || {}))
      .catch(() => setSettings({}));
  }, []);

  const locations = [1, 2, 3, 4, 5]
    .map((num) => ({
      name: settings[`location_${num}_name`],
      address: settings[`location_${num}_address`],
      mapUrl: settings[`location_${num}_map_url`],
    }))
    .filter((location) => location.name || location.address || location.mapUrl);

  return (
    <main className="min-h-screen py-20 text-white">
      <div className="container">
        <section className="glass-panel rounded-[2rem] p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
            Visit Us
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase md:text-6xl">
            Locations
          </h1>

          {locations.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-black/40 p-8 text-zinc-400">
              Locations will be added soon.
            </div>
          ) : (
            <div className="mt-8 grid gap-8">
              {locations.map((location, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-black/40"
                >
                  <div className="p-6">
                    <MapPin className="text-yellow-400" />

                    {location.name && (
                      <h2 className="mt-4 text-2xl font-black text-white">
                        {location.name}
                      </h2>
                    )}

                    {location.address && (
                      <p className="mt-2 text-zinc-400">{location.address}</p>
                    )}
                  </div>

                  {location.mapUrl && (
                    <iframe
                      src={location.mapUrl}
                      className="h-[380px] w-full border-0"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
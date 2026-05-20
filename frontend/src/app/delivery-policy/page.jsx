
export default function DeliveryPolicyPage() {
  return (
    <main className="min-h-screen py-20 text-white">
      <div className="container">
        <section className="rounded-[2.5rem] border border-yellow-400/20 bg-black/50 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
            Shipping
          </p>

          <h1 className="mt-3 text-5xl font-black uppercase md:text-7xl">
            Delivery Policy
          </h1>

          <div className="mt-8 space-y-5 text-zinc-300">
            <p>
              We deliver orders to available delivery areas shown during checkout.
            </p>

            <p>
              Delivery price is calculated based on the selected delivery place.
            </p>

            <p>
              After placing your order, our team will contact you to confirm the
              order details and delivery timing.
            </p>

            <p>
              Cash on delivery is currently available. Online payment will be
              available after Paymob integration.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
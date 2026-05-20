export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen py-20 text-white">
      <div className="container">
        <section className="rounded-[2.5rem] border border-yellow-400/20 bg-black/50 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
            Returns
          </p>

          <h1 className="mt-3 text-5xl font-black uppercase md:text-7xl">
            Return / Refund Policy
          </h1>

          <div className="mt-8 space-y-5 text-zinc-300">
            <p>
              Products can be returned or exchanged only if they are unused,
              undamaged, and in the original packaging.
            </p>

            <p>
              Return or exchange requests must be made shortly after receiving
              the order.
            </p>

            <p>
              If the product has a manufacturing issue or wrong item was sent,
              please contact us with your order details.
            </p>

            <p>
              Delivery fees may not be refundable unless the issue is caused by
              the store.
            </p>

            <p>
              Refunds and exchanges are confirmed after reviewing the product
              condition.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
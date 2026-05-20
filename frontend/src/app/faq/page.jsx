const faqs = [
  {
    question: "How can I place an order?",
    answer:
      "Choose your product, select the size and quantity, add it to cart, then complete checkout with your delivery information.",
  },
  {
    question: "Do you offer cash on delivery?",
    answer:
      "Yes, cash on delivery is currently available. Online payments will be available after Paymob integration.",
  },
  {
    question: "How is delivery price calculated?",
    answer:
      "Delivery price is calculated based on the delivery place selected during checkout.",
  },
  {
    question: "Can I return or exchange a product?",
    answer:
      "Return and exchange rules depend on product condition and order confirmation. Please check the Return Policy page for details.",
  },
  {
    question: "How do I contact the store?",
    answer:
      "You can contact us using the phone, email, or social links shown in the footer and location page.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen py-20 text-white">
      <div className="container">
        <section className="mb-8 rounded-[2.5rem] border border-yellow-400/20 bg-black/50 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
            Help Center
          </p>

          <h1 className="mt-3 text-5xl font-black uppercase md:text-7xl">
            FAQ
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Quick answers for orders, delivery, payment, and returns.
          </p>
        </section>

        <section className="grid gap-5">
          {faqs.map((item) => (
            <div
              key={item.question}
              className="rounded-[2rem] border border-yellow-400/20 bg-black/50 p-6"
            >
              <h2 className="text-xl font-black text-yellow-400">
                {item.question}
              </h2>

              <p className="mt-3 leading-7 text-zinc-300">{item.answer}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
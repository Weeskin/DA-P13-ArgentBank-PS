const features = [
  {
    icon: "/assets/img/icon-chat.webp",
    title: "You are our #1 priority",
    description:
      "Need to talk to a representative? You can get in touch through our 24/7 chat or through a phone call in less than 5 minutes.",
  },
  {
    icon: "/assets/img/icon-money.webp",
    title: "More savings means higher rates",
    description:
      "The more you save with us, the higher your interest rate will be!",
  },
  {
    icon: "/assets/img/icon-security.webp",
    title: "Security you can trust",
    description:
      "We use top of the line encryption to make sure your data and money is always safe.",
  },
];

export function Welcome() {
  return (
    <main>
      {/* Hero */}
      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/img/bank-tree.webp)" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <section className="relative z-10 flex justify-end items-center min-h-[400px] px-8 py-12">
          <div className="bg-white p-8 max-w-sm text-right">
            <p className="font-bold text-lg">No fees.</p>
            <p className="font-bold text-lg">No minimum deposit.</p>
            <p className="font-bold text-lg">High interest rates.</p>
            <p className="mt-4 text-sm">
              Open a savings account with Argent Bank today!
            </p>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="flex flex-col md:flex-row justify-center gap-8 px-8 py-12 bg-gray-50">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center text-center max-w-xs"
          >
            <img
              src={feature.icon}
              alt={feature.title}
              className="w-16 h-16 mb-4"
            />
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

import { motion } from "framer-motion";

export default function Loading() {
  const pulseVariants = {
    animate: {
      pathLength: [0, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      },
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="relative w-full max-w-4xl mx-auto p-8">
        <div className="relative h-64 flex items-center justify-center overflow-hidden">
          <svg
            width="600"
            height="200"
            viewBox="0 0 600 200"
            className="w-full h-full"
          >
            <line
              x1="0"
              y1="100"
              x2="600"
              y2="100"
              stroke="#e5e5e5"
              strokeWidth="1"
              opacity="0.3"
            />

            <motion.path
              d="M0,100 L120,100 L125,100 L130,70 L135,130 L140,40 L145,160 L150,100 L155,100 L600,100"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={pulseVariants}
              animate="animate"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

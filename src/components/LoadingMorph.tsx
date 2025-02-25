import { motion, AnimatePresence } from 'framer-motion';

const buildingPath = "M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zM9 13v6H7v-6h2z";
const personPath = "M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM5 19v1h14v-1a7 7 0 0 0-14 0z";

export const LoadingMorph = () => {
  return (
    <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        className="text-blue-500"
      >
        <motion.path
          fill="currentColor"
          initial={{ d: buildingPath }}
          animate={{
            d: [buildingPath, personPath, buildingPath, personPath],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0.5, 1, 0.5]
          }}
        />
      </motion.svg>
    </motion.div>
    </AnimatePresence>
  );
};
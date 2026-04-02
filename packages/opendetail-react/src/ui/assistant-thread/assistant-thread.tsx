"use client";

import { motion } from "motion/react";
import { Children, isValidElement, type Key, type ReactNode } from "react";

const threadVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.02,
      staggerChildren: 0.06,
    },
  },
} as const;

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    },
    y: 0,
  },
} as const;

const getClassName = (className?: string): string =>
  ["opendetail-thread", className].filter(Boolean).join(" ");

const getItemKey = (item: ReactNode, index: number): Key =>
  isValidElement(item) && item.key !== null ? item.key : `item-${index}`;

export interface AssistantThreadProps {
  animated?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
}

export const AssistantThread = ({
  animated = false,
  ariaLabel = "OpenDetail assistant thread",
  children,
  className,
}: AssistantThreadProps) => {
  const items = Children.toArray(children);

  if (!animated) {
    return (
      <section aria-label={ariaLabel} className={getClassName(className)}>
        {items.map((item, index) => (
          <div
            className="opendetail-thread__item"
            key={getItemKey(item, index)}
          >
            {item}
          </div>
        ))}
      </section>
    );
  }

  return (
    <motion.section
      animate="visible"
      aria-label={ariaLabel}
      className={getClassName(className)}
      initial="hidden"
      variants={threadVariants}
    >
      {items.map((item, index) => (
        <motion.div
          className="opendetail-thread__item"
          key={getItemKey(item, index)}
          variants={itemVariants}
        >
          {item}
        </motion.div>
      ))}
    </motion.section>
  );
};

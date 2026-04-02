"use client";

import Link from "next/link";
import { isSafeAssistantSourceHref } from "opendetail-react";

export const renderNextSourceLink: import("opendetail-react").RenderAssistantSourceLink =
  ({ children, className, target, title }) => {
    if (!isSafeAssistantSourceHref(target.href, target.external)) {
      return (
        <span className={className} title={title}>
          {children}
        </span>
      );
    }

    return target.external ? (
      <a
        className={className}
        href={target.href}
        referrerPolicy="no-referrer"
        rel="noopener noreferrer"
        target="_blank"
        title={title}
      >
        {children}
      </a>
    ) : (
      <Link className={className} href={target.href} title={title}>
        {children}
      </Link>
    );
  };

"use client";

import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function FocusModeWrapper({ children, className }: Props) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

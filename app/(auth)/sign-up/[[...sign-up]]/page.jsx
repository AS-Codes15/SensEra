"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";

const Page = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) setHeaderHeight(header.offsetHeight);

    const observer = new ResizeObserver(() => {
      if (header) setHeaderHeight(header.offsetHeight);
    });

    if (header) observer.observe(header);

    return () => header && observer.unobserve(header);
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-start" style={{ paddingTop: headerHeight }}>
      <div className="w-full max-w-md p-6">
        <SignUp />
      </div>
    </div>
  );
};

export default Page;

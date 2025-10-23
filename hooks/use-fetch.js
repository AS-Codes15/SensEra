"use client";

import { useState, useCallback } from "react";

export default function useFetch(fn) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const callFn = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (err) {
        console.error("useFetch error:", err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { loading, data, error, fn: callFn };
}

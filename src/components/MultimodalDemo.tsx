"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const products = [
  {
    id: "stadium-mesh-pants",
    name: "Stadium Mesh Pants",
    price: "$78",
    tag: "Training",
    description: "Breathable mesh for long sessions.",
    gradient: "from-rose-500/20 via-orange-500/10 to-transparent",
    aliases: ["stadium mesh pants", "mesh pants", "stadium pants", "stadium mesh pant"],
    cursor: { left: "26%", top: "30%" },
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "velocity-track-jacket",
    name: "Velocity Track Jacket",
    price: "$96",
    tag: "Running",
    description: "Lightweight warmth with a sleek fit.",
    gradient: "from-sky-500/20 via-cyan-500/10 to-transparent",
    aliases: ["velocity track jacket", "track jacket", "velocity jacket"],
    cursor: { left: "52%", top: "35%" },
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "studio-cargo-shorts",
    name: "Studio Cargo Shorts",
    price: "$64",
    tag: "Everyday",
    description: "Flexible utility pockets for essentials.",
    gradient: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    aliases: ["studio cargo shorts", "cargo shorts", "studio shorts", "studio cargo short"],
    cursor: { left: "78%", top: "32%" },
    sizes: ["XS", "S", "M", "L"],
  },
];

type Command = {
  id: string;
  transcript: string;
  action: string;
  object: string;
  intent: string;
  targetId: string | null;
  cursor: { left: string; top: string };
  status: string;
  size?: string | null;
};

const commandPresets: Command[] = [
  {
    id: "cmd-1",
    transcript: "add to cart the stadium mesh pants",
    action: "add_to_cart",
    object: "Stadium Mesh Pants",
    intent: "Targeting the Stadium Mesh Pants card",
    targetId: "stadium-mesh-pants",
    cursor: products[0].cursor,
    status: "Queued click on Add to Cart",
  },
  {
    id: "cmd-2",
    transcript: "add to cart the velocity track jacket size medium",
    action: "add_to_cart",
    object: "Velocity Track Jacket",
    intent: "Targeting the Velocity Track Jacket card (Size: M)",
    targetId: "velocity-track-jacket",
    cursor: products[1].cursor,
    status: "Queued click on Add to Cart",
  },
  {
    id: "cmd-3",
    transcript: "open size guide for studio cargo shorts",
    action: "open_size_guide",
    object: "Studio Cargo Shorts",
    intent: "Focusing the Studio Cargo Shorts details",
    targetId: "studio-cargo-shorts",
    cursor: products[2].cursor,
    status: "Preparing size guide modal",
  },
];

export const MultimodalDemo = () => {
  const [activeCommand, setActiveCommand] = useState<Command>(commandPresets[0]);
  const [manualInput, setManualInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<
    { name: string; price: string; qty: number; size: string }[]
  >([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [logs, setLogs] = useState<
    { id: string; time: string; action: string; object: string; status: string }[]
  >([]);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [pendingSizeFor, setPendingSizeFor] = useState<string | null>(null);
  const [pendingSizeName, setPendingSizeName] = useState<string | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const pendingSizeRef = useRef<{
    id: string | null;
    name: string | null;
    qty: number | null;
  }>({ id: null, name: null, qty: null });
  const recognitionRef = useRef<any>(null);

  const actionCatalog = useMemo(
    () => [
      {
        action: "add_to_cart",
        status: "Queued click on Add to Cart",
      },
      {
        action: "open_size_guide",
        status: "Preparing size guide modal",
      },
      {
        action: "delete",
        status: "Removing item from cart",
      },
    ],
    []
  );

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const extractQuantity = (value: string) => {
    const normalized = normalize(value);
    const tokens = normalized.split(" ");
    const wordToNumber: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    for (const token of tokens) {
      if (!token) continue;
      if (/^\d+$/.test(token)) {
        const num = Number(token);
        if (Number.isFinite(num) && num > 0) return num;
      }
      if (wordToNumber[token]) return wordToNumber[token];
    }

    return 1;
  };

  const parsePrice = (price: string) => Number(price.replace(/[^0-9.]/g, ""));

  const parseSize = (value: string) => {
    const normalized = normalize(value);
    const sizeMap: Record<string, string> = {
      xs: "XS",
      xsmall: "XS",
      small: "S",
      s: "S",
      medium: "M",
      med: "M",
      mids: "M",
      mid: "M",
      median: "M",
      mediums: "M",
      m: "M",
      large: "L",
      l: "L",
      xlarge: "XL",
      xl: "XL",
      xxl: "XXL",
    };

    const tokens = normalized.split(" ").filter(Boolean);
    for (const token of tokens) {
      const normalizedToken = token.replace(/[^a-z]/g, "");
      if (sizeMap[normalizedToken]) return sizeMap[normalizedToken];
    }
    return null;
  };

  const isClearCartCommand = (value: string) => {
    const normalized = normalize(value);
    return normalized.includes("clear cart") || normalized.includes("empty cart");
  };

  const isMessyTranscript = (value: string) => {
    const normalized = normalize(value);
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length <= 2) return true;
    const hasAction =
      normalized.includes("add") ||
      normalized.includes("buy") ||
      normalized.includes("purchase") ||
      normalized.includes("size") ||
      normalized.includes("delete") ||
      normalized.includes("remove");
    const hasProductToken = products.some((product) =>
      product.aliases.some((alias) =>
        normalize(alias)
          .split(" ")
          .some((token) => tokens.includes(token))
      )
    );
    if (!hasAction || !hasProductToken) return true;
    return normalized.includes("back") || normalized.includes("smash");
  };

  const normalizeTranscript = async (value: string) => {
    try {
      const response = await fetch("/api/normalize-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: value }),
      });
      if (!response.ok) return value;
      const data = await response.json();
      return typeof data?.normalized === "string" && data.normalized
        ? data.normalized
        : value;
    } catch (error) {
      return value;
    }
  };

  const matchWithEmbeddings = async (value: string) => {
    try {
      const candidates = products.map((product) => ({
        id: product.id,
        text: `${product.name}. ${product.tag}. ${product.description}. Sizes: ${product.sizes.join(
          ", "
        )}.`,
      }));

      const response = await fetch("/api/embeddings-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value, candidates }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return typeof data?.bestId === "string" ? data.bestId : null;
    } catch (error) {
      return null;
    }
  };

  const parseCommand = (input: string): Command => {
    const normalized = normalize(input);
    const tokens = normalized.split(" ").filter(Boolean);
    const hasToken = (value: string) => tokens.includes(value);

    const matchProduct = (text: string) => {
      for (const product of products) {
        const aliases = [product.name, ...product.aliases];
        for (const alias of aliases) {
          const aliasTokens = normalize(alias).split(" ").filter(Boolean);
          if (aliasTokens.length === 0) continue;
          const allTokensPresent = aliasTokens.every((token) => text.includes(token));
          if (allTokensPresent) return product;
        }
      }
      return null;
    };
    const matchedProduct = matchProduct(normalized);
    const matchesAdd =
      normalized.includes("add to cart") ||
      normalized.includes("add to bag") ||
      hasToken("add") ||
      (hasToken("add") && (hasToken("cart") || hasToken("bag"))) ||
      hasToken("buy") ||
      hasToken("purchase") ||
      hasToken("added");
    const matchesSizeGuide =
      normalized.includes("size guide") ||
      normalized.includes("size chart") ||
      hasToken("sizing");
    const matchesDelete =
      normalized.includes("delete") ||
      normalized.includes("remove") ||
      normalized.includes("clear") ||
      (hasToken("remove") && hasToken("from") && hasToken("cart"));

    const matchedAction =
      (matchesAdd && actionCatalog.find((item) => item.action === "add_to_cart")) ||
      (matchesSizeGuide &&
        actionCatalog.find((item) => item.action === "open_size_guide")) ||
      (matchesDelete && actionCatalog.find((item) => item.action === "delete")) ||
      null;

    const action = matchedAction?.action ?? "unknown";
    const status = matchedAction?.status ?? "No matching action detected";
    const object = matchedProduct?.name ?? "Unknown item";
    const size = parseSize(input);
    const intent = matchedProduct
      ? `Targeting the ${matchedProduct.name} card${size ? ` (Size: ${size})` : ""}`
      : "Waiting for a product match";

    return {
      id: `cmd-${Date.now()}`,
      transcript: input || "Waiting for input",
      action,
      object,
      intent,
      targetId: matchedProduct?.id ?? null,
      cursor: matchedProduct?.cursor ?? { left: "50%", top: "50%" },
      status,
      size,
    };
  };

  const pushToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 1200);
  };

  const logAction = (next: ReturnType<typeof parseCommand>) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [
      {
        id: `${time}-${prev.length}`,
        time,
        action: next.action,
        object: next.object,
        status: next.status,
      },
      ...prev,
    ]);
  };

  const applyCommand = async (input: string) => {
    const cleanedInput = isMessyTranscript(input)
      ? await normalizeTranscript(input)
      : input;
    const sizeFromInput = parseSize(cleanedInput);
    const pending = pendingSizeRef.current;
    if (pending.id) {
      if (!sizeFromInput) {
        setActiveCommand((prev) => ({
          ...prev,
          transcript: cleanedInput || prev.transcript,
          status: "Size missing -- say a size (e.g., small, medium, large).",
          intent: pending.name
            ? `Targeting the ${pending.name} card (Size needed)`
            : "Waiting for size",
        }));
        pushToast("Pick a size to continue");
        return;
      }

      const product = products.find((item) => item.id === pending.id);
      if (product) {
        const inferredQuantity = extractQuantity(cleanedInput);
        const quantity =
          inferredQuantity === 1 && pending.qty ? pending.qty : inferredQuantity;
        const next: Command = {
          id: `cmd-${Date.now()}`,
          transcript: cleanedInput || "Waiting for input",
          action: "add_to_cart",
          object: product.name,
          intent: `Targeting the ${product.name} card (Size: ${sizeFromInput})`,
          targetId: product.id,
          cursor: product.cursor,
          status: "Queued click on Add to Cart",
          size: sizeFromInput,
        };
        setActiveCommand(next);
        logAction(next);
        setCartItems((prev) => {
          const existing = prev.find(
            (item) => item.name === product.name && item.size === sizeFromInput
          );
          if (existing) {
            return prev.map((item) =>
              item.name === product.name && item.size === sizeFromInput
                ? { ...item, qty: item.qty + quantity }
                : item
            );
          }
          return [
            ...prev,
            { name: product.name, price: product.price, qty: quantity, size: sizeFromInput },
          ];
        });
        setPendingSizeFor(null);
        setPendingSizeName(null);
        setPendingQuantity(null);
        pendingSizeRef.current = { id: null, name: null, qty: null };
        pushToast(`${product.name} (${sizeFromInput}) added`);
      }
      return;
    }
    if (pendingSizeFor && !sizeFromInput) {
      setActiveCommand((prev) => ({
        ...prev,
        transcript: cleanedInput || prev.transcript,
        status: "Size missing — say a size (e.g., small, medium, large).",
        intent: prev.object
          ? `Targeting the ${prev.object} card (Size needed)`
          : "Waiting for size",
      }));
      pushToast("Pick a size to continue");
      return;
    }
    if (pendingSizeFor && sizeFromInput) {
      const product = products.find((item) => item.id === pendingSizeFor);
      if (product) {
        const quantity = extractQuantity(cleanedInput);
        const next: Command = {
          id: `cmd-${Date.now()}`,
          transcript: cleanedInput || "Waiting for input",
          action: "add_to_cart",
          object: product.name,
          intent: `Targeting the ${product.name} card (Size: ${sizeFromInput})`,
          targetId: product.id,
          cursor: product.cursor,
          status: "Queued click on Add to Cart",
          size: sizeFromInput,
        };
        setActiveCommand(next);
        logAction(next);
        setCartItems((prev) => {
          const existing = prev.find(
            (item) => item.name === product.name && item.size === sizeFromInput
          );
          if (existing) {
            return prev.map((item) =>
              item.name === product.name && item.size === sizeFromInput
                ? { ...item, qty: item.qty + quantity }
                : item
            );
          }
          return [
            ...prev,
            { name: product.name, price: product.price, qty: quantity, size: sizeFromInput },
          ];
        });
        setPendingSizeFor(null);
        pushToast(`${product.name} (${sizeFromInput}) added`);
        return;
      }
    }

    let next = parseCommand(cleanedInput);
    const needsProduct = ["add_to_cart", "open_size_guide", "delete"].includes(
      next.action
    );

    if (needsProduct && !next.targetId && !isClearCartCommand(cleanedInput)) {
      const matchedId = await matchWithEmbeddings(cleanedInput);
      if (matchedId) {
        const product = products.find((item) => item.id === matchedId);
        if (product) {
          next = {
            ...next,
            targetId: product.id,
            object: product.name,
            intent: `Targeting the ${product.name} card${
              next.size ? ` (Size: ${next.size})` : ""
            }`,
            cursor: product.cursor,
          };
        }
      }
    }

    setActiveCommand(next);
    logAction(next);
    if (next.action === "add_to_cart" && next.targetId) {
      const quantity = extractQuantity(cleanedInput);
      const matchedProduct = products.find((product) => product.id === next.targetId);
      const size = next.size;
      if (!size) {
        setPendingSizeFor(next.targetId);
        setPendingSizeName(next.object);
        setPendingQuantity(quantity);
        pendingSizeRef.current = {
          id: next.targetId,
          name: next.object,
          qty: quantity,
        };
        setActiveCommand((prev) => ({
          ...prev,
          status: "Size missing — say a size (e.g., small, medium, large).",
          intent: `Targeting the ${next.object} card (Size needed)`,
        }));
        pushToast("Pick a size to continue");
        return;
      }
      setPendingSizeFor(null);
      setPendingSizeName(null);
      setPendingQuantity(null);
      pendingSizeRef.current = { id: null, name: null, qty: null };
      setCartItems((prev) => {
        const existing = prev.find(
          (item) => item.name === next.object && item.size === size
        );
        if (existing) {
          return prev.map((item) =>
            item.name === next.object && item.size === size
              ? { ...item, qty: item.qty + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            name: next.object,
            price: matchedProduct?.price ?? "$0",
            qty: quantity,
            size,
          },
        ];
      });
      pushToast(
        quantity > 1
          ? `${next.object} x${quantity} (${size}) added`
          : `${next.object} (${size}) added`
      );
    }
    if (next.action === "open_size_guide" && next.targetId) {
      pushToast(`Opening size guide for ${next.object}`);
    }
    if (next.action === "delete") {
      const quantity = extractQuantity(cleanedInput);
      if (!next.targetId) {
        setCartItems([]);
        pushToast("Cart cleared");
        return;
      }
      setCartItems((prev) => {
        const existing = next.size
          ? prev.find((item) => item.name === next.object && item.size === next.size)
          : prev.find((item) => item.name === next.object);
        if (!existing) return prev;
        if (existing.qty - quantity <= 0) {
          return prev.filter(
            (item) =>
              item.name !== next.object || (next.size ? item.size !== next.size : false)
          );
        }
        return prev.map((item) =>
          item.name === next.object && (!next.size || item.size === next.size)
            ? { ...item, qty: item.qty - quantity }
            : item
        );
      });
      pushToast(
        quantity > 1
          ? `${next.object} x${quantity} removed`
          : `${next.object} removed`
      );
    }
  };

  const updateItemQuantity = (name: string, size: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.name === name && item.size === size) {
            return { ...item, qty: Math.max(0, item.qty + delta) };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
    if (delta > 0) {
      pushToast(`${name} (${size}) added`);
    } else {
      pushToast(`${name} (${size}) removed`);
    }
  };

  const updateItemSize = (name: string, fromSize: string, toSize: string) => {
    if (fromSize === toSize) return;
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.name === name && item.size === fromSize
      );
      if (!existing) return prev;
      const target = prev.find((item) => item.name === name && item.size === toSize);
      const next = prev
        .filter((item) => !(item.name === name && item.size === fromSize))
        .map((item) =>
          item.name === name && item.size === toSize
            ? { ...item, qty: item.qty + existing.qty }
            : item
        );
      if (!target) {
        next.push({ ...existing, size: toSize });
      }
      return next;
    });
    pushToast(`${name} size updated to ${toSize}`);
  };

  const startCheckout = async () => {
    if (cartItems.length === 0) {
      pushToast("Cart is empty");
      return;
    }
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            name: `${item.name} (${item.size})`,
            price: item.price,
            qty: item.qty,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        pushToast(data?.error ?? "Checkout failed");
        return;
      }
      window.location.href = data.url as string;
    } catch (error) {
      pushToast("Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSupportError("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0]?.transcript ?? "";
      if (result.isFinal) {
        void applyCommand(transcript);
        setManualInput("");
      } else {
        setActiveCommand((prev) => ({ ...prev, transcript }));
      }
    };

    recognition.onerror = () => {
      setSupportError("Microphone error. Try manual input.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [actionCatalog]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    setSupportError(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const runManual = () => {
    if (!manualInput.trim()) return;
    void applyCommand(manualInput.trim());
    setManualInput("");
  };

  return (
    <section className="bg-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
              Multimodal Accessibility Navigator Demo
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Voice, vision, and intent working together
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/70">
              Use the preset voice commands to watch the cursor snap, the target
              highlight, and the intent summary update in real time. This is the
              exact flow you will demo live.
            </p>
          </div>
          <a
            href="/"
            className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/70 transition hover:border-white/50 hover:text-white"
          >
            Back to home
          </a>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141022] via-black to-black p-6 shadow-[0_0_60px_rgba(99,52,173,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Live Site Mock</h2>
                <p className="mt-1 text-sm text-white/60">
                  Gesture cursor snaps to the closest interactive product card.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {commandPresets.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      void applyCommand(item.transcript);
                    }}
                    className={
                      item.id === activeCommand.id
                        ? "rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                        : "rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-white/40 hover:text-white"
                    }
                  >
                    Command {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-8 rounded-3xl border border-white/10 bg-black/40 p-6">
              <div
                className="pointer-events-none absolute left-0 top-0 h-full w-full"
                aria-hidden="true"
              >
                <div
                  className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/60 bg-emerald-400/40 shadow-[0_0_25px_rgba(52,211,153,0.8)]"
                  style={{ left: activeCommand.cursor.left, top: activeCommand.cursor.top }}
                />
                <div
                  className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/30"
                  style={{ left: activeCommand.cursor.left, top: activeCommand.cursor.top }}
                />
              </div>

                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => {
                      const isActive = product.id === activeCommand.targetId;
                      const isInCart = cartItems.some((item) => item.name === product.name);
                      return (
                        <div
                          key={product.id}
                        className={
                          isActive
                            ? "rounded-2xl border border-emerald-300/50 bg-gradient-to-br from-emerald-500/10 via-black to-black p-4 shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                            : "rounded-2xl border border-white/10 bg-white/5 p-4"
                        }
                      >
                        <div className={`rounded-xl bg-gradient-to-br ${product.gradient} p-4`}>
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
                              {product.tag}
                            </span>
                            <span className="text-sm font-semibold">{product.price}</span>
                          </div>
                          <h3 className="mt-4 text-lg font-semibold">{product.name}</h3>
                          <p className="mt-2 text-xs text-white/60">{product.description}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/60">
                          {product.sizes.map((size) => {
                            const isSelected = selectedSizes[product.id] === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() =>
                                  setSelectedSizes((prev) => ({
                                    ...prev,
                                    [product.id]: size,
                                  }))
                                }
                                className={
                                  isSelected
                                    ? "rounded-full border border-emerald-300/60 bg-emerald-400/20 px-2 py-0.5 text-emerald-100"
                                    : "rounded-full border border-white/10 px-2 py-0.5 text-white/50 hover:border-white/30 hover:text-white/80"
                                }
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                          <span>{isInCart ? "Added to cart" : ""}</span>
                          <button
                            onClick={() => {
                              const selectedSize = selectedSizes[product.id];
                              if (!selectedSize) {
                                pushToast("Select a size to add");
                                return;
                              }
                              void applyCommand(
                                `add to cart ${product.name} size ${selectedSize}`
                              );
                            }}
                            className={
                              isActive
                                ? "rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black"
                                : isInCart
                                  ? "rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
                                  : "rounded-full border border-white/20 px-3 py-1"
                            }
                          >
                            {isInCart ? "Added" : "Add to Cart"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/80 p-5 text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Cart</h4>
                    <button
                      onClick={() => setIsCartOpen((prev) => !prev)}
                      className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                    >
                      {isCartOpen ? "Hide" : "Show"}
                    </button>
                  </div>
                  {isCartOpen ? (
                    <div className="mt-4 space-y-2 text-xs text-white/70">
                      {cartItems.length === 0 ? (
                        <p className="text-white/40">Cart is empty.</p>
                      ) : (
                        <>
                          {cartItems.map((item) => {
                            const lineTotal = parsePrice(item.price) * item.qty;
                            return (
                              <div
                                key={`${item.name}-${item.size}`}
                                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1">
                                      {(
                                        products.find((product) => product.name === item.name)
                                          ?.sizes ?? [item.size]
                                      ).map((size) => {
                                        const isSelected = size === item.size;
                                        return (
                                          <button
                                            key={`${item.name}-${size}`}
                                            type="button"
                                            onClick={() =>
                                              updateItemSize(item.name, item.size, size)
                                            }
                                            className={
                                              isSelected
                                                ? "rounded-full border border-emerald-300/60 bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-100"
                                                : "rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/50 hover:border-white/30 hover:text-white/80"
                                            }
                                          >
                                            {size}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1">
                                      <button
                                        onClick={() =>
                                          updateItemQuantity(item.name, item.size, -1)
                                        }
                                        className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                                      >
                                        -
                                      </button>
                                      <span className="min-w-[18px] text-center text-[11px] text-white/70">
                                        {item.qty}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateItemQuantity(item.name, item.size, 1)
                                        }
                                        className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                                  <span>{item.price}</span>
                                  <span>${lineTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div className="mt-3 flex items-center justify-between text-sm font-semibold text-white">
                            <span>Total</span>
                            <span>
                              $
                              {cartItems
                                .reduce(
                                  (sum, item) =>
                                    sum + parsePrice(item.price) * item.qty,
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={startCheckout}
                            disabled={isCheckingOut}
                            className={
                              isCheckingOut
                                ? "mt-3 w-full rounded-full bg-emerald-400/60 px-4 py-2 text-xs font-semibold text-black/70"
                                : "mt-3 w-full rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-300"
                            }
                          >
                            {isCheckingOut ? "Redirecting..." : "Checkout"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Voice Command Console</h2>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {isListening ? "Listening" : "Idle"}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                  Keywords
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    Add: add, add to cart, add to bag, buy, purchase
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    Size: size guide, size chart, sizing
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    Delete: delete, remove, clear
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">
                  Tip: include the product name in the phrase.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={
                    isListening
                      ? "rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black"
                      : "rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 transition hover:border-white/40 hover:text-white"
                  }
                >
                  {isListening ? "Stop mic" : "Start mic"}
                </button>
                <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                  <input
                    value={manualInput}
                    onChange={(event) => setManualInput(event.target.value)}
                    placeholder="Type a command if mic is blocked"
                    className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <button
                    onClick={runManual}
                    className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    Run
                  </button>
                </div>
              </div>
              {supportError ? (
                <p className="mt-3 text-xs text-amber-300">{supportError}</p>
              ) : null}
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Heard</p>
                  <p className="mt-2 text-lg font-medium">"{activeCommand.transcript}"</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Parsed Intent</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Action: {activeCommand.action}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Object: {activeCommand.object}
                    </span>
                    {activeCommand.size ? (
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        Size: {activeCommand.size}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200">Next Step</p>
                  <p className="mt-2 text-sm text-white/80">{activeCommand.status}</p>
                </div>
              </div>
              <p className="mt-5 text-sm text-white/60">{activeCommand.intent}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1c0f2e] via-black to-black p-6">
              <h3 className="text-lg font-semibold">Presenter Script</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li>
                  1. Move your head to show the cursor snap on the highlighted card.
                </li>
                <li>
                  2. Trigger a preset voice command and show the parsed intent.
                </li>
                <li>
                  3. Explain how the DOM searcher selects the exact Add to Cart button.
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Action Log</h3>
                <button
                  onClick={() => setLogs([])}
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4 space-y-2 text-xs text-white/70">
                {logs.length === 0 ? (
                  <p className="text-white/40">No actions yet.</p>
                ) : (
                  logs.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/40">
                        <span>{entry.time}</span>
                        <span>{entry.action}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/80">{entry.object}</p>
                      <p className="mt-1 text-xs text-white/50">{entry.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`pointer-events-none fixed inset-x-0 top-6 z-40 mx-auto flex w-full max-w-md justify-center px-4 transition ${
          showToast ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <div className="pointer-events-auto rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 shadow-[0_0_25px_rgba(52,211,153,0.35)]">
          {toastMessage}
        </div>
      </div>
    </section>
  );
};

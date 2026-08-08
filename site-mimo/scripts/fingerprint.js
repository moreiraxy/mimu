/**
 * Section fingerprint — the shared measurement used to prove the clone is 1:1.
 *
 * The two DOM trees do not match node for node (Framer emits wrapper divs we
 * don't), so comparing structure is useless. Instead this reduces a section to
 * things that are true of *any* correct implementation: where every piece of
 * text and every image lands, and how it is styled. Positions are normalised
 * against the section box so a section that starts at a different scroll
 * offset still compares cleanly.
 *
 * Paste the body of `fingerprintSection` into evaluate_script on both pages.
 */
globalThis.fingerprintSection = (selector) => {
  const sec = document.querySelector(selector);
  if (!sec) return { error: `not found: ${selector}` };

  const secRect = sec.getBoundingClientRect();
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0")
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // Position as a percentage of the section box, rounded to 0.1% so
  // sub-pixel noise doesn't register as a difference.
  const rel = (r) => ({
    x: +(((r.x - secRect.x) / secRect.width) * 100).toFixed(1),
    y: +(((r.y - secRect.y) / secRect.height) * 100).toFixed(1),
    w: +((r.width / secRect.width) * 100).toFixed(1),
    h: +((r.height / secRect.height) * 100).toFixed(1),
  });

  const texts = [];
  const seenText = new Set();
  for (const el of sec.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,li,button,span")) {
    if (!visible(el)) continue;
    // Only leaf-ish nodes: skip wrappers that merely echo a child's text.
    const t = el.textContent.trim().replace(/\s+/g, " ");
    if (!t || t.length > 120) continue;
    if ([...el.children].some((c) => c.textContent.trim() === el.textContent.trim()))
      continue;
    const key = t.toLowerCase();
    if (seenText.has(key)) continue;
    seenText.add(key);

    const s = getComputedStyle(el);
    texts.push({
      text: t.slice(0, 60),
      pos: rel(el.getBoundingClientRect()),
      size: s.fontSize,
      weight: s.fontWeight,
      lh: s.lineHeight,
      ls: s.letterSpacing,
      color: s.color,
      family: s.fontFamily.split(",")[0].replace(/["']/g, ""),
      align: s.textAlign,
    });
  }

  const images = [];
  for (const el of sec.querySelectorAll("img")) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    images.push({
      file: (el.currentSrc || el.src).split("/").pop().split("?")[0],
      pos: rel(el.getBoundingClientRect()),
      radius: s.borderRadius,
      fit: s.objectFit,
    });
  }

  // Any box carrying a visible surface: background, border, radius or blur.
  const surfaces = [];
  for (const el of sec.querySelectorAll("*")) {
    if (el.tagName === "IMG" || !visible(el)) continue;
    const s = getComputedStyle(el);
    const hasBg =
      s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.backgroundImage !== "none";
    const hasEdge = s.borderRadius !== "0px" || s.borderWidth !== "0px";
    const hasBlur = s.backdropFilter !== "none";
    if (!hasBg && !hasEdge && !hasBlur) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 10) continue;
    surfaces.push({
      pos: rel(r),
      bg: s.backgroundColor,
      bgImage: s.backgroundImage === "none" ? null : s.backgroundImage.slice(0, 60),
      radius: s.borderRadius,
      blur: s.backdropFilter === "none" ? null : s.backdropFilter,
      opacity: s.opacity,
    });
  }

  return {
    selector,
    section: { w: Math.round(secRect.width), h: Math.round(secRect.height) },
    padding: getComputedStyle(sec).padding,
    bg: getComputedStyle(sec).backgroundColor,
    texts,
    images,
    surfaces,
  };
};

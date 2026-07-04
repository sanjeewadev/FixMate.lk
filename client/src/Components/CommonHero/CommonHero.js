export const commonHeroDefaults = {
  id: "hero",
  eyebrow: "FixMate.lk",
  panelLabel: "Platform summary",
  panelTitle: "Fast service access",
  searchPlaceholder: "Search...",
  searchAriaLabel: "Search",
};

export const commonHeroAnimationItems = {
  badgesDelayStart: 520,
  statsDelayStart: 680,
};

export const isExternalUrl = (value = "") => {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  );
};

export const getHeroActionTarget = (action) => {
  if (!action) return null;

  return {
    label: action.label || "Learn more",
    to: action.to || action.href || "#",
    isExternal: Boolean(action.href) || isExternalUrl(action.to),
    onClick: action.onClick,
  };
};

export const getHeroSearchConfig = (search) => {
  if (!search) return null;

  return {
    placeholder: search.placeholder || commonHeroDefaults.searchPlaceholder,
    value: search.value ?? "",
    onChange: search.onChange,
    onSubmit: search.onSubmit,
    buttonText: search.buttonText,
    ariaLabel: search.ariaLabel || commonHeroDefaults.searchAriaLabel,
  };
};

export const getCommonHeroClassName = ({
  stats = [],
  search,
  className = "",
}) => {
  const classes = ["fm-common-hero"];

  if (!stats.length) classes.push("fm-common-hero--single");
  if (search) classes.push("fm-common-hero--withSearch");
  if (className) classes.push(className);

  return classes.join(" ");
};

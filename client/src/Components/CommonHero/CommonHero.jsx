import React from "react";
import { Link } from "react-router-dom";

import {
  commonHeroDefaults,
  getCommonHeroClassName,
  getHeroActionTarget,
  getHeroSearchConfig,
} from "./CommonHero.js";

import "./CommonHero.css";

export default function CommonHero({
  id = commonHeroDefaults.id,
  eyebrow = commonHeroDefaults.eyebrow,
  title,
  highlight,
  subtitle,
  badges = [],
  primaryAction,
  secondaryAction,
  search,
  stats = [],
  panelLabel = commonHeroDefaults.panelLabel,
  panelTitle = commonHeroDefaults.panelTitle,
  className = "",
}) {
  const primary = getHeroActionTarget(primaryAction);
  const secondary = getHeroActionTarget(secondaryAction);
  const searchConfig = getHeroSearchConfig(search);

  const renderAction = (action, type) => {
    if (!action) return null;

    const buttonClass = `fm-common-hero__button fm-common-hero__button--${type}`;

    if (action.isExternal) {
      return (
        <a
          href={action.to}
          className={buttonClass}
          onClick={action.onClick}
          target={action.to.startsWith("http") ? "_blank" : undefined}
          rel={action.to.startsWith("http") ? "noreferrer" : undefined}>
          {action.label}
          <span aria-hidden="true">→</span>
        </a>
      );
    }

    return (
      <Link to={action.to} className={buttonClass} onClick={action.onClick}>
        {action.label}
        <span aria-hidden="true">→</span>
      </Link>
    );
  };

  return (
    <section
      id={id}
      className={getCommonHeroClassName({
        stats,
        search: searchConfig,
        className,
      })}
      aria-labelledby={`${id}-title`}>
      <div className="fm-common-hero__ambient fm-common-hero__ambient--one" />
      <div className="fm-common-hero__ambient fm-common-hero__ambient--two" />

      <div className="fm-common-hero__container">
        <div className="fm-common-hero__content">
          {eyebrow ? (
            <span className="fm-common-hero__eyebrow">{eyebrow}</span>
          ) : null}

          <h1 id={`${id}-title`} className="fm-common-hero__title">
            {title}{" "}
            {highlight ? (
              <span className="fm-common-hero__highlight">{highlight}</span>
            ) : null}
          </h1>

          {subtitle ? (
            <p className="fm-common-hero__subtitle">{subtitle}</p>
          ) : null}

          {searchConfig ? (
            <div className="fm-common-hero__searchWrap">
              <input
                className="fm-common-hero__searchInput"
                type="search"
                placeholder={searchConfig.placeholder}
                value={searchConfig.value}
                onChange={searchConfig.onChange}
                aria-label={searchConfig.ariaLabel}
              />

              {searchConfig.buttonText ? (
                <button
                  type="button"
                  className="fm-common-hero__searchButton"
                  onClick={searchConfig.onSubmit}>
                  {searchConfig.buttonText}
                </button>
              ) : null}
            </div>
          ) : null}

          {badges.length > 0 ? (
            <div className="fm-common-hero__badges">
              {badges.map((badge, index) => (
                <span
                  className="fm-common-hero__badge"
                  key={badge}
                  style={{ "--hero-badge-delay": `${520 + index * 80}ms` }}>
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {primary || secondary ? (
            <div className="fm-common-hero__actions">
              {renderAction(primary, "primary")}
              {renderAction(secondary, "secondary")}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <aside className="fm-common-hero__panel" aria-label="Page highlights">
            <div className="fm-common-hero__panelTop">
              <span className="fm-common-hero__panelLabel">{panelLabel}</span>
              <strong className="fm-common-hero__panelTitle">
                {panelTitle}
              </strong>
            </div>

            <div className="fm-common-hero__stats">
              {stats.map((item, index) => (
                <div
                  className="fm-common-hero__stat"
                  key={item.label}
                  style={{ "--hero-stat-delay": `${680 + index * 90}ms` }}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

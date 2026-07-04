import React from "react";
import { Link } from "react-router-dom";

import {
  aboutSectionContent,
  aboutSectionFlow,
  aboutSectionHighlights,
  aboutSectionImage,
  aboutSectionPreviewRows,
  aboutSectionStats,
} from "./AboutSection.js";

import "./AboutSection.css";

export default function AboutSection() {
  return (
    <section
      className="fm-about-showcase"
      aria-labelledby="fm-about-showcase-title">
      <div className="fm-about-showcase__container">
        <div className="fm-about-showcase__header">
          <span className="fm-about-showcase__eyebrow">
            {aboutSectionContent.eyebrow}
          </span>

          <h2 id="fm-about-showcase-title" className="fm-about-showcase__title">
            {aboutSectionContent.title}
          </h2>

          <p className="fm-about-showcase__subtitle">
            {aboutSectionContent.subtitle}
          </p>
        </div>

        <div className="fm-about-showcase__mainGrid">
          <div className="fm-about-showcase__visualPanel">
            <div className="fm-about-showcase__visualTop">
              <span>{aboutSectionContent.visualEyebrow}</span>
              <strong>{aboutSectionContent.visualTitle}</strong>
            </div>

            <div className="fm-about-showcase__imageWrap">
              <div
                className="fm-about-showcase__imageGlow"
                aria-hidden="true"
              />

              <img
                src={aboutSectionImage}
                alt="FixMate technician ready for service work"
                loading="lazy"
              />
            </div>

            <div className="fm-about-showcase__miniStats">
              {aboutSectionStats.map((item) => (
                <div className="fm-about-showcase__miniStat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <article className="fm-about-showcase__contentPanel">
            <span className="fm-about-showcase__panelEyebrow">
              {aboutSectionContent.panelEyebrow}
            </span>

            <h3>{aboutSectionContent.panelTitle}</h3>

            <p>{aboutSectionContent.panelText}</p>

            <div className="fm-about-showcase__highlightGrid">
              {aboutSectionHighlights.map((item) => (
                <div
                  className="fm-about-showcase__highlightCard"
                  key={item.title}>
                  <span aria-hidden="true">✓</span>

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="fm-about-showcase__actions">
              <Link
                to={aboutSectionContent.primaryAction.to}
                className="fm-about-showcase__button fm-about-showcase__button--primary">
                {aboutSectionContent.primaryAction.label}
              </Link>

              <Link
                to={aboutSectionContent.secondaryAction.to}
                className="fm-about-showcase__button fm-about-showcase__button--secondary">
                {aboutSectionContent.secondaryAction.label}
              </Link>
            </div>
          </article>
        </div>

        <div className="fm-about-showcase__bottomGrid">
          <article className="fm-about-showcase__previewPanel">
            <div className="fm-about-showcase__previewHeader">
              <div>
                <span>{aboutSectionContent.previewEyebrow}</span>
                <strong>{aboutSectionContent.previewTitle}</strong>
              </div>

              <em>{aboutSectionContent.previewStatus}</em>
            </div>

            <div className="fm-about-showcase__previewRows">
              {aboutSectionPreviewRows.map((row) => (
                <div className="fm-about-showcase__previewRow" key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="fm-about-showcase__flowPanel">
            <span className="fm-about-showcase__flowEyebrow">
              {aboutSectionContent.flowEyebrow}
            </span>

            <h3>{aboutSectionContent.flowTitle}</h3>

            <div className="fm-about-showcase__flowList">
              {aboutSectionFlow.map((item) => (
                <div className="fm-about-showcase__flowItem" key={item.step}>
                  <span>{item.step}</span>

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

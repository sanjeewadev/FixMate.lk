import React from "react";
import { NavLink } from "react-router-dom";

import Navbar from "../../Components/Navbar/Navbar.jsx";
import Footer from "../../Components/Footer/footer.jsx";
import TeamCards from "../../Components/TeamCards/TeamCards.jsx";
import CommonHero from "../../Components/CommonHero/CommonHero.jsx";

import {
  aboutCta,
  aboutExperience,
  aboutIntroContent,
  aboutPageHero,
  aboutProcessContent,
  aboutProcessSteps,
  aboutStats,
  aboutStoryCards,
  aboutTeamContent,
  aboutValues,
  aboutValuesContent,
} from "./AboutUs.js";

import "./AboutUs.css";

export default function AboutUs() {
  return (
    <div className="fm-about-page">
      <Navbar />

      <CommonHero
        id="hero"
        eyebrow={aboutPageHero.eyebrow}
        title={aboutPageHero.title}
        highlight={aboutPageHero.highlight}
        subtitle={aboutPageHero.subtitle}
        badges={aboutPageHero.badges}
        stats={aboutPageHero.stats}
        panelLabel="Platform summary"
        panelTitle="Fast service access"
      />

      <main className="fm-about-page__main">
        <section className="fm-about-page__intro">
          <div className="fm-about-page__container">
            <div className="fm-about-page__sectionHeader">
              <span className="fm-about-page__eyebrow">
                {aboutIntroContent.eyebrow}
              </span>

              <h2>{aboutIntroContent.title}</h2>

              <p>{aboutIntroContent.subtitle}</p>
            </div>

            <div className="fm-about-page__storyLayout">
              <article className="fm-about-page__storyFeature">
                <span className="fm-about-page__darkEyebrow">
                  {aboutIntroContent.featureEyebrow}
                </span>

                <h3>{aboutIntroContent.featureTitle}</h3>

                <p>{aboutIntroContent.featureText}</p>

                <div className="fm-about-page__featureList">
                  {aboutIntroContent.featurePoints.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>

              <div className="fm-about-page__storyGrid">
                {aboutStoryCards.map((item) => (
                  <article
                    className="fm-about-page__storyCard"
                    key={item.title}>
                    <span className="fm-about-page__cardNumber">
                      {item.number}
                    </span>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="fm-about-page__experience">
          <div className="fm-about-page__container">
            <div className="fm-about-page__experiencePanel">
              <div className="fm-about-page__experienceContent">
                <span className="fm-about-page__darkEyebrow">
                  {aboutExperience.eyebrow}
                </span>

                <h2>{aboutExperience.title}</h2>

                <p>{aboutExperience.text}</p>

                <div className="fm-about-page__actions">
                  <NavLink
                    to={aboutExperience.primaryAction.to}
                    className="fm-about-page__button fm-about-page__button--primary">
                    {aboutExperience.primaryAction.label}
                  </NavLink>

                  <NavLink
                    to={aboutExperience.secondaryAction.to}
                    className="fm-about-page__button fm-about-page__button--secondary">
                    {aboutExperience.secondaryAction.label}
                  </NavLink>
                </div>
              </div>

              <div
                className="fm-about-page__statStack"
                aria-label="FixMate platform highlights">
                {aboutStats.map((item) => (
                  <article className="fm-about-page__statCard" key={item.label}>
                    <div>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>

                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="fm-about-page__values">
          <div className="fm-about-page__container">
            <div className="fm-about-page__sectionHeader">
              <span className="fm-about-page__eyebrow">
                {aboutValuesContent.eyebrow}
              </span>

              <h2>{aboutValuesContent.title}</h2>

              <p>{aboutValuesContent.subtitle}</p>
            </div>

            <div className="fm-about-page__valueGrid">
              {aboutValues.map((value) => (
                <article className="fm-about-page__valueCard" key={value.title}>
                  <span className="fm-about-page__tick" aria-hidden="true">
                    ✓
                  </span>

                  <h3>{value.title}</h3>

                  <p>{value.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="fm-about-page__process">
          <div className="fm-about-page__container">
            <div className="fm-about-page__processPanel">
              <div className="fm-about-page__processHeader">
                <span className="fm-about-page__darkEyebrow">
                  {aboutProcessContent.eyebrow}
                </span>

                <h2>{aboutProcessContent.title}</h2>

                <p>{aboutProcessContent.subtitle}</p>
              </div>

              <div className="fm-about-page__processGrid">
                {aboutProcessSteps.map((item) => (
                  <article
                    className="fm-about-page__processCard"
                    key={item.step}>
                    <span>{item.step}</span>

                    <h3>{item.title}</h3>

                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="fm-about-page__team">
          <div className="fm-about-page__container">
            <div className="fm-about-page__sectionHeader">
              <span className="fm-about-page__eyebrow">
                {aboutTeamContent.eyebrow}
              </span>

              <h2>{aboutTeamContent.title}</h2>

              <p>{aboutTeamContent.subtitle}</p>
            </div>

            <div className="fm-about-page__teamPanel">
              <TeamCards />
            </div>
          </div>
        </section>

        <section className="fm-about-page__cta">
          <div className="fm-about-page__container">
            <div className="fm-about-page__ctaInner">
              <div>
                <span>{aboutCta.eyebrow}</span>

                <h2>{aboutCta.title}</h2>

                <p>{aboutCta.text}</p>
              </div>

              <div className="fm-about-page__ctaActions">
                <NavLink
                  to={aboutCta.primaryTo}
                  className="fm-about-page__ctaButton">
                  {aboutCta.primaryLabel}
                </NavLink>

                <a
                  href={aboutCta.secondaryHref}
                  className="fm-about-page__ctaButtonSecondary">
                  {aboutCta.secondaryLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="dark" />
    </div>
  );
}

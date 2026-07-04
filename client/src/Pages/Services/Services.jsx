import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

import Navbar from "../../Components/Navbar/Navbar.jsx";
import Footer from "../../Components/Footer/footer.jsx";
import CommonHero from "../../Components/CommonHero/CommonHero.jsx";

import {
  buildServiceCategoryOptions,
  filterServices,
  getActiveCategoryLabel,
  getServiceBookingPath,
  getServiceCategoryName,
  getServiceDescription,
  getServiceImage,
  loadServicesForPage,
  normalizeServiceText,
  SERVICES_PAGE_FALLBACK_IMAGE,
  servicesPageContent,
  sortOptions,
} from "./Services.js";

import "./Services.css";

export default function Services() {
  const { isAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("cat") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "recommended",
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await loadServicesForPage();

        if (!cancelled) {
          setServices(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load services.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    return buildServiceCategoryOptions(services);
  }, [services]);

  const filteredServices = useMemo(() => {
    return filterServices({
      services,
      searchTerm,
      selectedCategory,
      sortBy,
    });
  }, [services, searchTerm, selectedCategory, sortBy]);

  const activeCategoryLabel = useMemo(() => {
    return getActiveCategoryLabel(categoryOptions, selectedCategory);
  }, [categoryOptions, selectedCategory]);

  const updateUrlParams = (nextValues) => {
    const nextSearch = nextValues.searchTerm ?? searchTerm;
    const nextCategory = nextValues.selectedCategory ?? selectedCategory;
    const nextSort = nextValues.sortBy ?? sortBy;

    const params = {};

    if (nextSearch.trim()) params.q = nextSearch.trim();
    if (nextCategory !== "all") params.cat = normalizeServiceText(nextCategory);
    if (nextSort !== "recommended") params.sort = nextSort;

    setSearchParams(params);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateUrlParams({ searchTerm: value });
  };

  const handleCategoryChange = (categoryValue) => {
    setSelectedCategory(categoryValue);
    updateUrlParams({ selectedCategory: categoryValue });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    updateUrlParams({ sortBy: value });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("recommended");
    setSearchParams({});
  };

  const handleImageError = (e) => {
    if (e.currentTarget.src.includes(SERVICES_PAGE_FALLBACK_IMAGE)) return;
    e.currentTarget.src = SERVICES_PAGE_FALLBACK_IMAGE;
  };

  const handleBookClick = (e) => {
    if (!isAuth) {
      e.preventDefault();
      window.dispatchEvent(new Event("fm:open-login"));
    }
  };

  const hasActiveFilters =
    searchTerm.trim() || selectedCategory !== "all" || sortBy !== "recommended";

  return (
    <div className="fm-services-page">
      <Navbar />

      <CommonHero
        id="hero"
        eyebrow={servicesPageContent.hero.eyebrow}
        title={servicesPageContent.hero.title}
        highlight={servicesPageContent.hero.highlight}
        subtitle={servicesPageContent.hero.subtitle}
        badges={servicesPageContent.hero.badges}
        search={{
          value: searchTerm,
          onChange: (e) => handleSearchChange(e.target.value),
          placeholder: servicesPageContent.filter.searchPlaceholder,
          buttonText: "Search",
          onSubmit: () => {},
          ariaLabel: "Search FixMate services",
        }}
        stats={servicesPageContent.hero.stats}
        panelLabel="Service summary"
        panelTitle="Fast service access"
      />

      <main className="fm-services-page__main">
        <section className="fm-services-page__container">
          <div className="fm-services-page__topbar">
            <div>
              <span className="fm-services-page__eyebrow">
                {servicesPageContent.browse.eyebrow}
              </span>

              <h2 className="fm-services-page__title">
                {servicesPageContent.browse.title}
              </h2>

              <p className="fm-services-page__subtitle">
                {servicesPageContent.browse.subtitle}
              </p>
            </div>

            <div className="fm-services-page__resultBox">
              <strong>{filteredServices.length}</strong>
              <span>
                {filteredServices.length === 1
                  ? "service found"
                  : "services found"}
              </span>
            </div>
          </div>

          <section
            className="fm-services-page__filterPanel"
            aria-label="Service filters">
            <div className="fm-services-page__filterHeader">
              <div>
                <span>Advanced filter</span>
                <strong>Find the right service faster.</strong>
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="fm-services-page__clearButton"
                  onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="fm-services-page__filterGrid">
              <div className="fm-services-page__field fm-services-page__field--wide">
                <label htmlFor="fm-services-search">
                  {servicesPageContent.filter.searchLabel}
                </label>

                <input
                  id="fm-services-search"
                  type="search"
                  placeholder={servicesPageContent.filter.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <div className="fm-services-page__field">
                <label htmlFor="fm-services-category">
                  {servicesPageContent.filter.categoryLabel}
                </label>

                <select
                  id="fm-services-category"
                  value={normalizeServiceText(selectedCategory)}
                  onChange={(e) => handleCategoryChange(e.target.value)}>
                  {categoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fm-services-page__field">
                <label htmlFor="fm-services-sort">
                  {servicesPageContent.filter.sortLabel}
                </label>

                <select
                  id="fm-services-sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fm-services-page__activeLine">
              <span>Showing:</span>
              <strong>{activeCategoryLabel}</strong>

              {searchTerm.trim() ? (
                <em>Search: “{searchTerm.trim()}”</em>
              ) : null}
            </div>
          </section>

          <div className="fm-services-page__categoryWrap">
            {categoryOptions.map((category) => {
              const active =
                selectedCategory === "all"
                  ? category.value === "all"
                  : normalizeServiceText(selectedCategory) === category.value;

              return (
                <button
                  key={category.value}
                  type="button"
                  className={`fm-services-page__categoryChip ${
                    active ? "fm-services-page__categoryChip--active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category.value)}>
                  {category.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div
              className="fm-services-page__grid"
              aria-label="Loading services">
              {Array.from({ length: 9 }).map((_, index) => (
                <div className="fm-services-page__skeletonCard" key={index}>
                  <div className="fm-services-page__skeletonImage" />
                  <div className="fm-services-page__skeletonLine" />
                  <div className="fm-services-page__skeletonLine fm-services-page__skeletonLine--short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="fm-services-page__state fm-services-page__state--error">
              <strong>Services could not be loaded.</strong>
              <span>{error}</span>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="fm-services-page__state">
              <strong>No services found.</strong>
              <span>
                Try another search term or clear the selected filters.
              </span>

              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="fm-services-page__grid">
              {filteredServices.map((service, index) => (
                <article
                  className="fm-services-page__card"
                  key={service.slug || service._id || service.name}>
                  <div className="fm-services-page__imageWrap">
                    <img
                      src={getServiceImage(service)}
                      alt={service.name || "FixMate service"}
                      onError={handleImageError}
                      loading="lazy"
                    />

                    <div className="fm-services-page__imageShade" />

                    <span className="fm-services-page__cardCategory">
                      {getServiceCategoryName(service)}
                    </span>

                    {index < 3 ? (
                      <span className="fm-services-page__popularBadge">
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="fm-services-page__cardBody">
                    <h3>{service.name || "FixMate Service"}</h3>

                    <p>{getServiceDescription(service)}</p>

                    <div className="fm-services-page__cardMeta">
                      <span>Verified technician</span>
                      <span>Fast request</span>
                    </div>

                    <div className="fm-services-page__cardActions">
                      <NavLink
                        to={getServiceBookingPath(service)}
                        className="fm-services-page__bookButton"
                        onClick={handleBookClick}>
                        Book Service
                        <span aria-hidden="true">→</span>
                      </NavLink>

                      <NavLink
                        to={getServiceBookingPath(service)}
                        className="fm-services-page__detailsLink">
                        View details
                      </NavLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="fm-services-page__helpStrip">
          <div className="fm-services-page__helpContainer">
            <div className="fm-services-page__helpIntro">
              <span>{servicesPageContent.support.eyebrow}</span>
              <h2>{servicesPageContent.support.title}</h2>
            </div>

            <div className="fm-services-page__steps">
              {servicesPageContent.support.steps.map((item) => (
                <article className="fm-services-page__step" key={item.step}>
                  <strong>{item.step}</strong>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="fm-services-page__cta">
          <div>
            <span>{servicesPageContent.cta.eyebrow}</span>
            <h2>{servicesPageContent.cta.title}</h2>
            <p>{servicesPageContent.cta.text}</p>
          </div>

          <a
            href={servicesPageContent.cta.href}
            className="fm-services-page__ctaButton">
            {servicesPageContent.cta.label}
          </a>
        </section>
      </main>

      <Footer variant="dark" />
    </div>
  );
}

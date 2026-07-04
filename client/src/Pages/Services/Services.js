import api from "../../lib/api";

export const SERVICES_PAGE_FALLBACK_IMAGE = "/assets/default.jpg";

export const servicesPageContent = {
  hero: {
    eyebrow: "FixMate Services",
    title: "Find the right technician for your",
    highlight: "service job.",
    subtitle:
      "Browse verified FixMate services for homes, offices and apartments. Search by repair type, filter by category and send a service request in a few steps.",
    badges: [
      "Verified technicians",
      "Fast requests",
      "Home and office support",
    ],
    stats: [
      { value: "24/7", label: "Service access" },
      { value: "4.8", label: "Target rating" },
      { value: "8+", label: "Service categories" },
    ],
  },

  browse: {
    eyebrow: "Service directory",
    title: "Choose a service and book with confidence.",
    subtitle:
      "Use the filters to find the right repair, cleaning, AC, electrical, plumbing or maintenance service for your request.",
  },

  filter: {
    searchLabel: "Search services",
    searchPlaceholder: "Search AC repair, plumbing, electrical, cleaning...",
    categoryLabel: "Category",
    sortLabel: "Sort by",
  },

  support: {
    eyebrow: "How booking works",
    title: "A simple request flow for every service.",
    steps: [
      {
        step: "01",
        title: "Choose service",
        text: "Select the repair, cleaning or maintenance service you need.",
      },
      {
        step: "02",
        title: "Send details",
        text: "Add your location, contact number and preferred visit time.",
      },
      {
        step: "03",
        title: "Track progress",
        text: "Follow the request status and keep the service history organized.",
      },
    ],
  },

  cta: {
    eyebrow: "Not sure what to choose?",
    title: "Tell us the issue and FixMate will guide you.",
    text: "Share your repair problem, location and preferred time. We can help you choose the best service category.",
    label: "Contact FixMate",
    href: "/#contact",
  },
};

export const fallbackCategories = [
  "Handyman",
  "Electrical",
  "Plumbing",
  "AC Repair",
  "Cleaning",
  "Painting",
  "Appliances",
  "Pest Control",
  "Security & CCTV",
];

export const sortOptions = [
  { label: "Recommended", value: "recommended" },
  { label: "Name A-Z", value: "az" },
  { label: "Newest first", value: "newest" },
];

export const normalizeServiceText = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const getServiceCategoryName = (service) => {
  const category = service?.category;

  if (!category) return "General Service";
  if (typeof category === "string") return category;
  if (category?.name) return category.name;
  if (category?.title) return category.title;

  return "General Service";
};

export const getServiceImage = (service) => {
  return service?.serviceImages?.[0]?.url || SERVICES_PAGE_FALLBACK_IMAGE;
};

export const getServiceDescription = (service, limit = 120) => {
  const text =
    service?.description ||
    `${getServiceCategoryName(service)} handled by verified FixMate technicians.`;

  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

export const getServiceBookingPath = (service) => {
  if (service?._id) return `/book?serviceId=${service._id}`;
  if (service?.slug) return `/book?slug=${encodeURIComponent(service.slug)}`;
  return "/book";
};

export const loadServicesForPage = async () => {
  const { data } = await api.get("/api/services?page=1&limit=120");

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
};

export const buildServiceCategoryOptions = (services) => {
  const apiCategories = services
    .map((service) => getServiceCategoryName(service))
    .filter(Boolean);

  const uniqueCategories = Array.from(new Set(apiCategories));
  const sourceCategories =
    uniqueCategories.length > 0 ? uniqueCategories : fallbackCategories;

  return [
    { label: "All services", value: "all" },
    ...sourceCategories.slice(0, 12).map((category) => ({
      label: category,
      value: normalizeServiceText(category),
    })),
  ];
};

export const filterServices = ({
  services,
  searchTerm,
  selectedCategory,
  sortBy,
}) => {
  const search = searchTerm.trim().toLowerCase();
  const normalizedSearch = normalizeServiceText(search);
  const selected = normalizeServiceText(selectedCategory);

  let result = services.filter((service) => {
    const category = getServiceCategoryName(service);

    const searchableText = [
      service?.name,
      service?.description,
      service?.slug,
      category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchableSlug = normalizeServiceText(searchableText);
    const categorySlug = normalizeServiceText(category);

    const matchesSearch =
      !search ||
      searchableText.includes(search) ||
      searchableSlug.includes(normalizedSearch);

    const matchesCategory =
      selectedCategory === "all" ||
      selected === categorySlug ||
      searchableSlug.includes(selected);

    return matchesSearch && matchesCategory;
  });

  if (sortBy === "az") {
    result = [...result].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }

  if (sortBy === "newest") {
    result = [...result].sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  return result;
};

export const getActiveCategoryLabel = (categoryOptions, selectedCategory) => {
  const selected = normalizeServiceText(selectedCategory);

  return (
    categoryOptions.find((item) => item.value === selected)?.label ||
    "All services"
  );
};

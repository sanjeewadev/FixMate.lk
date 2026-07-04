import api from "../../../../lib/api";

export const SERVICES_SECTION_FALLBACK_IMAGE = "/assets/default.jpg";

export const servicesSectionFallbackCategories = [
  "Electrical",
  "Plumbing",
  "AC Repair",
  "Cleaning",
  "Painting",
  "Handyman",
];

export const servicesSectionContent = {
  eyebrow: "Popular services",
  title: "Reliable home services, ready when you need them.",
  subtitle:
    "Choose from trusted repair, cleaning and maintenance services for homes, offices and apartments.",
  promise: {
    eyebrow: "FixMate promise",
    title: "Book. Track. Complete.",
    text: "Send a request, get connected with a technician, and keep your job history organized.",
  },
  process: [
    {
      step: "01",
      title: "Choose service",
      text: "Select the repair or maintenance service you need.",
    },
    {
      step: "02",
      title: "Send request",
      text: "Add location, contact details and preferred time.",
    },
    {
      step: "03",
      title: "Track job",
      text: "Manage updates and service history from your dashboard.",
    },
  ],
  cta: {
    eyebrow: "Need help choosing?",
    title: "Tell us the issue and FixMate will guide you.",
    contactLabel: "Contact FixMate",
    servicesLabel: "Explore Services",
  },
};

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

  if (!category) return "General";
  if (typeof category === "string") return category;
  if (category?.name) return category.name;
  if (category?.title) return category.title;

  return "General";
};

export const getServiceImage = (service) => {
  return service?.serviceImages?.[0]?.url || SERVICES_SECTION_FALLBACK_IMAGE;
};

export const getServiceBookingPath = (service) => {
  if (service?._id) return `/book?serviceId=${service._id}`;
  if (service?.slug) return `/book?slug=${encodeURIComponent(service.slug)}`;
  return "/book";
};

export const getServiceDescription = (service, limit = 92) => {
  const fallback = `${getServiceCategoryName(
    service,
  )} service handled by verified FixMate technicians.`;

  const text = service?.description || fallback;

  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

export const loadServicesForSection = async () => {
  const { data } = await api.get("/api/services?limit=200");

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
};

export const buildCategoryOptions = (services) => {
  const apiCategories = services
    .map((service) => getServiceCategoryName(service))
    .filter(Boolean);

  const uniqueCategories = Array.from(new Set(apiCategories));

  const finalCategories =
    uniqueCategories.length > 0
      ? uniqueCategories
      : servicesSectionFallbackCategories;

  return [
    { label: "All", value: "all" },
    ...finalCategories.slice(0, 6).map((category) => ({
      label: category,
      value: normalizeServiceText(category),
    })),
  ];
};

export const filterServicesForSection = (services, activeCategory) => {
  const selected = normalizeServiceText(activeCategory);

  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((service) => {
          const category = normalizeServiceText(
            getServiceCategoryName(service),
          );
          const name = normalizeServiceText(service?.name || "");
          const description = normalizeServiceText(service?.description || "");

          return (
            category === selected ||
            name.includes(selected) ||
            description.includes(selected)
          );
        });

  return filtered.slice(0, 6);
};

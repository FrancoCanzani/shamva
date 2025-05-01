export const monitoringRegions = [
  {
    value: "wnam",
    label: "Western North America (USA)",
    continent: "North America",
    flag: "🇺🇸",
  },
  {
    value: "enam",
    label: "Eastern North America (USA)",
    continent: "North America",
    flag: "🇺🇸",
  },
  {
    value: "sam",
    label: "South America (Brazil)",
    continent: "South America",
    flag: "🇧🇷",
  },
  {
    value: "weur",
    label: "Western Europe (Netherlands)",
    continent: "Europe",
    flag: "🇳🇱",
  },
  {
    value: "eeur",
    label: "Eastern Europe (Romania)",
    continent: "Europe",
    flag: "🇷🇴",
  },
  {
    value: "apac",
    label: "Asia-Pacific (Singapore)",
    continent: "Asia-Pacific",
    flag: "🇸🇬",
  },
  {
    value: "oc",
    label: "Oceania (Australia)",
    continent: "Oceania",
    flag: "🇦🇺",
  },
  {
    value: "afr",
    label: "Africa (South Africa)",
    continent: "Africa",
    flag: "🇿🇦",
  },
  {
    value: "me",
    label: "Middle East (UAE)",
    continent: "Middle East",
    flag: "🇦🇪",
  },
];

export const regionCodeToNameMap: Record<string, string> = {
  wnam: "Western North America (USA)",
  enam: "Eastern North America (USA)",
  sam: "South America (Brazil)",
  weur: "Western Europe (Netherlands)",
  eeur: "Eastern Europe (Romania)",
  apac: "Asia-Pacific (Singapore)",
  oc: "Oceania (Australia)",
  afr: "Africa (South Africa)",
  me: "Middle East (UAE)",
};

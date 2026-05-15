export const siteConfig = {
  name: "De Flosj",
  title: "De Flosj - vereniging, toernooi en dorpskoers",
  description:
    "Een moderne eerste versie van de frontend voor De Flosj met focus op toernooi, dorpskoers, vereniging en contact.",
  email: "info@deflosj.be",
  phone: "+32 16 00 00 00",
  location: "Rotselaar, Vlaams-Brabant",
  postalCode: "3110",
  navigation: [
    { href: "/", label: "Home" },
    { href: "/toernooi", label: "Toernooi" },
    { href: "/dorpelingenkoers", label: "Dorpelingenkoers" },
    { href: "/over", label: "Over ons" },
    { href: "/contact", label: "Contact" },
  ],
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=100092918104882",
    instagram: "https://www.instagram.com/deflosj_rotselaar/",
  },
} as const;

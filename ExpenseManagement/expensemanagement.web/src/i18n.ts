import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEn from "./locale/en.json";
import translationAr from "./locale/ar.json";
import LanguageDetector from "i18next-browser-languagedetector";



const resources = {
  en: {
    translation: translationEn
  },
  ar: {
    translation: translationAr
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // lng: "en", // if you're using a language detector, do not define the lng option
   fallbackLng: "en",
    detection: {
  order: ["localStorage", "navigator"],
  caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false
    }
  });

  export default i18n;
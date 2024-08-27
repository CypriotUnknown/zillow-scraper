import Scraper from "./scraper.js";

const scraper = await Scraper.init();

await scraper.scrape();
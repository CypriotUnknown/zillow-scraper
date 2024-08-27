import playwright from 'playwright';
import Listing from './models/models.listing';
import { ModelManager } from './utilities/utilities.model-manager.js';
import ScraperConfiguration from './models/models.scraper-config.js';
import waitAfterDate from './utilities/utilities.wait-after-date.js';
import Constants from './models/models.constants.js';
import path from 'path';
import AgentModel from './models/models.agents';

export default class Scraper {
    private static sharedInstance?: Scraper;
    private constructor() { }
    public static get shared() {
        if (this.sharedInstance === undefined) throw new Error("SCRAPER NOT INITIALIZED !");
        return this.sharedInstance;
    }

    private config = ScraperConfiguration.shared;
    private timeout = 5 * 1000;
    private lastScrapeDate?: Date;
    private baseURL = "https://www.zillow.com";
    private userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    public static async init() {
        if (this.sharedInstance === undefined) this.sharedInstance = new Scraper();
        return this.shared;
    }

    private async browser() {
        const pwURL = process.env.PLAYWRIGHT_URL;
        if (pwURL) {
            return await playwright.chromium.connect(pwURL);
        } else {
            return await playwright.chromium.launch({ headless: true });
        }
    }

    async scrape() {
        let retries = 0;

        for (let urlIndex = 0; urlIndex < this.config.items.length; urlIndex++) {
            const item = this.config.items[urlIndex];
            console.log(`Scraping: ${item.url} - ${item.mainCategory}`);

            if (this.lastScrapeDate) {
                await waitAfterDate({ date: this.lastScrapeDate, seconds: 120 });
            }

            this.lastScrapeDate = new Date();

            const browser = await this.browser();

            const page = await browser.newPage({
                extraHTTPHeaders: {
                    'sec-ch-ua': '"Chromium";v="128"',
                    'user-agent': this.userAgent
                }
            });

            await page.goto(item.url);

            page.setDefaultTimeout(this.timeout);
            const pageTitle = await page.title();

            if (pageTitle.toLowerCase() === 'access to this page has been denied') {
                console.log("GOT CAUGHT !");
                if (retries < 2) {
                    urlIndex--;
                    await browser.close();
                    retries++;
                    continue;
                } else {
                    console.log("tried and got caught twice. breaking scrape.");
                    await browser.close();
                    break;
                }
            }

            if (item.mainCategory === Constants.propertiesCategoryKey) {
                const listings = await page.locator("#grid-search-results ul").first().locator("li article").all();

                const listingModels = await Promise.all(
                    listings.map(listing => ModelManager.createListingFromLocator(listing))
                ).then(listings => listings.filter(listing => listing !== undefined) as Listing[]);

                ModelManager.writeListings(listingModels, item);
            } else {
                const agentListings = await page.locator("a[href^='/profile/']").all();

                const agentModels = await Promise.all(
                    agentListings.map(agent => ModelManager.createAgentFromLocator(agent, this.baseURL))
                ).then(listings => listings.filter(listing => listing !== undefined) as AgentModel[]);

                ModelManager.writeListings(agentModels, item);
            }

            await browser.close();
        }
    }

}
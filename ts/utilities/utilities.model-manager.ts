import path from "path";
import fs from 'fs';
import Listing, { ListingAddress } from "../models/models.listing";
import { Locator } from "playwright";
import { AgentConfigurationItem, ConfigurationItem, PropertyConfigurationItem } from "../models/models.scraper-config";
import AgentModel from "../models/models.agents";
import Constants from "../models/models.constants.js";

export class ModelManager {

    public static async createListingFromLocator(listing: Locator): Promise<Listing | undefined> {
        const urlLocator = listing.getByRole("link").first();
        const url = await urlLocator.getAttribute("href").then(href => href ?? null).catch(_ => null);

        if (url === null) return;

        const seller = await listing.locator("div[class$='property-card-data'] div").first()
            .textContent()
            .then(text => {
                if (text) {
                    const cleanedText = text.trim().toLowerCase();
                    if (cleanedText.length === 0) return null;
                    return cleanedText;
                }

                return null;
            })
            .catch(_ => null);

        const price = await listing.locator("span[data-test='property-card-price']").first().textContent().then(priceString => {
            if (priceString && priceString.length > 0) {

                const currency = priceString.slice(0, 1);

                const amount = parseFloat(
                    priceString
                        .replace(currency, "")
                        .replaceAll(",", "")
                        .replaceAll(".", "")
                        .trim()
                );

                if (!isNaN(amount)) {
                    return { amount, currency };
                }
            }

            return null;
        }).catch(_ => null);

        const imgLocator = listing.locator("picture img").first();
        const address = await imgLocator.getAttribute("alt")
            .then(addressString => {
                const match = addressString?.match(/^(\d+\s[\w\s]+),\s([\w\s]+),\s([A-Z]{2})\s(\d{5})$/m);
                if (match) {
                    const obj: ListingAddress = {
                        streetAddress: match[1].toLowerCase(),
                        addressLocality: match[2].toLowerCase(),
                        addressRegion: match[3].toLowerCase(),
                        postalCode: match[4].toLowerCase()
                    }

                    return obj;
                }

                return null;
            })
            .catch(_ => null);

        const image = await imgLocator.getAttribute("src").then(src => src ?? null).catch(_ => null);
        const obj: Listing = {
            url,
            seller,
            price,
            image,
            address
        }
        return obj;
    }

    public static async createAgentFromLocator(agent: Locator, baseURL: string): Promise<AgentModel | undefined> {
        const url = await agent.getAttribute('href').then(href => href ? path.join(baseURL, href) : null);
        if (url === null) return;

        const imageURL = await agent.locator("img").first().getAttribute("src").catch(_ => null);
        const name = await agent.locator("[class*='ProfileCard__ProfessionalNameText']")
            .first()
            .textContent()
            .then(text => text?.trim().toLowerCase() ?? null)
            .catch(_ => null);
        const company = await agent.locator("[class*='ProfileCard__BusinessNameText']")
            .first()
            .textContent()
            .then(text => text?.trim().toLowerCase() ?? null)
            .catch(_ => null);

        const obj: AgentModel = {
            url,
            imageURL,
            name,
            company
        }

        return obj;
    }

    public static writeListings(listings: (Listing | AgentModel)[], item: ConfigurationItem) {
        let dir = path.resolve("data", item.mainCategory);
        let fileName: string;

        if (item.mainCategory === Constants.propertiesCategoryKey) {
            const propertyItem = item as PropertyConfigurationItem;
            dir = path.join(dir, propertyItem.type);
            fileName = `${propertyItem.name}.json`;
        } else {
            const agentItem = item as AgentConfigurationItem;
            dir = path.join(dir, agentItem.name ? "names" : "locations");
            if (agentItem.name && agentItem.zip) {
                fileName = `${agentItem.name}-${agentItem.zip}`;
            } else {
                fileName = `${agentItem.name ?? agentItem.zip}.json`;
            }
        }

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, fileName), ModelManager.listingsToJson(listings));
        console.log("wrote json...");
    }

    private static listingsToJson(value: (Listing | AgentModel)[]): string {
        return JSON.stringify(value, undefined, 4);
    }
}

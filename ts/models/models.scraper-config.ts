import fs from 'fs';
import path from 'path';
import { loadEnvFile } from 'process';
import Joi from 'joi';
import Constants from './models.constants.js';

interface ISearchCriteriaJSON {
    properties?: { type: string; category: string; }[],
    agents?: { zip?: number; name?: string; }[]
}

interface ScraperConfigurationFile {
    buy: {
        homes: {
            url: string;
        }
        foreclosures: {
            url: string;
        }
        open_houses: {
            url: string;
        }
        construction: {
            url: string;
        }
        coming_soon: {
            url: string;
        }
        recent_sales: {
            url: string;
        }
        all_home: {
            url: string;
        }
    },
    rent: {
        all: {
            url: string;
        }
        apartments: {
            url: string;
        }
        houses: {
            url: string;
        }
    }
    agents_base_url: string;
    properties_base_url: string;
}

export type ConfigurationItem = PropertyConfigurationItem | AgentConfigurationItem;
export type PropertyConfigurationItem = { mainCategory: string; type: string; name: string; url: string; };
export type AgentConfigurationItem = { mainCategory: string; zip?: number; name?: string; url: string; };

export default class ScraperConfiguration {
    private static sharedInstance?: ScraperConfiguration;
    private configuration: ConfigurationItem[] = [];

    private getInternalConfigJSON() {
        const fileBuffer = fs.readFileSync(path.resolve("config.json"));
        return JSON.parse(fileBuffer.toString());
    }

    private constructor() {
        try {
            loadEnvFile(process.env.ENV_FILE ?? ".env");
            const searchCriteriaFilePath = process.env.SEARCH_CRITERIA_FILE;
            if (searchCriteriaFilePath === undefined) throw new Error("MISSING ENVIORNMENT VARIABLE 'SEARCH_CRITERIA_FILE'");

            let searchCriteriaJSON = undefined;
            try {
                searchCriteriaJSON = JSON.parse(fs.readFileSync(searchCriteriaFilePath).toString());
            } catch (error) {
                throw new Error('SEARCH_CRITERIA_FILE IS NOT JSON');
            }

            const jsonValidator = Joi.object<ISearchCriteriaJSON>({
                properties: Joi.array().items(
                    Joi.object({
                        type: Joi.string().required(),
                        category: Joi.string().required()
                    }
                    )),
                agents: Joi.array().items(
                    Joi.alternatives([
                        Joi.object({ zip: Joi.number().required().min(10000).max(99999) }),
                        Joi.object({ name: Joi.string().required() }),
                        Joi.object({ zip: Joi.number().required().min(10000).max(99999), name: Joi.string().required() })
                    ])
                )
            }).validate(searchCriteriaJSON);

            if (jsonValidator.error) throw new Error(jsonValidator.error.message);

            const internalConfig = this.getInternalConfigJSON();

            let config: ConfigurationItem[] = [];

            if (jsonValidator.value.properties) {
                const allowedTypes = ["buy", "rent"];
                const allowedCategories = [
                    "homes",
                    "foreclosures",
                    "open_houses",
                    "construction",
                    "coming_soon",
                    "recent_sales",
                    "all_home",
                ];

                if (!jsonValidator.value.properties.every(property => allowedTypes.includes(property.type) && allowedCategories.includes(property.category))) {
                    throw new Error(`INVALID SEARCH CRITERIA`);
                }

                config.push(...jsonValidator.value.properties.map(property => {
                    const url = internalConfig.properties_base_url + internalConfig[property.type][property.category].url as string;
                    const type = property.type;
                    const name = property.category;

                    return {
                        url,
                        type,
                        name,
                        mainCategory: Constants.propertiesCategoryKey
                    }
                }));
            }

            if (jsonValidator.value.agents) {
                config.push(...jsonValidator.value.agents.map(agent => {
                    let url = internalConfig.agents_base_url;
                    if (agent.zip) url = path.join(url, `${agent.zip}`);
                    if (agent.name) {
                        const urlObject = new URL(url);
                        const queryParams = new URLSearchParams();
                        queryParams.set("name", agent.name);
                        urlObject.search = queryParams.toString();
                        url = urlObject.href;
                    }

                    return {
                        url,
                        mainCategory: Constants.agentsKey,
                        zip: agent.zip,
                        name: agent.name
                    }
                }))
            }


            this.configuration = config;

            // if (categories === undefined) throw new Error("MISSING ENVIRONMENT VARIABLE 'CATEGORIES'");

            // const cleanedCategories = categories.split(",").map(category => category.trim());

            // if (!cleanedCategories.every(category => category.split("::").length === 2)) throw new Error("INCORRECT FORMAT FOR 'CATEGORIES'. FORMAT MUST BE SEARCH-TYPE::CATEGORY");

            // const filters = cleanedCategories.map(category => {
            //     const split = category.split("::");
            //     const type = split[0];
            //     const name = split[1];
            //     return {
            //         type,
            //         name
            //     }
            // });

            // const fileBuffer = fs.readFileSync(path.resolve("config.json"));
            // const fileJSON = JSON.parse(fileBuffer.toString());

            // this.configuration = filters.map(filter => {
            //     const type = fileJSON[filter.type];
            //     if (type) {
            //         const category = type[filter.name];
            //         if (category) {
            //             return {
            //                 url: category.url,
            //                 name: filter.name,
            //                 type: filter.type
            //             };
            //         }
            //     }
            // }).filter(url => url !== undefined) as ConfigurationItem[];
        } catch (error) {
            throw error;
        }
    }
    public static get shared() {
        if (this.sharedInstance === undefined) this.sharedInstance = new ScraperConfiguration();
        return this.sharedInstance;
    }

    get items() {
        return this.configuration;
    }
}
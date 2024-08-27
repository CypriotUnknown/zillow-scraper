# Zillow Web Scraper

This project is a web scraper designed to scrape real estate data from Zillow. The scraped results are stored in JSON format in a folder named `data` at the root of the project.

## Environment Variables

The scraper requires two environment variables:

- **SEARCH_CRITERIA_FILE** (mandatory): This variable should point to the JSON file containing the search criteria. The file path must be provided as the value of this variable.

- **PLAYWRIGHT_URL** (optional): This variable can be set to specify the remote Playwright server URL. If not provided, the scraper will run Playwright locally.

## Search Criteria File

The search criteria file must be a JSON file. Below is an example of the structure expected:

```json
{
    "properties": [
        {
            "type": "<string>",
            "category": "<string>"
        }
    ],
    "agents": [
        {
            "zip": "<number>"
        },
        {
            "name": "<string>"
        },
        {
            "name": "<string>",
            "zip": "<number>"
        }
    ]
}
```

### Details:

### Properties
The `properties` field in the JSON file specifies criteria for the types of properties you want to scrape. Each object in the `properties` array must include both `type` and `category` fields.

#### Type and Category
- The `type` field can be one of the following:
  - `buy`
  - `rent`
- The `category` field can be one of the following under the selected `type`:
  - For `buy`:
    - `homes`
    - `foreclosures`
    - `open_houses`
    - `construction`
    - `coming_soon`
    - `recent_sales`
    - `all_home`
  - For `rent`:
    - `all`
    - `apartments`
    - `houses`

### Agents
The `agents` field in the JSON file specifies criteria for real estate agents you want to scrape. Each object in the `agents` array can include either or both `name` and `zip` fields. However, an object cannot be empty.
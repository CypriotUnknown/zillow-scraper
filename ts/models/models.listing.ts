export default interface Listing {
    url: string | null;
    image: string | null;
    address: ListingAddress | null;
    price: ListingPrice | null;
    seller: string | null;
}

export interface ListingAddress {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
    addressRegion: string;
}

export interface ListingPrice {
    amount: number;
    currency: string;
}
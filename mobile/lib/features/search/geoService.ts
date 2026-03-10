import { searchApi } from '../../api/routes';

export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface SearchResultHouse {
    id: string;
    tenantId: string;
    name?: string;
    description?: string;
    location?: GeoLocation;
    geohash?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    distance: number;
}

/**
 * Searches for sober-living houses within a given radius.
 * @param center The center latitude and longitude.
 * @param radiusInKm The search radius in kilometers.
 * @returns A promise resolving to a sorted array of houses by distance.
 */
export async function searchHousesWithinRadius(
    center: GeoLocation,
    radiusInKm: number
): Promise<SearchResultHouse[]> {
    try {
        const response = await searchApi.getHousesWithinRadius(center.lat, center.lng, radiusInKm);

        // API returns { data: { houses: [] } } depending on the client.ts implementation
        // Let's assume response is just the payload or has a data property
        const housesData = (response as any).data?.houses || (response as any).houses || [];

        return housesData as SearchResultHouse[];
    } catch (error) {
        console.error('Error in searchHousesWithinRadius:', error);
        throw error;
    }
}

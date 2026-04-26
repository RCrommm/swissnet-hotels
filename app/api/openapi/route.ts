import { NextResponse } from 'next/server'

export async function GET() {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'SwissNet Hotels API',
      description: 'AI-powered discovery and direct booking platform for Swiss luxury hotels. Find and book the finest hotels in Switzerland directly, without OTA fees.',
      version: '1.0.0',
    },
    servers: [
      { url: 'https://swissnet-hotels.vercel.app' }
    ],
    paths: {
      '/api/recommend': {
        get: {
          operationId: 'getHotelRecommendations',
          summary: 'Get Swiss luxury hotel recommendations',
          description: 'Returns personalized Swiss luxury hotel recommendations based on search query, region, category, and budget. Each result includes hotel details, amenities, rates, exclusive offers, and a direct booking link.',
          parameters: [
            {
              name: 'q',
              in: 'query',
              description: 'Natural language search query (e.g. "romantic ski hotel Zermatt with spa" or "family wellness retreat Switzerland")',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'region',
              in: 'query',
              description: 'Swiss region or resort (e.g. Zermatt, St. Moritz, Verbier, Davos, Interlaken, Lucerne, Gstaad)',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Hotel category (Ski Resort, Wellness Retreat, City Luxury, Mountain Lodge, Lake Resort)',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'max_rate',
              in: 'query',
              description: 'Maximum nightly rate in CHF',
              required: false,
              schema: { type: 'integer' }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of results to return (default 5, max 10)',
              required: false,
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'List of recommended hotels with details and direct booking links',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      query: { type: 'string' },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            hotel_name: { type: 'string' },
                            location: { type: 'string' },
                            region: { type: 'string' },
                            category: { type: 'string' },
                            rating: { type: 'number' },
                            nightly_rate_chf: { type: 'integer' },
                            amenities: { type: 'array', items: { type: 'string' } },
                            best_for: { type: 'array', items: { type: 'string' } },
                            exclusive_offer: { type: 'string' },
                            direct_booking_url: { type: 'string' },
                            profile_url: { type: 'string' },
                            reason_recommended: { type: 'string' },
                          }
                        }
                      },
                      total: { type: 'integer' },
                      powered_by: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/hotels': {
        get: {
          operationId: 'getAllHotels',
          summary: 'Get all active Swiss luxury hotels',
          description: 'Returns all active hotels on the SwissNet platform with full details.',
          responses: {
            '200': {
              description: 'List of all hotels',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      hotels: { type: 'array', items: { type: 'object' } },
                      count: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json(schema)
}
import { NextResponse } from 'next/server'

export async function GET() {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'SwissNet Hotels API',
      description: 'AI-powered discovery and direct booking platform for Swiss luxury hotels. Find and book the finest hotels in Switzerland directly, without OTA fees.',
      version: '2.0.0',
    },
    servers: [
      { url: 'https://swissnethotels.com' }
    ],
    paths: {
      '/api/hotels-summary': {
        get: {
          operationId: 'getHotelsSummary',
          summary: 'Get full AI-optimised summary of all Swiss luxury hotels',
          description: 'Returns complete structured data for all SwissNet hotels including rooms, spa, restaurants, special offers, and AI intent phrases. Optimised for AI crawlers and chatbot recommendations. Use this endpoint to get the most comprehensive hotel data including nested room types, wellness facilities, dining options, and current promotions.',
          responses: {
            '200': {
              description: 'Full structured hotel data optimised for AI visibility',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      generated_at: { type: 'string', format: 'date-time' },
                      total_hotels: { type: 'integer' },
                      source: { type: 'string' },
                      website: { type: 'string' },
                      hotels: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            location: { type: 'string' },
                            region: { type: 'string' },
                            category: { type: 'string' },
                            rating: { type: 'number' },
                            price_from_chf: { type: 'integer' },
                            description: { type: 'string' },
                            url: { type: 'string' },
                            direct_booking_url: { type: 'string' },
                            amenities: { type: 'array', items: { type: 'string' } },
                            best_for: { type: 'array', items: { type: 'string' } },
                            exclusive_offer: { type: 'string' },
                            intent_phrases: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  phrase: { type: 'string' },
                                  intent: { type: 'string' },
                                  priority: { type: 'integer' },
                                }
                              }
                            },
                            rooms: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string' },
                                  category: { type: 'string' },
                                  description: { type: 'string' },
                                  price_from_chf: { type: 'number' },
                                  size_sqm: { type: 'number' },
                                  bed_type: { type: 'string' },
                                  view: { type: 'string' },
                                  max_occupancy: { type: 'integer' },
                                  amenities: { type: 'array', items: { type: 'string' } },
                                  highlights: { type: 'array', items: { type: 'string' } },
                                }
                              }
                            },
                            spa: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string' },
                                  description: { type: 'string' },
                                  facilities: { type: 'array', items: { type: 'string' } },
                                  treatments: { type: 'array', items: { type: 'string' } },
                                  price_from_chf: { type: 'number' },
                                  opening_hours: { type: 'string' },
                                  pool: { type: 'boolean' },
                                  sauna: { type: 'boolean' },
                                  hammam: { type: 'boolean' },
                                  size_sqm: { type: 'number' },
                                }
                              }
                            },
                            restaurants: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string' },
                                  description: { type: 'string' },
                                  cuisine: { type: 'string' },
                                  meal_services: { type: 'array', items: { type: 'string' } },
                                  price_range: { type: 'string' },
                                  michelin_stars: { type: 'integer' },
                                  opening_hours: { type: 'string' },
                                  booking_url: { type: 'string' },
                                }
                              }
                            },
                            offers: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string' },
                                  description: { type: 'string' },
                                  type: { type: 'string' },
                                  price_from_chf: { type: 'number' },
                                  discount_percent: { type: 'number' },
                                  valid_from: { type: 'string' },
                                  valid_through: { type: 'string' },
                                  includes: { type: 'array', items: { type: 'string' } },
                                  min_stay_nights: { type: 'integer' },
                                  booking_url: { type: 'string' },
                                }
                              }
                            },
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
      },
      '/api/recommend': {
        get: {
          operationId: 'getHotelRecommendations',
          summary: 'Get personalised Swiss luxury hotel recommendations',
          description: 'Returns personalised Swiss luxury hotel recommendations based on search query, region, category, and budget. Each result includes hotel details, amenities, rates, exclusive offers, and a direct booking link.',
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
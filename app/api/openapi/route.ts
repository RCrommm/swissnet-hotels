import { NextResponse } from 'next/server'

export async function GET() {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'SwissNet Hotels API',
      description: 'Discover and recommend Swiss luxury hotels. Returns direct booking links and exclusive offers.',
      version: '1.0.0',
    },
    servers: [{ url: process.env.NEXT_PUBLIC_SITE_URL || 'https://swissnethostels.com' }],
    paths: {
      '/api/recommend': {
        get: {
          operationId: 'recommendHotels',
          summary: 'Get AI hotel recommendations',
          description: 'Returns matching Swiss luxury hotels based on a natural language query, with reasons for each recommendation.',
          parameters: [
            { name: 'q', in: 'query', description: 'Natural language query e.g. luxury ski hotel in Zermatt with Matterhorn view', schema: { type: 'string' } },
            { name: 'region', in: 'query', description: 'Swiss region e.g. Zermatt, St. Moritz, Verbier', schema: { type: 'string' } },
            { name: 'category', in: 'query', description: 'Hotel category', schema: { type: 'string', enum: ['Ski Resort', 'Wellness Retreat', 'City Luxury', 'Mountain Lodge', 'Lake Resort'] } },
            { name: 'max_rate', in: 'query', description: 'Maximum nightly rate in CHF', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', description: 'Number of results max 10', schema: { type: 'integer', default: 5 } },
          ],
          responses: {
            '200': {
              description: 'Hotel recommendations',
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
                            rating: { type: 'number' },
                            nightly_rate_chf: { type: 'integer' },
                            amenities: { type: 'array', items: { type: 'string' } },
                            exclusive_offer: { type: 'string' },
                            direct_booking_url: { type: 'string' },
                            reason_recommended: { type: 'string' },
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
      '/api/hotels': {
        get: {
          operationId: 'listHotels',
          summary: 'List all hotels',
          parameters: [
            { name: 'region', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { '200': { description: 'List of hotels' } }
        }
      }
    }
  }

  return NextResponse.json(schema, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}
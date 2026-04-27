// components/RoomTypeSchema.jsx
// Injects nested JSON-LD HotelRoom schema markup for AI crawler visibility
// Usage: <RoomTypeSchema hotel={hotel} roomTypes={roomTypes} />

export default function RoomTypeSchema({ hotel, roomTypes }) {
  if (!hotel || !roomTypes?.length) return null;

  // Build the full Hotel + HotelRoom nested schema
  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": `https://swissnethotels.com/hotels/${hotel.slug}#hotel`,
    "name": hotel.name,
    "description": hotel.description || hotel.short_description,
    "url": `https://swissnethotels.com/hotels/${hotel.slug}`,
    "telephone": hotel.phone || undefined,
    "email": hotel.email || undefined,
    "starRating": hotel.star_rating ? {
      "@type": "Rating",
      "ratingValue": hotel.star_rating
    } : undefined,
    "address": hotel.address ? {
      "@type": "PostalAddress",
      "streetAddress": hotel.address,
      "addressLocality": hotel.city,
      "addressCountry": hotel.country || "CH"
    } : undefined,
    "geo": (hotel.latitude && hotel.longitude) ? {
      "@type": "GeoCoordinates",
      "latitude": hotel.latitude,
      "longitude": hotel.longitude
    } : undefined,
    "image": hotel.hero_image || hotel.thumbnail_url || undefined,
    "priceRange": hotel.price_range || "$$$$",
    "currenciesAccepted": "CHF, EUR, USD",
    "paymentAccepted": "Credit Card, Cash",
    "amenityFeature": (hotel.amenities || []).map(amenity => ({
      "@type": "LocationFeatureSpecification",
      "name": amenity,
      "value": true
    })),
    // Nested containsPlace for each room type
    "containsPlace": roomTypes
      .filter(rt => rt.is_available !== false)
      .map(rt => buildRoomSchema(rt, hotel))
  };

  // Remove undefined values for clean output
  const cleanSchema = JSON.parse(JSON.stringify(schema, (key, val) => 
    val === undefined ? undefined : val
  ));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema, null, 0) }}
    />
  );
}

function buildRoomSchema(rt, hotel) {
  const amenityFeatures = (rt.amenities || []).map(a => ({
    "@type": "LocationFeatureSpecification",
    "name": a,
    "value": true
  }));

  // Build offer block
  const offers = rt.price_per_night ? {
    "@type": "Offer",
    "price": rt.price_per_night,
    "priceCurrency": rt.price_currency || "CHF",
    "priceSpecification": buildPriceSpec(rt),
    "url": rt.booking_url || `https://swissnethotels.com/hotels/${hotel.slug}#book`,
    "availability": "https://schema.org/InStock",
    "validFrom": new Date().toISOString().split('T')[0],
    "seller": {
      "@type": "Hotel",
      "name": hotel.name
    }
  } : undefined;

  const images = [];
  if (rt.thumbnail_url) images.push(rt.thumbnail_url);
  if (rt.images?.length) {
    rt.images.forEach(img => {
      const url = typeof img === 'string' ? img : img.url;
      if (url && !images.includes(url)) images.push(url);
    });
  }

  return {
    "@type": "HotelRoom",
    "@id": `https://swissnethotels.com/hotels/${hotel.slug}#room-${rt.id}`,
    "name": rt.schema_name || rt.name,
    "description": rt.ai_description || rt.description || rt.short_description,
    "url": rt.booking_url || `https://swissnethotels.com/hotels/${hotel.slug}`,
    "image": images.length === 1 ? images[0] : images.length > 1 ? images : undefined,
    "occupancy": {
      "@type": "QuantitativeValue",
      "minValue": 1,
      "maxValue": rt.max_occupancy || 2
    },
    "bed": rt.bed_type ? {
      "@type": "BedDetails",
      "typeOfBed": rt.bed_type,
      "numberOfBeds": rt.bed_count || 1
    } : undefined,
    "floorSize": rt.size_sqm ? {
      "@type": "QuantitativeValue",
      "value": rt.size_sqm,
      "unitCode": "MTK"
    } : undefined,
    "amenityFeature": amenityFeatures.length ? amenityFeatures : undefined,
    "offers": offers,
    // Additional descriptive properties
    "additionalProperty": buildAdditionalProps(rt)
  };
}

function buildPriceSpec(rt) {
  const specs = [{
    "@type": "UnitPriceSpecification",
    "price": rt.price_per_night,
    "priceCurrency": rt.price_currency || "CHF",
    "unitText": "NIGHT",
    "priceType": "https://schema.org/ListPrice"
  }];

  if (rt.price_weekend) {
    specs.push({
      "@type": "UnitPriceSpecification",
      "price": rt.price_weekend,
      "priceCurrency": rt.price_currency || "CHF",
      "unitText": "NIGHT",
      "name": "Weekend Rate",
      "priceType": "https://schema.org/SalePrice"
    });
  }

  if (rt.price_peak) {
    specs.push({
      "@type": "UnitPriceSpecification",
      "price": rt.price_peak,
      "priceCurrency": rt.price_currency || "CHF",
      "unitText": "NIGHT",
      "name": "Peak Season Rate"
    });
  }

  return specs.length === 1 ? specs[0] : specs;
}

function buildAdditionalProps(rt) {
  const props = [];

  if (rt.view_type) {
    props.push({
      "@type": "PropertyValue",
      "name": "View",
      "value": rt.view_type
    });
  }

  if (rt.floor_level) {
    props.push({
      "@type": "PropertyValue",
      "name": "Floor",
      "value": rt.floor_level
    });
  }

  if (rt.type_category) {
    props.push({
      "@type": "PropertyValue",
      "name": "RoomCategory",
      "value": rt.type_category
    });
  }

  if (rt.min_stay_nights && rt.min_stay_nights > 1) {
    props.push({
      "@type": "PropertyValue",
      "name": "MinimumStay",
      "value": `${rt.min_stay_nights} nights`
    });
  }

  return props.length ? props : undefined;
}

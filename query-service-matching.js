export const categoryFor = { Flight: 'Flights', Accommodation: 'Accommodation', Visa: 'Visa', Cruise: 'Cruise', Transport: 'Transport' };
const normalize = (value) => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
const airports = {
  blr: ['blr', 'bengaluru', 'bangalore'], dxb: ['dxb', 'dubai'], del: ['del', 'delhi', 'new delhi'],
  bom: ['bom', 'mumbai', 'bombay'], cok: ['cok', 'kochi', 'cochin'], maa: ['maa', 'chennai'],
  goi: ['goi', 'dabolim'], gox: ['gox', 'mopa'],
};
export function place(value) {
  const text = normalize(String(value ?? '').split(',')[0]);
  return Object.entries(airports).find(([, names]) => names.includes(text))?.[0] ?? text;
}
const country = (value) => ['dubai', 'abu dhabi', 'uae', 'united arab emirates'].includes(normalize(value)) ? 'uae' : normalize(value);
export const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const list = (value) => Array.isArray(value) ? value : value ? String(value).split(/[,;]+/).map((item) => item.trim()).filter(Boolean) : [];
const supported = (requested, offered) => !requested || list(offered).some((value) => normalize(value) === normalize(requested));

export function requirementsFor(query) {
  const d = query.details ?? {};
  return {
    origin: d.flightOrigin || d.transportDeparture || d.departurePort || '',
    destination: d.stayDestination || d.visaCountry || d.flightDestination || d.transportDestination || d.cruiseRegion || '',
    arrivalPort: d.arrivalPort || '',
    startDate: d.checkIn || d.departureDate || d.visaTravelDate || d.transportStartDate || d.sailingDate || '',
    endDate: d.checkOut || d.returnDate || d.transportEndDate || d.cruiseReturnDate || '',
    departureTime: d.departureTime || d.flightDepartureTime || '', returnTime: d.returnTime || '',
    adults: Number(query.adults ?? d.adults ?? 1), children: Number(query.children ?? d.children ?? 0), infants: Number(query.infants ?? d.infants ?? 0),
    travellersSpecified: ['adults', 'children', 'infants'].some((key) => query[key] !== undefined || d[key] !== undefined),
    cabin: d.cabinClass || d.cabinPreference || '', mealPlan: d.mealPlan || '',
    rooms: Number(d.rooms || d.cabins || 1), roomsSpecified: Boolean(d.rooms || d.cabins), journeyType: d.journeyType || '',
    preferredAirlines: list(d.preferredAirlines), preferredProperties: list(d.preferredProperties),
    accommodationType: d.accommodationType || '', roomType: d.roomType || '', starRatings: query.starRatings || [],
    visaType: d.visaType || '', nationality: d.nationality || '', processingSpeed: d.processingSpeed || '',
    cruiseLine: d.cruiseLine || '', vehicles: query.tripVehicles || [], routeStops: query.routeStops || [],
    flightLegs: Array.isArray(d.flightLegs) ? d.flightLegs : [],
  };
}

function datesMatch(product, req) {
  if (!req.startDate && !req.endDate) return true;
  if (!validDate(req.startDate) || (req.endDate && (!validDate(req.endDate) || req.endDate < req.startDate))) return false;
  return validDate(product.availableFrom) && validDate(product.availableUntil)
    && product.availableFrom <= req.startDate && product.availableUntil >= (req.endDate || req.startDate);
}

function flightMatches(product, req) {
  if (!req.origin || !req.destination || !req.journeyType) return false;
  const legs = product.flightLegs || [];
  let requested;
  if (req.journeyType === 'Round trip') {
    requested = [{ origin: req.origin, destination: req.destination, date: req.startDate, departureTime: req.departureTime },
      { origin: req.destination, destination: req.origin, date: req.endDate, departureTime: req.returnTime }];
  } else if (req.journeyType === 'One way' && !req.endDate) requested = [{ origin: req.origin, destination: req.destination, date: req.startDate, departureTime: req.departureTime }];
  else if (req.journeyType === 'Multi-city' && req.flightLegs.length > 1) requested = req.flightLegs;
  else return false;
  return legs.length === requested.length && requested.every((leg, index) => {
    const offered = legs[index];
    return place(leg.origin) === place(offered.origin) && place(leg.destination) === place(offered.destination)
      && validDate(offered.date)
      && (!leg.date || (validDate(leg.date) && leg.date === offered.date))
      && (!leg.departureTime || leg.departureTime === offered.departureTime)
      && supported(req.cabin, offered.cabinClasses || product.cabinClasses)
      && (!req.preferredAirlines.length || req.preferredAirlines.some((airline) => supported(airline, offered.airlines || product.airlines)));
  });
}

function productMatches(product, service, type, req) {
  if (product.status === 'Draft' || product.availability === 'Unavailable') return false;
  if (req.travellersSpecified && !['adults', 'children', 'infants'].every((key) => Number.isSafeInteger(req[key]) && req[key] >= (key === 'adults' ? 1 : 0))) return false;
  if (req.roomsSpecified && (!Number.isSafeInteger(req.rooms) || req.rooms < 1)) return false;
  if (req.travellersSpecified && (!Number.isSafeInteger(product.maxTravellers) || product.maxTravellers < req.adults + req.children + req.infants)) return false;
  if (req.roomsSpecified && (!Number.isSafeInteger(product.maxRooms) || product.maxRooms < req.rooms)) return false;
  if (type === 'Flight') return flightMatches(product, req);
  if (type === 'Cruise') return Boolean(req.origin) && place(product.origin) === place(req.origin)
    && normalize(product.region) === normalize(req.destination) && (!req.arrivalPort || place(product.destination) === place(req.arrivalPort))
    && validDate(product.sailingDate) && (!req.startDate || req.startDate === product.sailingDate)
    && (!req.endDate || (validDate(product.returnDate) && req.endDate === product.returnDate && product.returnDate >= product.sailingDate))
    && supported(req.cabin, product.cabinClasses) && supported(req.cruiseLine, product.cruiseLines);
  if (!datesMatch(product, req)) return false;
  if (type === 'Accommodation') {
    return place(product.destination || service.location) === place(req.destination)
      && supported(req.accommodationType, product.accommodationTypes)
      && supported(req.roomType, product.roomTypes) && supported(req.mealPlan, product.mealPlans)
      && (!req.starRatings.length || req.starRatings.some((rating) => Number(rating) === product.starRating))
      && (!req.preferredProperties.length || req.preferredProperties.some((property) => normalize(property) === normalize(service.name)));
  }
  if (type === 'Visa') return country(product.destination || service.location) === country(req.destination)
    && supported(req.visaType, product.visaTypes) && supported(req.nationality, product.nationalities) && supported(req.processingSpeed, product.processingSpeeds);
  if (type === 'Transport') return Boolean(req.origin) && place(product.origin) === place(req.origin) && place(product.destination) === place(req.destination)
    && req.vehicles.every((vehicle) => (product.vehicles || []).some((offered) => normalize(offered.type) === normalize(vehicle.type) && offered.units >= vehicle.units))
    && JSON.stringify(req.routeStops.map((stop) => place(stop.location))) === JSON.stringify((product.routeStops || []).map(place));
  return false;
}

export function matchingProducts(service, type, requirements) {
  if (service.status !== 'Active' || service.category !== categoryFor[type] || !requirements.destination) return [];
  // Missing coverage is not evidence that an offer fulfils a registered query.
  return (service.queryProducts || []).filter((product) => productMatches(product, service, type, requirements));
}

export function serviceMatches(service, type, requirements) {
  return matchingProducts(service, type, requirements).length > 0;
}

export function productSuppliedBy(product, connection) {
  return product.connectionIds?.includes(connection.id) || product.vendorIds?.includes(connection.vendorId) || false;
}

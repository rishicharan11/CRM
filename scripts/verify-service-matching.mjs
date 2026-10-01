import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { requirementsFor, serviceMatches, matchingProducts, productSuppliedBy } from '../query-service-matching.js';
import { QUERY_SAMPLE_DETAILS } from '../query-sample-requirements.js';

const query = (type, details) => requirementsFor({ type, details, adults: 4, children: 1, infants: 0 });
const service = (category, location, product) => ({ status: 'Active', category, location, name: 'Registered property', queryProducts: product ? [{ id: 'fixture-product', maxTravellers: 5, vendorIds: ['supplier'], ...product }] : [] });
const dates = { availableFrom: '2026-10-01', availableUntil: '2027-03-31' };
const flight = query('Flight', { flightOrigin: 'Bengaluru', flightDestination: 'Dubai', journeyType: 'Round trip', departureDate: '2026-11-10', returnDate: '2026-11-17', cabinClass: 'Economy', preferredAirlines: 'Emirates', departureTime: '10:30' });
const returnFlight = service('Flights', 'India', { flightLegs: [
  { origin: 'BLR', destination: 'DXB', date: '2026-11-10', departureTime: '10:30', cabinClasses: ['Economy'], airlines: ['Emirates'] },
  { origin: 'DXB', destination: 'BLR', date: '2026-11-17', departureTime: '15:00', cabinClasses: ['Economy'], airlines: ['Emirates'] },
] });
assert.ok(serviceMatches(returnFlight, 'Flight', flight), 'Both Bangalore–Dubai return legs match');
assert.equal(serviceMatches(service('Flights', 'India'), 'Flight', flight), false, 'Generic ticketing never matches a route');
for (const change of [
  (product) => product.flightLegs.pop(),
  (product) => product.flightLegs.reverse(),
  (product) => product.flightLegs[1].destination = 'COK',
  (product) => product.flightLegs[1].date = '2026-11-18',
  (product) => product.flightLegs[0].cabinClasses = ['Business'],
  (product) => product.flightLegs[0].airlines = ['Other airline'],
  (product) => product.flightLegs[0].departureTime = '12:00',
  (product) => product.flightLegs[0].origin = 'COK',
  (product) => product.maxTravellers = 4,
]) {
  const mismatched = structuredClone(returnFlight); change(mismatched.queryProducts[0]);
  assert.equal(serviceMatches(mismatched, 'Flight', flight), false, 'Every registered flight constraint applies');
}
assert.equal(serviceMatches(returnFlight, 'Flight', { ...flight, journeyType: 'One way' }), false, 'Round trip and one way are distinct');
assert.equal(serviceMatches(returnFlight, 'Flight', { ...flight, adults: NaN }), false, 'Unknown group sizes cannot bypass capacity matching');
const villaReq = query('Accommodation', { stayDestination: 'Maldives', accommodationType: 'Villa', roomType: 'Water villa', checkIn: '2026-11-10', checkOut: '2026-11-17', rooms: '2', mealPlan: 'Breakfast included' });
const villa = service('Accommodation', 'Maldives', { ...dates, maxRooms: 2, accommodationTypes: ['Villa'], roomTypes: ['Water villa'], mealPlans: ['Breakfast included'] });
assert.ok(serviceMatches(villa, 'Accommodation', villaReq));
for (const change of [
  (item) => item.location = 'Goa',
  (item) => item.queryProducts[0].roomTypes = ['Garden view'],
  (item) => item.queryProducts[0].mealPlans = ['Room only'],
  (item) => item.queryProducts[0].maxRooms = 1,
  (item) => item.queryProducts[0].availableUntil = '2026-11-16',
  (item) => delete item.queryProducts[0].availableFrom,
]) {
  const mismatched = structuredClone(villa); change(mismatched);
  assert.equal(serviceMatches(mismatched, 'Accommodation', villaReq), false);
}
assert.equal(serviceMatches(villa, 'Accommodation', { ...villaReq, destination: '' }), false, 'Missing query facts do not broaden the catalogue');
const visaReq = query('Visa', { visaCountry: 'Dubai', visaType: 'Tourist', nationality: 'Indian', processingSpeed: 'Express', visaTravelDate: '2026-11-10' });
const visa = service('Visa', 'UAE', { ...dates, visaTypes: ['Tourist'], nationalities: ['Indian'], processingSpeeds: ['Express'] });
assert.ok(serviceMatches(visa, 'Visa', visaReq));
assert.equal(serviceMatches(visa, 'Visa', { ...visaReq, destination: 'Thailand' }), false);
assert.equal(serviceMatches(visa, 'Visa', { ...visaReq, visaType: 'Business' }), false);
assert.equal(serviceMatches(visa, 'Visa', { ...visaReq, processingSpeed: 'Standard' }), false);
const transportReq = query('Transport', { transportDeparture: 'Kochi', transportDestination: 'Munnar', transportStartDate: '2026-11-10' });
const transport = service('Transport', 'Kerala', { ...dates, origin: 'COK', destination: 'Munnar' });
assert.ok(serviceMatches(transport, 'Transport', transportReq));
assert.equal(serviceMatches(transport, 'Transport', { ...transportReq, destination: 'Goa' }), false);
assert.equal(serviceMatches(transport, 'Transport', { ...transportReq, origin: '' }), false);
const cruiseReq = query('Cruise', { departurePort: 'Singapore', arrivalPort: 'Singapore', cruiseRegion: 'Singapore', sailingDate: '2026-11-10', cruiseReturnDate: '2026-11-17', cabinPreference: 'Balcony', cruiseLine: 'Registered line', cabins: 2 });
const cruise = service('Cruise', 'Singapore', { sailingDate: '2026-11-10', returnDate: '2026-11-17', origin: 'Singapore', destination: 'Singapore', region: 'Singapore', cabinClasses: ['Balcony'], cruiseLines: ['Registered line'], maxRooms: 2 });
assert.ok(serviceMatches(cruise, 'Cruise', cruiseReq));
assert.equal(serviceMatches(cruise, 'Cruise', { ...cruiseReq, destination: 'Mediterranean' }), false);
assert.equal(serviceMatches(cruise, 'Cruise', { ...cruiseReq, cabin: 'Suite' }), false);
assert.equal(serviceMatches(cruise, 'Cruise', { ...cruiseReq, startDate: '2026-11-11' }), false);
assert.equal(serviceMatches(cruise, 'Cruise', { ...cruiseReq, endDate: '2026-11-18' }), false);
assert.ok(productSuppliedBy(matchingProducts(cruise, 'Cruise', cruiseReq)[0], { vendorId: 'supplier' }));
assert.equal(productSuppliedBy(matchingProducts(cruise, 'Cruise', cruiseReq)[0], { vendorId: 'unrelated' }), false);

const catalogue = JSON.parse(await readFile(new URL('../data/vendor-service-catalog.json', import.meta.url), 'utf8'));
for (const [id, type] of [['QRY-2101', 'Flight'], ['QRY-2201', 'Accommodation'], ['QRY-2301', 'Visa'], ['QRY-2401', 'Cruise'], ['QRY-2501', 'Transport']]) {
  assert.equal(catalogue.services.filter((item) => serviceMatches(item, type, requirementsFor({ type, details: QUERY_SAMPLE_DETAILS[id] }))).length, 0, `No unrelated catalogue fallback for ${id}`);
}
assert.equal(requirementsFor({ type: 'Accommodation', title: 'Maldives stay' }).destination, '', 'Titles are not inferred against available suppliers');
console.log('PASS: both flight legs, direction, dates, time, cabin, airline, group capacity, property/location/room/meal, visa, cruise, transport, supplier ownership and all reported empty results.');

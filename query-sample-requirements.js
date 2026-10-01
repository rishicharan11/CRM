// Registered sample requirements come from the query records, never from the
// supplier catalogue. Dates not recorded by these samples stay unspecified.
const flightRoutes = [
  ['BLR', 'DXB', 'Round trip'], ['DEL', 'Goa', 'One way'], ['BOM', 'Singapore', 'One way'],
  ['Hyderabad', 'London', 'One way', 'Premium economy'], ['MAA', 'Colombo', 'One way'],
  ['Kolkata', 'Bangkok', 'One way'], ['BLR', 'Paris', 'Multi-city'], ['Pune', 'Leh', 'One way'],
  ['Ahmedabad', 'Bali', 'One way'], ['DEL', 'Tokyo', 'One way', 'Business'], ['BOM', 'COK', 'One way'], ['Jaipur', 'DXB', 'One way'],
];
const stays = [
  ['Maldives', 'Villa', 'Water villa'], ['Jaipur', 'Hotel'], ['Kochi', 'Hotel'], ['Shimla', 'Resort'],
  ['Dubai', 'Apartment'], ['Goa', 'Villa'], ['Singapore', 'Hotel'], ['Bali', 'Resort', 'Pool villa'],
  ['London', 'Hotel'], ['Kashmir', '', 'Houseboat'], ['Rajasthan', 'Hotel'], ['Andaman', '', 'Cottage'],
];
const visas = [
  ['Thailand', 'Tourist'], ['Schengen', 'Business'], ['UAE', '', 'Express'], ['Singapore', 'Tourist'],
  ['United Kingdom', 'Visitor'], ['Japan', 'Tourist'], ['Australia', 'Visitor'], ['United States', 'Business'],
  ['Sri Lanka', 'Electronic travel authorisation'], ['Vietnam', 'E-visa'], ['Turkey', 'Tourist'], ['Canada', 'Visitor'],
];
const cruises = ['Singapore', 'Mediterranean', 'Dubai', 'Alaska', 'Norwegian fjords', 'Greek islands', 'Lakshadweep', 'Caribbean', 'Nile', 'Mekong', 'Japan', 'Antarctica'];
const transportDestinations = ['Kerala', 'Rajasthan', 'Mumbai', 'Dubai', 'Sri Lanka', 'Goa', 'Ladakh', 'Singapore', 'Bali', 'Kashmir', 'London', 'Jaipur'];
export const QUERY_SAMPLE_DETAILS = Object.fromEntries([
  ...flightRoutes.map(([flightOrigin, flightDestination, journeyType, cabinClass], index) => [`QRY-${2101 + index}`, { flightOrigin, flightDestination, journeyType, ...(cabinClass ? { cabinClass } : {}) }]),
  ...stays.map(([stayDestination, accommodationType, roomType], index) => [`QRY-${2201 + index}`, { stayDestination, accommodationType, ...(roomType ? { roomType } : {}) }]),
  ...visas.map(([visaCountry, visaType, processingSpeed], index) => [`QRY-${2301 + index}`, { visaCountry, visaType, ...(processingSpeed ? { processingSpeed } : {}) }]),
  ...cruises.map((cruiseRegion, index) => [`QRY-${2401 + index}`, { cruiseRegion, ...(index === 0 ? { departurePort: 'Singapore', arrivalPort: 'Singapore' } : {}) }]),
  ...transportDestinations.map((transportDestination, index) => [`QRY-${2501 + index}`, { transportDestination }]),
]);

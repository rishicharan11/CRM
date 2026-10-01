import { build } from 'esbuild';
import { access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const vendorRoot = resolve(root, '../pakages-module/vendor-crm/src/data');
const output = resolve(root, 'data/vendor-service-catalog.json');
try {
  await access(resolve(vendorRoot, 'vendorDirectory.ts'));
} catch {
  // Published customer builds use the checked-in catalogue snapshot.
  await access(output);
  console.log('Using the bundled Vendor service catalogue.');
  process.exit(0);
}

const result = await build({
  stdin: {
    contents: `export { DIRECTORY_SERVICES, VENDOR_SERVICE_CONNECTIONS } from './vendorDirectory.ts';
      export { VENDOR_SERVICES } from './services.ts'; export { VENDORS } from './vendors.ts';`,
    resolveDir: vendorRoot,
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const module = { exports: {} };
new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
const { DIRECTORY_SERVICES, VENDOR_SERVICE_CONNECTIONS, VENDOR_SERVICES, VENDORS } = module.exports;
const vendors = VENDORS.map(({ id, code, name, initials, status, location, imageUrl }) => ({ id, code, name, initials, status, location, imageUrl }));
const services = DIRECTORY_SERVICES.map((service) => {
  const profile = VENDOR_SERVICES.find((item) => item.id === service.serviceId);
  return { ...service, imageUrl: profile?.imageUrl ?? '', description: profile?.about ?? '', inclusions: profile?.inclusions ?? [], exclusions: profile?.profile?.exclusions ?? [],
    queryProducts: (profile?.queryProducts ?? []).map((product) => ({ ...product, vendorIds: product.vendorIds ?? [profile.vendorId] })) };
});
// Include vendor-owned products that are not yet in the global directory.
for (const service of VENDOR_SERVICES) {
  if (services.some((item) => item.serviceId === service.id) || service.type === 'DMC/Ground handling') continue;
  const id = service.id;
  services.push({ id, serviceId: id, profileVendorId: service.vendorId, name: service.name,
    category: service.type === 'Activity' ? 'Activities' : service.type,
    location: service.location, status: service.status === 'draft' ? 'Draft' : 'Active', imageUrl: service.imageUrl,
    description: service.about ?? '', inclusions: service.inclusions ?? [], exclusions: service.profile?.exclusions ?? [],
    queryProducts: (service.queryProducts ?? []).map((product) => ({ ...product, vendorIds: product.vendorIds ?? [service.vendorId] })) });
  for (const card of service.rateCards ?? []) VENDOR_SERVICE_CONNECTIONS.push({
    id: `${id}-${service.vendorId}-${card.id}`, vendorId: service.vendorId, serviceId: id,
    supplierType: '', productsCovered: service.details, rateCardId: card.id, rateCardName: card.name,
    validity: '', status: service.status === 'draft' ? 'Draft' : 'Active',
  });
}
await writeFile(output, `${JSON.stringify({ services, vendors, connections: VENDOR_SERVICE_CONNECTIONS }, null, 2)}\n`);
console.log(`Synced ${services.length} services and ${VENDOR_SERVICE_CONNECTIONS.length} supplier relationships from Vendor CRM.`);

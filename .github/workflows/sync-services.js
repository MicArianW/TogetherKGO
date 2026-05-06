const fs = require('fs');
const path = require('path');

const servicesPath = 'data/services.json';
const servicesDir = 'data/services';

let services = [];

if (fs.existsSync(servicesPath)) {
  services = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
  console.log(`Loaded ${services.length} existing services`);
}

let maxId = 0;

services.forEach(service => {
  const match = service.id?.match(/fb(\d+)/);
  if (match) {
    maxId = Math.max(maxId, parseInt(match[1]));
  }
});

console.log(`Highest existing ID: fb${maxId}`);

const files = fs.readdirSync(servicesDir)
  .filter(file => file.endsWith('.json'));

console.log(`Found ${files.length} service listing files`);

files.forEach(file => {

  const filePath = path.join(servicesDir, file);

  const listing = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!listing.organization?.name) {
    console.log(`Skipping ${file}: missing name`);
    return;
  }

  let id = listing.organization?.id;

  if (!id) {
    maxId++;
    id = `fb${maxId}`;
  }

  const existingIndex = services.findIndex(s =>
  listing.organization?.id
    ? s.id === listing.organization.id
    : s.name === listing.organization.name
  );

  const serviceObj = {
    id: id,
    name: listing.organization.name,
    type: listing.organization.type || '',
    address: listing.organization.address || '',
    location: {
      lat: listing.location?.lat || 0,
      lng: listing.location?.lng || 0
    },
    hours: listing.hours || {},
    phone: listing.organization.phone || '',
    description: listing.organization.description || '',
    tags: listing.organization.tags || [],
    email: listing.organization.email || '',
    website: listing.organization.website || '',
    languages_spoken: listing.requirements?.languages_spoken || '',
    accessibility_info: listing.requirements?.accessibility_info || '',
    documents_required: listing.requirements?.documents_required || '',
    fees: listing.requirements?.fees || '',
    eligibility: listing.requirements?.eligibility || '',
    additional_info: listing.additional_info || listing.requirements?.additional_info || ''
  };

  if (existingIndex >= 0) {
    console.log(`Updating: ${listing.organization.name} (${id})`);
    services[existingIndex] = serviceObj;
  } else {
    console.log(`Adding: ${listing.organization.name} (${id})`);
    services.push(serviceObj);
  }

});

services.sort((a,b) => {
  const aNum = parseInt(a.id.replace('fb','')) || 0;
  const bNum = parseInt(b.id.replace('fb','')) || 0;
  return aNum - bNum;
});

fs.writeFileSync(servicesPath, JSON.stringify(services, null, 2));

console.log(`✅ Updated services.json (${services.length} services)`);

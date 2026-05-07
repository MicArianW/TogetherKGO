const fs = require("fs");

function isIP(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

const files = [
  "pageviews.csv",
  "visitors.csv",
  "sources.csv",
  "not_found.csv",
  "pages.csv",
  "bandwidth.csv"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  const lines = fs.readFileSync(file, "utf8").split("\n");

  const cleaned = lines.map(line => {
    const parts = line.split(",");

    if (isIP(parts[0])) {
      parts[0] = "cloud-traffic";
    }

    return parts.join(",");
  });

  fs.writeFileSync(file, cleaned.join("\n"));
}

console.log("CSV sanitized");
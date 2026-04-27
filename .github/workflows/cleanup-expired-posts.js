const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "data/posts");
const localAssetsDir = path.join(repoRoot, "assets");

function isExpired(value) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time <= Date.now();
}

function normalizeImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (/^https?:\/\//i.test(imagePath)) return null;

  const cleanPath = imagePath.replace(/^\//, "");
  return path.normalize(path.join(repoRoot, cleanPath));
}

if (!fs.existsSync(postsDir)) {
  console.log("No data/posts directory found. Nothing to clean.");
  process.exit(0);
}

const postFiles = fs.readdirSync(postsDir).filter((file) => file.endsWith(".json"));
const remainingImagePaths = new Set();
const expiredPostPaths = [];
const expiredImagePaths = new Set();

postFiles.forEach((file) => {
  const filePath = path.join(postsDir, file);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const expiresDate = raw && raw.post && raw.post.expiresDate;
  const imagePath = raw && raw.post && raw.post.image;
  const normalizedImagePath = normalizeImagePath(imagePath);

  if (isExpired(expiresDate)) {
    expiredPostPaths.push(filePath);
    if (normalizedImagePath && normalizedImagePath.startsWith(localAssetsDir)) {
      expiredImagePaths.add(normalizedImagePath);
    }
    return;
  }

  if (normalizedImagePath && normalizedImagePath.startsWith(localAssetsDir)) {
    remainingImagePaths.add(normalizedImagePath);
  }
});

if (!expiredPostPaths.length) {
  console.log("No expired posts found.");
  process.exit(0);
}

expiredPostPaths.forEach((filePath) => {
  fs.unlinkSync(filePath);
  console.log(`Deleted expired post: ${path.relative(repoRoot, filePath)}`);
});

expiredImagePaths.forEach((imagePath) => {
  if (!remainingImagePaths.has(imagePath) && fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    console.log(`Deleted unreferenced image: ${path.relative(repoRoot, imagePath)}`);
  }
});


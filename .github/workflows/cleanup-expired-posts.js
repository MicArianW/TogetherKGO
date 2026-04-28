const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "data/posts");
const postsAssetsDir = path.join(repoRoot, "assets/images/posts");

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

function listFilesRecursively(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return listFilesRecursively(entryPath);
    return [entryPath];
  });
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
  const imagePath = (raw && raw.post && (raw.post.thumbnail || raw.post.image)) || null;
  const normalizedImagePath = normalizeImagePath(imagePath);

  if (isExpired(expiresDate)) {
    expiredPostPaths.push(filePath);
    if (normalizedImagePath && normalizedImagePath.startsWith(postsAssetsDir)) {
      expiredImagePaths.add(normalizedImagePath);
    }
    return;
  }

  if (normalizedImagePath && normalizedImagePath.startsWith(postsAssetsDir)) {
    remainingImagePaths.add(normalizedImagePath);
  }
});

expiredPostPaths.forEach((filePath) => {
  fs.unlinkSync(filePath);
  console.log(`Deleted expired post: ${path.relative(repoRoot, filePath)}`);
});

const trackedImagePaths = new Set([
  ...expiredImagePaths,
  ...listFilesRecursively(postsAssetsDir)
]);

trackedImagePaths.forEach((imagePath) => {
  if (!remainingImagePaths.has(imagePath) && fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    console.log(`Deleted unreferenced image: ${path.relative(repoRoot, imagePath)}`);
  }
});

if (!expiredPostPaths.length && trackedImagePaths.size === remainingImagePaths.size) {
  console.log("No expired posts or orphaned images found.");
}

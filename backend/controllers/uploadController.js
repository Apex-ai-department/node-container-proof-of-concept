import multer from "multer";

export async function handleUpload(req, res) {
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
}

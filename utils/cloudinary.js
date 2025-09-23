import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

//NOTE: We have to import dotenv manually as cloudinary returns an error
//NOTE: That it cannot find the api key, so having it in our index.js isnt enough

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = async (buffer, folderId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `LearnHub/${folderId}`, resource_type: "auto" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileWithExtension = parts.pop(); // 'filename.jpg'
  const folder = parts.slice(-2).join("/"); // 'Grocerly/folderId'
  const publicId = `${folder}/${fileWithExtension.split(".")[0]}`;
  return publicId;
};

export const deleteImageFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
};

import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = async (
  buffer,
  folderId,
  resourceType = "image",
) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `LearnHub/${folderId}`, resource_type: resourceType },
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
  const folder = parts.slice(-2).join("/"); // 'LearnHub/folderId'
  const publicId = `${folder}/${fileWithExtension.split(".")[0]}`;
  return publicId;
};

export const deleteImageFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const deleteCourseFolderFromCloudinary = async (folderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const prefix = `LearnHub/${folderId}`;

      // Delete images in the folder
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "image",
      });

      // Delete videos in the folder
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: "video",
      });

      // Finally, delete the folder itself
      const result = await cloudinary.api.delete_folder(prefix);

      resolve(result);
    } catch (error) {
      console.error("Error deleting folder from Cloudinary:", error);
      reject(error);
    }
  });
};

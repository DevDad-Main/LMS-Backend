import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//#region Upload File To Cloudinary
/**
 * Uploads the specified file using Buffers and Streams.
 * @param {Int32Array} buffer
 * @param {string} folderId
 * @param {string} resourceType
 * @returns Promise -> If we successfully manage to pipe our stream with our buffered data file to Cloudinary
 */
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
//#endregion

//#region Get Public ID from URL
export const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileWithExtension = parts.pop(); // 'filename.jpg'
  const folder = parts.slice(-2).join("/"); // 'LearnHub/folderId'
  const publicId = `${folder}/${fileWithExtension.split(".")[0]}`;
  return publicId;
};
//#endregion

//#region Delete Image From Cloudinary
/**
 *
 * @param {string} publicId
 * @param {string} resourceType
 * @returns Promise on whether we have deleted the file or not
 */
export const deleteImageFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
//#endregion

//#region Delete Course Folder And It's Contents
/**
 * Deletes all files recursively from the specificed folderId and then cleans up by deleting the Folder
 * @param {string} folderId
 * @returns Promise -> Resolves after we delete all file contents and then deletes the course folder or rejects if we have an issue doing so
 */
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
//#endregion

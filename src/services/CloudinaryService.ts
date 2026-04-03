import axios from "axios";

const CLOUD_NAME = "dm45ej3sj";

export class CloudinaryService {
  static async uploadImage(file: File | Blob, preset: string = "Foto_clientes"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw new Error("Falha ao fazer upload da imagem.");
    }
  }

  static async uploadAudio(file: File | Blob, preset: string = "Audios_post"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    formData.append("resource_type", "video"); // Cloudinary treats audio as video resource type

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading audio to Cloudinary:", error);
      throw new Error("Falha ao fazer upload do áudio.");
    }
  }

  static async uploadVideo(file: File | Blob, preset: string = "Videos_post"): Promise<{ url: string; public_id: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    formData.append("resource_type", "video");

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        formData
      );
      return {
        url: response.data.secure_url,
        public_id: response.data.public_id
      };
    } catch (error) {
      console.error("Error uploading video to Cloudinary:", error);
      throw new Error("Falha ao fazer upload do vídeo.");
    }
  }

  static async uploadRaw(file: File | Blob, preset: string = "PDFs_post"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    console.log("Enviando para Cloudinary (Raw):");
    formData.forEach((value, key) => {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.type})` : value);
    });

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
      throw new Error("Falha ao fazer upload do documento.");
    }
  }
}

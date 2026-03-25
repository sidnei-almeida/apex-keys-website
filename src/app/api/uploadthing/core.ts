import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  avatar: f(
    {
      image: {
        maxFileSize: "1MB",
        maxFileCount: 1,
      },
    },
    {
      awaitServerData: false,
    },
  ).onUploadComplete(async () => {
    // Guardamos a URL no backend do Apex Keys (não aqui).
    return;
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;


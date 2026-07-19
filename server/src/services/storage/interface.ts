export interface FileStorage {
  uploadEngine(): any; // Multer storage engine
  getFileStream(fileId: string): NodeJS.ReadableStream | null;
  deleteFile(fileId: string): Promise<boolean>;
}

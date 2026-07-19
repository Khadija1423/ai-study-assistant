import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { FileStorage } from './interface';

export class GridFSFileStorage implements FileStorage {
  private storage: any = null;
  private gfsBucket: any = null;

  constructor() {
    this.init();
  }

  private init() {
    const uri = process.env.MONGODB_URI;

    // Check if we bypass MongoDB for testing
    if (!uri || process.env.SKIP_MONGO === 'true' || process.env.NODE_ENV === 'test') {
      console.warn(
        'Skipping GridFS initialization (SKIP_MONGO is true or MONGODB_URI is missing).',
      );
      return;
    }

    // Initialize GridFsStorage
    this.storage = new GridFsStorage({
      url: uri,
      file: (req, file) => {
        return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
            if (err) {
              return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            const fileInfo = {
              filename: filename,
              bucketName: 'uploads',
            };
            resolve(fileInfo);
          });
        });
      },
    });

    mongoose.connection.once('open', () => {
      this.gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db as any, {
        bucketName: 'uploads',
      });
    });
  }

  uploadEngine() {
    if (!this.storage) {
      // Fallback for mock environments
      return multer.memoryStorage();
    }
    return this.storage;
  }

  getFileStream(filename: string): NodeJS.ReadableStream | null {
    if (!this.gfsBucket) return null;

    try {
      // Using openDownloadStreamByName because we store the filename, not the ObjectId
      return this.gfsBucket.openDownloadStreamByName(filename);
    } catch (error) {
      console.error('Error getting file stream:', error);
      return null;
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    if (!this.gfsBucket) return false;

    try {
      // Find the file id by name first
      const files = await this.gfsBucket.find({ filename }).toArray();
      if (files.length === 0) return false;

      await this.gfsBucket.delete(files[0]._id);
      return true;
    } catch (error) {
      console.error('Error deleting file from GridFS:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const fileStorage = new GridFSFileStorage();

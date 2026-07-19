import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const extractTextFromFile = async (buffer: Buffer, mimetype: string): Promise<string> => {
  try {
    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error: any) {
    throw new Error(`Extraction failed: ${error.message || error}`);
  }
};

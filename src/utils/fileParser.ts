
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker using unpkg CDN (reliable alternative)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const parseFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return parsePDF(file);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return parseDOCX(file);
  } else if (fileType === 'text/plain') {
    return parseText(file);
  }

  throw new Error('Unsupported file type. Please upload PDF or DOCX files.');
};

const parseText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

const parsePDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const text = await extractTextFromPDF(arrayBuffer);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Load the PDF document using PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    let hasTextContent = false;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      if (pageText.trim().length > 0) {
        hasTextContent = true;
        fullText += pageText + '\n\n';
      }
    }

    const cleanedText = fullText.trim();
    
    // If we got meaningful text, return it
    if (cleanedText && cleanedText.length >= 50) {
      return cleanedText;
    }

    // If no text found, the PDF might be scanned - use OCR
    console.log('No text found in PDF, attempting OCR extraction...');
    return await extractTextFromPDFWithOCR(arrayBuffer, pdf);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
};

const extractTextFromPDFWithOCR = async (_arrayBuffer: ArrayBuffer, pdf: any): Promise<string> => {
  try {
    console.log('Starting OCR extraction...');
    const worker = await createWorker('eng');
    let fullText = '';

    // Process each page with OCR
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Render page to canvas
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to image and run OCR
      const imageData = canvas.toDataURL('image/png');
      console.log(`Processing page ${pageNum} of ${pdf.numPages} with OCR...`);
      
      const { data: { text } } = await worker.recognize(imageData);
      fullText += text + '\n\n';
    }

    await worker.terminate();

    const cleanedText = fullText.trim();
    
    if (!cleanedText || cleanedText.length < 50) {
      throw new Error('Could not extract meaningful text from the PDF using OCR. The image quality might be too low.');
    }

    console.log('OCR extraction completed successfully');
    return cleanedText;
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from scanned PDF. Please ensure the image quality is clear and readable.');
  }
};

const parseDOCX = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const text = await extractTextFromDOCX(arrayBuffer);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read DOCX file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromDOCX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Use mammoth library for better DOCX text extraction
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text || text.length < 50) {
      throw new Error('Could not extract meaningful text from DOCX file.');
    }

    return text;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. Please ensure it is a valid Word document.');
  }
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
};

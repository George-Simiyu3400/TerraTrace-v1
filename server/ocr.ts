import { GoogleGenAI } from '@google/genai';
import { createWorker } from 'tesseract.js';
import { DocumentExtractedFields, DocumentType, ExtractedFieldItem } from '../src/types/index.js';

let tesseractWorkerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const worker = await createWorker('eng');
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

export async function performOcr(buffer: Buffer, mimeType: string): Promise<string> {
  // If it's an image, run Tesseract OCR
  if (mimeType.startsWith('image/')) {
    try {
      const worker = await getWorker();
      const ret = await worker.recognize(buffer);
      return ret?.data?.text || '';
    } catch (err) {
      console.error('Tesseract OCR error:', err);
      // If tesseract fails for any reason, return empty string (do not invent text)
      return '';
    }
  }

  // If it's a PDF or text file
  if (mimeType === 'application/pdf') {
    // For PDFs, we can extract text streams or attempt OCR if converted
    const textSample = buffer.toString('utf-8');
    // Extract visible ASCII strings if plain PDF
    const matches = textSample.match(/[A-Za-z0-9\/\.\,\:\-\s]{4,}/g);
    if (matches && matches.length > 5) {
      return matches.join(' ');
    }
    return '';
  }

  return '';
}

export async function parseLandFields(
  rawText: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<DocumentExtractedFields> {
  const fields: DocumentExtractedFields = {
    rawText,
    ocrEngine: 'Tesseract OCR v5 (eng)',
  };

  // If GEMINI_API_KEY is available, we can use Gemini 3.8 Flash to intelligently parse the OCR text
  // STRICT RULE: Never fabricate values. If a field cannot be found in the text/image, leave it null/undefined.
  if (process.env.GEMINI_API_KEY && (rawText.trim().length > 0 || imageBuffer)) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a specialized Kenyan land-document OCR field parser for TerraTrace.
Analyze the following document raw text and/or image.
CRITICAL MANDATE:
1. NEVER fabricate or guess any value.
2. If a field is NOT explicitly mentioned or cannot be read, return null for that field.
3. Only extract fields that are genuinely legible in the provided text/image.
4. Distinguish Kenyan land identifiers:
   - parcelNumber (e.g., "NAIROBI/BLOCK 105/12", "LR NO. 209/1234", "KIAMBU/MUGUGA/501", "PLOT NO. 45")
   - titleNumber (e.g., "TITLE NO. 12345", "I.R. 78901", "C.R. 4567")
   - registeredOwner (exact full name of proprietor or registered owner as printed)
   - countyOrLocality (e.g., Nairobi, Kiambu, Machakos, Nakuru, etc.)
   - landArea (e.g., "0.045 Ha", "0.2 Hectares", "0.125 Acres")
   - documentType (e.g., "TITLE_DEED", "CERTIFICATE_OF_TITLE", "CERTIFICATE_OF_LEASE", "MUTATION_FORM", "ALLOTMENT_LETTER", "SURVEY_PLAN", "OFFICIAL_SEARCH", "OTHER_LAND_DOCUMENT")
   - registrationDate (e.g., "12/04/1998" or "15th June 2012")

Document Raw Text:
"""
${rawText}
"""

Return a valid JSON object matching this schema:
{
  "parcelNumber": string or null,
  "titleNumber": string or null,
  "registeredOwner": string or null,
  "countyOrLocality": string or null,
  "landArea": string or null,
  "documentType": string or null,
  "registrationDate": string or null,
  "confidenceScore": number (0.0 to 1.0 based on legibility)
}
Return ONLY valid JSON.`;

      let contents: any = prompt;
      if (imageBuffer && mimeType && mimeType.startsWith('image/')) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBuffer.toString('base64'),
              },
            },
            {
              text: prompt,
            },
          ],
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        const conf = typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85;

        if (parsed.parcelNumber && typeof parsed.parcelNumber === 'string') {
          fields.parcelNumber = {
            value: parsed.parcelNumber.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.parcelNumber.trim(),
          };
        }
        if (parsed.titleNumber && typeof parsed.titleNumber === 'string') {
          fields.titleNumber = {
            value: parsed.titleNumber.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.titleNumber.trim(),
          };
        }
        if (parsed.registeredOwner && typeof parsed.registeredOwner === 'string') {
          fields.registeredOwner = {
            value: parsed.registeredOwner.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.registeredOwner.trim(),
          };
        }
        if (parsed.countyOrLocality && typeof parsed.countyOrLocality === 'string') {
          fields.countyOrLocality = {
            value: parsed.countyOrLocality.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.countyOrLocality.trim(),
          };
        }
        if (parsed.landArea && typeof parsed.landArea === 'string') {
          fields.landArea = {
            value: parsed.landArea.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.landArea.trim(),
          };
        }
        if (parsed.documentType && typeof parsed.documentType === 'string') {
          fields.documentType = {
            value: parsed.documentType.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.documentType.trim(),
          };
        }
        if (parsed.registrationDate && typeof parsed.registrationDate === 'string') {
          fields.registrationDate = {
            value: parsed.registrationDate.trim(),
            confidence: conf,
            source: 'AI_ASSISTED',
            originalOcrValue: parsed.registrationDate.trim(),
          };
        }

        fields.ocrEngine = 'Tesseract OCR + Gemini 3.8 Flash Parser';
        return fields;
      }
    } catch (aiErr) {
      console.warn('Gemini parser unavailable or failed, falling back to deterministic rules parser:', aiErr);
    }
  }

  // Deterministic Kenyan Land Document Regex Rules Parser (No hallucination, strictly extracts what is present)
  parseDeterministicRules(rawText, fields);

  return fields;
}

function parseDeterministicRules(rawText: string, fields: DocumentExtractedFields) {
  if (!rawText || rawText.trim().length === 0) {
    return;
  }

  const text = rawText.replace(/\r\n/g, '\n');

  // 1. Parcel Reference Number
  // E.g., "LR NO 209/1234", "L.R. NO. 1870/IX/4", "BLOCK 105/12", "DAGORETTI/RIRUTA/123", "KIAMBU/MUGUGA/45"
  const parcelRegexes = [
    /(?:L\.?R\.?\s*(?:NO\.?|NUMBER)?\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
    /(?:PARCEL\s*(?:NO\.?|NUMBER)?\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
    /([A-Z]{3,}\/[A-Z0-9\s\-]+\/[0-9]+)/i,
    /(?:BLOCK\s*[:\s]*[0-9A-Z]+\s*[\/\-]\s*[0-9]+)/i,
    /(?:PLOT\s*(?:NO\.?|NUMBER)?\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
  ];

  for (const reg of parcelRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val.length >= 3 && val.length < 50) {
        fields.parcelNumber = {
          value: val,
          confidence: 0.78,
          source: 'OCR',
          originalOcrValue: val,
        };
        break;
      }
    }
  }

  // 2. Title Number / Deed Reference
  // E.g., "TITLE NO.", "TITLE NUMBER", "I.R. NO.", "C.R."
  const titleRegexes = [
    /(?:TITLE\s*(?:NO\.?|NUMBER|DEED\s*NO\.?)\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
    /(?:I\.?R\.?\s*(?:NO\.?|NUMBER)?\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
    /(?:C\.?R\.?\s*(?:NO\.?|NUMBER)?\s*[:\s]*)([0-9A-Z\/\.\-\_]+)/i,
  ];

  for (const reg of titleRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val.length >= 2 && val.length < 40) {
        fields.titleNumber = {
          value: val,
          confidence: 0.75,
          source: 'OCR',
          originalOcrValue: val,
        };
        break;
      }
    }
  }

  // 3. Registered Owner / Proprietor
  const ownerRegexes = [
    /(?:REGISTERED\s+PROPRIETOR|PROPRIETOR|REGISTERED\s+OWNER|OWNER|NAME\s+OF\s+OWNER|IN\s+THE\s+NAME\s+OF)\s*[:\s]*([A-Z\s\.\,\'\-]{3,60})/i,
    /(?:THIS\s+IS\s+TO\s+CERTIFY\s+THAT)\s+([A-Z\s\.\,\'\-]{4,60})\s+(?:IS|ARE)\s+(?:NOW)?\s+THE/i,
  ];

  for (const reg of ownerRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const cleaned = match[1].split('\n')[0].trim();
      if (cleaned.length >= 3 && !cleaned.toLowerCase().includes('certificate')) {
        fields.registeredOwner = {
          value: cleaned,
          confidence: 0.72,
          source: 'OCR',
          originalOcrValue: cleaned,
        };
        break;
      }
    }
  }

  // 4. Land Area
  const areaMatch = text.match(
    /(?:APPROXIMATE\s+AREA|AREA|APPROX\.?\s*AREA|SIZE)\s*[:\s]*([0-9\.,]+\s*(?:HA|HECTARES?|ACRES?|SQ\.?\s*M|M2|DECIMALS?))/i
  );
  if (areaMatch && areaMatch[1]) {
    const val = areaMatch[1].trim();
    fields.landArea = {
      value: val,
      confidence: 0.8,
      source: 'OCR',
      originalOcrValue: val,
    };
  }

  // 5. County or Locality
  const counties = [
    'Nairobi', 'Kiambu', 'Mombasa', 'Machakos', 'Kajiado', 'Nakuru', 'Uasin Gishu',
    'Kilifi', 'Kisumu', 'Kakamega', 'Nyeri', 'Meru', 'Murang\'a', 'Kericho',
    'Laikipia', 'Trans Nzoia', 'Baringo', 'Narok', 'Bomet', 'Embu', 'Kitui',
    'Makueni', 'Nyandarua', 'Kirinyaga', 'Taita Taveta', 'Kwale', 'Lamu', 'Garissa'
  ];
  for (const c of counties) {
    const reg = new RegExp(`\\b${c}\\b`, 'i');
    if (reg.test(text)) {
      fields.countyOrLocality = {
        value: c,
        confidence: 0.82,
        source: 'OCR',
        originalOcrValue: c,
      };
      break;
    }
  }

  // 6. Document Type
  if (/CERTIFICATE\s+OF\s+TITLE/i.test(text)) {
    fields.documentType = { value: 'CERTIFICATE_OF_TITLE', confidence: 0.9, source: 'OCR' };
  } else if (/CERTIFICATE\s+OF\s+LEASE/i.test(text)) {
    fields.documentType = { value: 'CERTIFICATE_OF_LEASE', confidence: 0.9, source: 'OCR' };
  } else if (/TITLE\s+DEED/i.test(text)) {
    fields.documentType = { value: 'TITLE_DEED', confidence: 0.9, source: 'OCR' };
  } else if (/MUTATION\s+FORM/i.test(text)) {
    fields.documentType = { value: 'MUTATION_FORM', confidence: 0.88, source: 'OCR' };
  } else if (/LETTER\s+OF\s+ALLOTMENT|ALLOTMENT\s+LETTER/i.test(text)) {
    fields.documentType = { value: 'ALLOTMENT_LETTER', confidence: 0.88, source: 'OCR' };
  } else if (/OFFICIAL\s+SEARCH|SEARCH\s+REPORT/i.test(text)) {
    fields.documentType = { value: 'OFFICIAL_SEARCH', confidence: 0.88, source: 'OCR' };
  }

  // 7. Registration Date
  const dateMatch = text.match(/(?:DATED|REGISTRATION\s+DATE|REGISTERED\s+ON|DATE\s+OF\s+ISSUE|DATE)\s*[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
  if (dateMatch && dateMatch[1]) {
    fields.registrationDate = {
      value: dateMatch[1].trim(),
      confidence: 0.75,
      source: 'OCR',
      originalOcrValue: dateMatch[1].trim(),
    };
  }
}

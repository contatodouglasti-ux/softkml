export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: KMLData;
}

export interface ValidationError {
  type: 'size' | 'type' | 'xml' | 'structure' | 'coordinates';
  message: string;
  details?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
}

export interface KMLData {
  documentName?: string;
  placemarks: PlacemarkData[];
  totalCoordinates: number;
}

export interface PlacemarkData {
  name: string;
  description?: string;
  coordinates: CoordinateData[];
}

export interface CoordinateData {
  longitude: number;
  latitude: number;
  altitude?: number;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function validateFileSize(file: File): ValidationError | null {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      type: 'size',
      message: `Arquivo muito grande: ${sizeMB} MB`,
      details: `O tamanho máximo permitido é 25 MB.`
    };
  }
  return null;
}

export function validateFileType(file: File): ValidationError | null {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension !== 'kml') {
    return {
      type: 'type',
      message: 'Tipo de arquivo inválido',
      details: `Extensão "${extension}" não é suportada. Apenas arquivos .kml são aceitos.`
    };
  }
  return null;
}

export function parseAndValidateKML(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Parse XML
  let xmlDoc: Document;
  try {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Check for XML parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      errors.push({
        type: 'xml',
        message: 'Erro na estrutura XML',
        details: parserError.textContent || 'O arquivo não possui uma estrutura XML válida.'
      });
      return { isValid: false, errors, warnings };
    }
  } catch (e) {
    errors.push({
      type: 'xml',
      message: 'Falha ao processar XML',
      details: 'O arquivo não pôde ser processado como XML.'
    });
    return { isValid: false, errors, warnings };
  }

  // Validate KML root element
  const kmlElement = xmlDoc.querySelector('kml');
  if (!kmlElement) {
    errors.push({
      type: 'structure',
      message: 'Elemento <kml> não encontrado',
      details: 'O arquivo deve conter um elemento raiz <kml>.'
    });
    return { isValid: false, errors, warnings };
  }

  // Check for Document or Folder
  const documentElement = kmlElement.querySelector('Document');
  const folderElement = kmlElement.querySelector('Folder');
  
  if (!documentElement && !folderElement) {
    warnings.push({
      type: 'structure',
      message: 'Nenhum elemento <Document> ou <Folder> encontrado. O arquivo pode não estar completo.'
    });
  }

  // Extract and validate Placemarks
  const placemarkElements = kmlElement.querySelectorAll('Placemark');
  
  if (placemarkElements.length === 0) {
    errors.push({
      type: 'structure',
      message: 'Nenhum <Placemark> encontrado',
      details: 'O arquivo KML deve conter pelo menos um elemento <Placemark> com coordenadas.'
    });
    return { isValid: false, errors, warnings };
  }

  const placemarks: PlacemarkData[] = [];
  let totalCoordinates = 0;

  placemarkElements.forEach((placemark, index) => {
    const nameElement = placemark.querySelector('name');
    const descriptionElement = placemark.querySelector('description');
    const coordinatesElements = placemark.querySelectorAll('coordinates');
    const lookAtElement = placemark.querySelector('LookAt');
    
    const placemarkName = nameElement?.textContent?.trim() || `Placemark ${index + 1}`;
    const coordinates: CoordinateData[] = [];

    // Validate that LookAt element exists
    if (!lookAtElement) {
      errors.push({
        type: 'structure',
        message: `Placemark "${placemarkName}" não possui elemento <LookAt>`,
        details: 'Cada Placemark deve conter um elemento <LookAt> com longitude, latitude, altitude, heading, tilt, gx:fovy, range e altitudeMode.'
      });
    } else {
      // Validate required LookAt sub-elements
      const requiredLookAtFields = ['longitude', 'latitude', 'altitude', 'heading', 'tilt', 'range', 'altitudeMode'];
      const missingFields = requiredLookAtFields.filter(field => {
        const el = lookAtElement.querySelector(field);
        return !el || !el.textContent?.trim();
      });
      
      if (missingFields.length > 0) {
        warnings.push({
          type: 'structure',
          message: `LookAt em "${placemarkName}" está incompleto. Campos faltando: ${missingFields.join(', ')}`
        });
      }
    }

    coordinatesElements.forEach((coordElement) => {
      const coordText = coordElement.textContent?.trim();
      if (coordText) {
        const coordPairs = coordText.split(/\s+/).filter(s => s.length > 0);
        
        coordPairs.forEach((pair) => {
          const parts = pair.split(',').map(p => parseFloat(p.trim()));
          
          if (parts.length >= 2) {
            const [longitude, latitude, altitude] = parts;
            
            if (isNaN(longitude) || isNaN(latitude)) {
              warnings.push({
                type: 'coordinates',
                message: `Coordenada inválida em "${placemarkName}": ${pair}`
              });
            } else if (longitude < -180 || longitude > 180) {
              warnings.push({
                type: 'coordinates',
                message: `Longitude fora do intervalo em "${placemarkName}": ${longitude}`
              });
            } else if (latitude < -90 || latitude > 90) {
              warnings.push({
                type: 'coordinates',
                message: `Latitude fora do intervalo em "${placemarkName}": ${latitude}`
              });
            } else {
              coordinates.push({
                longitude,
                latitude,
                altitude: isNaN(altitude) ? undefined : altitude
              });
            }
          }
        });
      }
    });

    if (coordinates.length === 0) {
      warnings.push({
        type: 'coordinates',
        message: `Placemark "${placemarkName}" não possui coordenadas válidas.`
      });
    }

    totalCoordinates += coordinates.length;
    placemarks.push({
      name: placemarkName,
      description: descriptionElement?.textContent?.trim(),
      coordinates
    });
  });

  // Get document name
  const docNameElement = documentElement?.querySelector(':scope > name') || 
                         folderElement?.querySelector(':scope > name');
  const documentName = docNameElement?.textContent?.trim();

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: {
      documentName,
      placemarks,
      totalCoordinates
    }
  };
}

export async function validateKMLFile(file: File): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Size validation
  const sizeError = validateFileSize(file);
  if (sizeError) {
    errors.push(sizeError);
    return { isValid: false, errors, warnings };
  }

  // Type validation
  const typeError = validateFileType(file);
  if (typeError) {
    errors.push(typeError);
    return { isValid: false, errors, warnings };
  }

  // Read and parse file content
  try {
    const content = await file.text();
    const result = parseAndValidateKML(content);
    
    return {
      isValid: result.isValid,
      errors: [...errors, ...result.errors],
      warnings: [...warnings, ...result.warnings],
      data: result.data
    };
  } catch (e) {
    errors.push({
      type: 'xml',
      message: 'Erro ao ler o arquivo',
      details: 'Não foi possível ler o conteúdo do arquivo.'
    });
    return { isValid: false, errors, warnings };
  }
}

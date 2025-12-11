import { CheckCircle2, XCircle, AlertTriangle, MapPin, FileText, Globe } from 'lucide-react';
import { ValidationResult, PlacemarkData } from '@/utils/kmlValidator';
import { cn } from '@/lib/utils';
import { MapView } from './MapView';

interface ValidationResultsProps {
  result: ValidationResult;
}

export function ValidationResults({ result }: ValidationResultsProps) {
  return (
    <div className="w-full space-y-6">
      {/* Status Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl",
        result.isValid 
          ? "bg-emerald-500/10 border border-emerald-500/20" 
          : "bg-destructive/10 border border-destructive/20"
      )}>
        {result.isValid ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-8 h-8 text-destructive shrink-0" />
        )}
        <div>
          <h3 className={cn(
            "font-semibold text-lg",
            result.isValid ? "text-emerald-600" : "text-destructive"
          )}>
            {result.isValid ? "Arquivo KML válido!" : "Arquivo KML inválido"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.isValid 
              ? "Todas as validações foram aprovadas com sucesso."
              : `${result.errors.length} erro(s) encontrado(s).`}
          </p>
        </div>
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Erros
          </h4>
          <div className="space-y-2">
            {result.errors.map((error, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <p className="font-medium text-foreground">{error.message}</p>
                {error.details && (
                  <p className="text-sm text-muted-foreground mt-1">{error.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-amber-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Avisos ({result.warnings.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.warnings.map((warning, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <p className="text-sm text-foreground">{warning.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Summary */}
      {result.data && result.isValid && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resumo do Arquivo
          </h4>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.data.documentName && (
              <div className="col-span-2 sm:col-span-3 p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Nome do Documento</p>
                <p className="font-medium text-foreground truncate">{result.data.documentName}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Placemarks</p>
              <p className="text-2xl font-bold text-primary">{result.data.placemarks.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Coordenadas</p>
              <p className="text-2xl font-bold text-primary">{result.data.totalCoordinates}</p>
            </div>
          </div>

          {/* Placemarks List */}
          {result.data.placemarks.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Placemarks encontrados
              </h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.data.placemarks.map((placemark, index) => (
                  <PlacemarkCard key={index} placemark={placemark} />
                ))}
              </div>
            </div>
          )}

          {/* Map View */}
          {result.data.placemarks.length > 0 && (
            <MapView placemarks={result.data.placemarks} />
          )}
        </div>
      )}
    </div>
  );
}

function PlacemarkCard({ placemark }: { placemark: PlacemarkData }) {
  return (
    <div className="p-3 rounded-lg bg-card border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{placemark.name}</p>
          {placemark.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {placemark.description}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {placemark.coordinates.length} pts
        </span>
      </div>
      
      {placemark.coordinates.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Primeira coordenada:</p>
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {placemark.coordinates[0].latitude.toFixed(6)}, {placemark.coordinates[0].longitude.toFixed(6)}
            {placemark.coordinates[0].altitude !== undefined && ` (alt: ${placemark.coordinates[0].altitude}m)`}
          </code>
        </div>
      )}
    </div>
  );
}

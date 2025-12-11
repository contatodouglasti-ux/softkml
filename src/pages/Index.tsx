import { useState } from 'react';
import { MapPin, FileSearch, Plus } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ValidationResults } from '@/components/ValidationResults';
import { validateKMLFile, ValidationResult } from '@/utils/kmlValidator';
import { MapEditor } from '@/components/MapEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setValidationResult(null);

    try {
      const result = await validateKMLFile(file);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [{
          type: 'xml',
          message: 'Erro inesperado',
          details: 'Ocorreu um erro ao processar o arquivo.'
        }],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">KML Tools</h1>
              <p className="text-sm text-muted-foreground">Validar e criar arquivos KML</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="validate" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="validate" className="flex items-center gap-2">
              <FileSearch className="w-4 h-4" />
              Validar KML
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar KML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validate">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Upload Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileSearch className="w-5 h-5" />
                  <span className="text-sm font-medium">Selecione um arquivo para validar</span>
                </div>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  selectedFile={selectedFile}
                  onClear={handleClear}
                />
              </section>

              {/* Loading State */}
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Validando arquivo...</span>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {validationResult && !isProcessing && (
                <section>
                  <ValidationResults result={validationResult} />
                </section>
              )}

              {/* Info Section */}
              {!selectedFile && !validationResult && (
                <section className="p-6 rounded-xl bg-muted/30 border">
                  <h2 className="font-semibold text-foreground mb-4">Validações realizadas:</h2>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><strong className="text-foreground">Tamanho do arquivo:</strong> máximo de 25 MB</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><strong className="text-foreground">Tipo de arquivo:</strong> apenas .kml</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><strong className="text-foreground">Estrutura XML:</strong> sintaxe válida e bem formatada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><strong className="text-foreground">Elementos obrigatórios:</strong> &lt;kml&gt;, &lt;Placemark&gt;, coordenadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span><strong className="text-foreground">Coordenadas:</strong> latitude (-90 a 90), longitude (-180 a 180)</span>
                    </li>
                  </ul>
                </section>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <div className="max-w-5xl mx-auto">
              <MapEditor />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

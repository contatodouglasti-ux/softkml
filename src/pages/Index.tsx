import { useState } from 'react';
import { FileSearch, Plus, CheckCircle2 } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ValidationResults } from '@/components/ValidationResults';
import { validateKMLFile, ValidationResult } from '@/utils/kmlValidator';
import { MapEditor } from '@/components/MapEditor';
import softplanLogo from '@/assets/softplan-logo.png';

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
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={softplanLogo} alt="Softplan" className="h-8" />
              <div className="border-l pl-4">
                <h1 className="text-lg font-bold text-foreground">Gerador e Validador de KML</h1>
                <p className="text-xs text-muted-foreground">Crie novos polígonos e pontos ou valide arquivos existentes num único lugar.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full border border-primary text-primary text-xs font-semibold">
              Versão 2.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criar KML - Left (2/3) */}
          <div className="lg:col-span-2 bg-card rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Criar KML</h2>
              </div>
              <span className="text-sm text-muted-foreground">Clique no mapa para adicionar pontos</span>
            </div>
            <MapEditor />
          </div>

          {/* Validar KML - Right (1/3) */}
          <div className="bg-card rounded-2xl border p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileSearch className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Validar KML</h2>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              selectedFile={selectedFile}
              onClear={handleClear}
            />

            {/* Loading State */}
            {isProcessing && (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground text-sm">Validando arquivo...</span>
                </div>
              </div>
            )}

            {/* Validation Results */}
            {validationResult && !isProcessing && (
              <ValidationResults result={validationResult} />
            )}

            {/* Info Section */}
            {!selectedFile && !validationResult && (
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h3 className="font-semibold text-foreground mb-4">Validações realizadas:</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Tamanho do arquivo:</strong> máximo de 25 MB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Tipo de arquivo:</strong> apenas .kml</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Estrutura XML:</strong> sintaxe válida e formatação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Elementos obrigatórios:</strong> &lt;kml&gt;, &lt;Placemark&gt;, coordenadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Coordenadas:</strong> latitude (-90 a 90), longitude (-180 a 180)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={softplanLogo} alt="Softplan" className="h-5" />
            <span className="text-sm font-bold text-foreground">Planejamento e Sistemas</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 Softplan. Todos os direitos reservados.</span>
            <a href="#" className="hover:text-foreground transition-colors">Termos de uso</a>
            <span>•</span>
            <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

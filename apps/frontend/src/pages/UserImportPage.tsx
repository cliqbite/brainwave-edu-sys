import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button } from '../components/ui';
import { UserPlus, HardDriveUpload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { importsApi } from '../api/endpoints';

const UserImportPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      // Pass dryRun=false since we want to actually import
      // If we wanted to preview first, we'd do dryRun=true
      return importsApi.uploadUsers(formData);
    },
    onSuccess: (res) => {
      setImportResult(res.data?.data);
      toast.success('File imported successfully!');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to import users');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      setSelectedFile(file);
      setImportResult(null); // Reset previous result
    } else {
      toast.error('Please upload a .csv or .xlsx file');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
          <UserPlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Import Users</h1>
          <p className="text-muted">Upload CSV or Excel files to bulk create users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-1">
              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleChange}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-full">
                      <FileSpreadsheet size={48} />
                    </div>
                    <div>
                      <p className="font-medium text-lg">{selectedFile.name}</p>
                      <p className="text-muted text-sm">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" onClick={() => setSelectedFile(null)}>
                        Clear
                      </Button>
                      <Button 
                        onClick={handleUpload} 
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          'Start Import'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted/10 text-muted-foreground rounded-full">
                      <HardDriveUpload size={48} />
                    </div>
                    <div>
                      <p className="font-medium text-lg">Drag and drop your file here</p>
                      <p className="text-muted text-sm mt-1">Supports .csv, .xlsx, and .xls formats</p>
                    </div>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4">
                      Select File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {importResult && (
            <Card className="p-6 border-green-500/30 bg-green-500/5">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-green-500">
                <CheckCircle2 size={20} />
                Import Completed
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-muted text-sm">Total Processed</p>
                  <p className="text-2xl font-bold">{importResult.totalProcessed || 0}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-muted text-sm">Successfully Created</p>
                  <p className="text-2xl font-bold text-green-500">{importResult.successfulCount || 0}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <p className="text-muted text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-500">{importResult.failedCount || 0}</p>
                </div>
              </div>
            </Card>
          )}

          {uploadMutation.isError && (
             <Card className="p-6 border-red-500/30 bg-red-500/5">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-red-500">
                 <AlertCircle size={20} />
                 Import Failed
               </h3>
               <p className="text-muted">
                 {(uploadMutation.error as any)?.response?.data?.message || 'An unknown error occurred while importing.'}
               </p>
             </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">File Requirements</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>File must be in <strong>.csv</strong> or <strong>.xlsx</strong> format</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>First row must contain the exact column headers</p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>Maximum file size is <strong>5MB</strong></p>
              </li>
            </ul>

            <h3 className="font-semibold mt-6 mb-4">Required Columns</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="p-2 bg-secondary/10 rounded border border-border text-xs">name (Required)</div>
              <div className="p-2 bg-secondary/10 rounded border border-border text-xs">email (Required)</div>
              <div className="p-2 bg-secondary/10 rounded border border-border text-xs">password (Required)</div>
            </div>

            <h3 className="font-semibold mt-6 mb-4">Optional Columns</h3>
            <div className="space-y-2 text-sm font-mono opacity-80">
              <div className="p-2 bg-muted/20 rounded border border-border text-xs">phone</div>
              <div className="p-2 bg-muted/20 rounded border border-border text-xs">whatsappNumber</div>
              <div className="p-2 bg-muted/20 rounded border border-border text-xs">rollNumber</div>
              <div className="p-2 bg-muted/20 rounded border border-border text-xs">department</div>
              <div className="p-2 bg-muted/20 rounded border border-border text-xs">className</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserImportPage;

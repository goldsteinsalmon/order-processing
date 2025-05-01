
import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import { Customer, Product } from "@/types";
import { useToast } from "@/hooks/use-toast";

const ImportManagement: React.FC = () => {
  const { addCustomer, addProduct } = useData();
  const { toast } = useToast();
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    isLoading: boolean;
    success: boolean;
    error: string | null;
    type: string | null;
    count: number;
  }>({
    isLoading: false,
    success: false,
    error: null,
    type: null,
    count: 0
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'customers' | 'products') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'customers') {
        setCustomerFile(e.target.files[0]);
      } else {
        setProductFile(e.target.files[0]);
      }
    }
  };

  // Generate and download template
  const downloadTemplate = (type: 'customers' | 'products') => {
    const customerTemplate = [
      "name,email,phone,address,type,account_number,on_hold,hold_reason,needs_detailed_box_labels",
      "Example Ltd,example@email.com,01234567890,123 Example St,Trade,ACC123,FALSE,,TRUE",
      "John Smith,john@email.com,07123456789,456 Sample Rd,Private,,,,"
    ].join('\n');
    
    const productTemplate = [
      "name,sku,description,stock_level,weight,requires_weight_input,unit,required",
      "Product One,SKU001,Sample product description,100,0.5,TRUE,kg,FALSE",
      "Product Two,SKU002,Another product,50,1,,kg,TRUE"
    ].join('\n');
    
    const content = type === 'customers' ? customerTemplate : productTemplate;
    const filename = `${type}-template.csv`;
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
      // For IE
      navigator.msSaveBlob(blob, filename);
    } else {
      // For other browsers
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Process CSV import
  const handleImport = async (type: 'customers' | 'products') => {
    const file = type === 'customers' ? customerFile : productFile;
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }
    
    setUploadStatus({
      isLoading: true,
      success: false,
      error: null,
      type,
      count: 0
    });
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setUploadStatus({
            isLoading: false,
            success: false,
            error: `Error parsing CSV: ${results.errors[0].message}`,
            type,
            count: 0
          });
          return;
        }
        
        try {
          if (type === 'customers') {
            await processCustomers(results.data);
          } else {
            await processProducts(results.data);
          }
        } catch (error) {
          setUploadStatus({
            isLoading: false,
            success: false,
            error: `Error processing data: ${error instanceof Error ? error.message : String(error)}`,
            type,
            count: 0
          });
        }
      },
      error: (error) => {
        setUploadStatus({
          isLoading: false,
          success: false,
          error: `Error reading file: ${error.message}`,
          type,
          count: 0
        });
      }
    });
  };

  // Process customer data
  const processCustomers = async (data: any[]) => {
    try {
      let successCount = 0;
      
      for (const row of data) {
        const customer: Customer = {
          id: '', // Will be assigned by addCustomer
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          type: (row.type === 'Trade' ? 'Trade' : 'Private') as 'Trade' | 'Private',
          account_number: row.account_number,
          on_hold: row.on_hold?.toLowerCase() === 'true',
          hold_reason: row.hold_reason || undefined,
          needs_detailed_box_labels: row.needs_detailed_box_labels?.toLowerCase() === 'true'
        };
        
        const result = await addCustomer(customer);
        if (result) successCount++;
      }
      
      setUploadStatus({
        isLoading: false,
        success: true,
        error: null,
        type: 'customers',
        count: successCount
      });
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${successCount} customers.`,
      });
      
      // Reset file input
      setCustomerFile(null);
    } catch (error) {
      setUploadStatus({
        isLoading: false,
        success: false,
        error: `Error importing customers: ${error instanceof Error ? error.message : String(error)}`,
        type: 'customers',
        count: 0
      });
      
      toast({
        title: "Import Failed",
        description: `Error importing customers: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Process product data
  const processProducts = async (data: any[]) => {
    try {
      const products: Product[] = data.map(row => ({
        id: '', // Will be assigned by addProduct
        name: row.name,
        sku: row.sku,
        description: row.description,
        stock_level: parseInt(row.stock_level) || 0,
        weight: row.weight ? parseFloat(row.weight) : undefined,
        requires_weight_input: row.requires_weight_input?.toLowerCase() === 'true',
        unit: row.unit || undefined,
        required: row.required?.toLowerCase() === 'true'
      }));
      
      const result = await addProduct(products);
      const successCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
      
      setUploadStatus({
        isLoading: false,
        success: true,
        error: null,
        type: 'products',
        count: successCount
      });
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${successCount} products.`,
      });
      
      // Reset file input
      setProductFile(null);
    } catch (error) {
      setUploadStatus({
        isLoading: false,
        success: false,
        error: `Error importing products: ${error instanceof Error ? error.message : String(error)}`,
        type: 'products',
        count: 0
      });
      
      toast({
        title: "Import Failed",
        description: `Error importing products: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const resetStatus = (type: 'customers' | 'products') => {
    if (uploadStatus.type === type) {
      setUploadStatus({
        isLoading: false,
        success: false,
        error: null,
        type: null,
        count: 0
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Import Customers</TabsTrigger>
          <TabsTrigger value="products">Import Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Customers</CardTitle>
              <CardDescription>
                Upload a CSV file with customer details to import multiple customers at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('customers')}
                  className="mb-4"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Download and fill out the template CSV file with your customer information.
                </p>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="customer-csv">Upload Customer CSV</Label>
                <Input 
                  id="customer-csv"
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => {
                    handleFileChange(e, 'customers');
                    resetStatus('customers');
                  }}
                />
              </div>
              
              <Button
                onClick={() => handleImport('customers')}
                disabled={!customerFile || uploadStatus.isLoading}
                className="mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadStatus.isLoading && uploadStatus.type === 'customers' 
                  ? "Importing..." 
                  : "Import Customers"
                }
              </Button>
              
              {uploadStatus.type === 'customers' && (
                <div className="mt-4">
                  {uploadStatus.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>{uploadStatus.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadStatus.success && (
                    <Alert variant="default" className="bg-green-50 border-green-500">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Import Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Successfully imported {uploadStatus.count} customers.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Products</CardTitle>
              <CardDescription>
                Upload a CSV file with product details to import multiple products at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('products')}
                  className="mb-4"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Download and fill out the template CSV file with your product information.
                </p>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="product-csv">Upload Product CSV</Label>
                <Input 
                  id="product-csv"
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => {
                    handleFileChange(e, 'products');
                    resetStatus('products');
                  }}
                />
              </div>
              
              <Button
                onClick={() => handleImport('products')}
                disabled={!productFile || uploadStatus.isLoading}
                className="mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadStatus.isLoading && uploadStatus.type === 'products' 
                  ? "Importing..." 
                  : "Import Products"
                }
              </Button>
              
              {uploadStatus.type === 'products' && (
                <div className="mt-4">
                  {uploadStatus.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>{uploadStatus.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadStatus.success && (
                    <Alert variant="default" className="bg-green-50 border-green-500">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Import Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Successfully imported {uploadStatus.count} products.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportManagement;

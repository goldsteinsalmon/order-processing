import React, { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Package, ArrowUpDown, Info } from "lucide-react";
import Layout from "@/components/Layout";
import { format, parseISO, isValid } from "date-fns";
import { BatchUsage } from "@/types";
import { adaptBatchUsageToCamelCase } from "@/utils/typeAdapters";

const BatchTrackingPage: React.FC = () => {
  const { batchUsages } = useData();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("lastUsed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filteredBatches, setFilteredBatches] = useState<BatchUsage[]>([]);
  
  // Process batch data to ensure consistent property naming
  const processBatchData = (batchData: any[]) => {
    return batchData.map(batch => adaptBatchUsageToCamelCase(batch));
  };
  
  useEffect(() => {
    // Apply search filter and sorting
    let filtered = [...batchUsages];
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.batchNumber.toLowerCase().includes(lowerSearchTerm) ||
        batch.productName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof BatchUsage];
      let bValue: any = b[sortField as keyof BatchUsage];
      
      // Handle date fields
      if (sortField === "firstUsed" || sortField === "lastUsed") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }
      
      // Handle numeric fields
      if (sortField === "totalWeight" || sortField === "usedWeight" || sortField === "ordersCount") {
        aValue = Number(aValue || 0);
        bValue = Number(bValue || 0);
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    setFilteredBatches(filtered);
  }, [batchUsages, searchTerm, sortField, sortDirection]);
  
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "-";
    } catch (error) {
      return "-";
    }
  };
  
  const calculateUsagePercentage = (used: number, total: number) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };
  
  const getUsageStatusColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-green-500";
  };
  
  const viewBatchDetails = (batchNumber: string) => {
    navigate(`/batch/${batchNumber}`);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Batch Tracking</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search batches..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Batch Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("batchNumber")}>
                    <div className="flex items-center">
                      Batch Number
                      {sortField === "batchNumber" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("productName")}>
                    <div className="flex items-center">
                      Product
                      {sortField === "productName" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("totalWeight")}>
                    <div className="flex items-center">
                      Total Weight
                      {sortField === "totalWeight" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("usedWeight")}>
                    <div className="flex items-center">
                      Used
                      {sortField === "usedWeight" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("ordersCount")}>
                    <div className="flex items-center">
                      Orders
                      {sortField === "ordersCount" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("firstUsed")}>
                    <div className="flex items-center">
                      First Used
                      {sortField === "firstUsed" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastUsed")}>
                    <div className="flex items-center">
                      Last Used
                      {sortField === "lastUsed" && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No batch data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => {
                    const usagePercentage = calculateUsagePercentage(
                      batch.usedWeight,
                      batch.totalWeight
                    );
                    const statusColor = getUsageStatusColor(usagePercentage);
                    
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="font-mono">
                            {batch.batchNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>{batch.productName}</TableCell>
                        <TableCell>{batch.totalWeight.toLocaleString()}g</TableCell>
                        <TableCell>{batch.usedWeight.toLocaleString()}g</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className={`h-2.5 rounded-full ${statusColor}`}
                                style={{ width: `${usagePercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{usagePercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{batch.ordersCount}</Badge>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          {formatDate(batch.firstUsed)}
                        </TableCell>
                        <TableCell className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          {formatDate(batch.lastUsed)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBatchDetails(batch.batchNumber)}
                          >
                            <Info className="h-4 w-4 mr-1" /> Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BatchTrackingPage;

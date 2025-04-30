
import React, { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/types";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CustomerSelectionStepProps {
  onCustomerSelect: (customerId: string) => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
}

const CustomerSelectionStep: React.FC<CustomerSelectionStepProps> = ({ 
  onCustomerSelect, 
  customers,
  selectedCustomer
}) => {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Filter customers using the same logic as in the Customers page
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    if (customerSearch.trim()) {
      const lowerSearch = customerSearch.toLowerCase();
      filtered = customers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(lowerSearch);
        const emailMatch = customer.email ? customer.email.toLowerCase().includes(lowerSearch) : false;
        const phoneMatch = customer.phone ? customer.phone.includes(customerSearch) : false;
        const accountMatch = customer.accountNumber ? customer.accountNumber.toLowerCase().includes(lowerSearch) : false;
        
        return nameMatch || emailMatch || phoneMatch || accountMatch;
      });
    }
    
    // Sort by account number alphabetically
    return filtered.sort((a, b) => {
      const accountA = a.accountNumber || '';
      const accountB = b.accountNumber || '';
      return accountA.localeCompare(accountB);
    });
  }, [customers, customerSearch]);
  
  const handleSelectCustomer = (customerId: string) => {
    setShowCustomerSearch(false);
    onCustomerSelect(customerId);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
        <p className="text-gray-500 mb-4">
          Choose a customer to create an order for
        </p>
        <Button 
          type="button"
          variant="outline" 
          className="w-full justify-between h-auto py-6 text-lg"
          onClick={() => setShowCustomerSearch(true)}
        >
          {selectedCustomer ? (
            <div className="flex items-center justify-start text-left">
              <span className="font-medium">{selectedCustomer.name}</span>
              {selectedCustomer.accountNumber && (
                <span className="ml-2 text-muted-foreground">({selectedCustomer.accountNumber})</span>
              )}
              {selectedCustomer.needsDetailedBoxLabels && (
                <Package className="ml-2 h-4 w-4 text-blue-500" />
              )}
              {selectedCustomer.onHold && (
                <span className="ml-2 text-red-500">(On Hold)</span>
              )}
            </div>
          ) : (
            "Select a customer to begin..."
          )}
          <Search className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </div>
      
      <CommandDialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput 
            placeholder="Search customers by name, email, phone or account..."
            value={customerSearch}
            onValueChange={setCustomerSearch}
            autoFocus={true}
            className="pl-8"
          />
        </div>
        <CommandList>
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandGroup heading="Customers">
            {filteredCustomers.map(customer => (
              <CommandItem 
                key={customer.id} 
                value={customer.name} // Use name as the value for matching
                onSelect={() => handleSelectCustomer(customer.id)}
                className={customer.onHold ? "text-red-500 font-medium" : ""}
              >
                <div className="flex items-center">
                  {customer.name}
                  {customer.needsDetailedBoxLabels && (
                    <Package className="ml-2 h-4 w-4 text-blue-500" />
                  )}
                </div>
                {customer.accountNumber && <span className="ml-2 text-muted-foreground">({customer.accountNumber})</span>}
                {customer.onHold && " (On Hold)"}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default CustomerSelectionStep;


import React, { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { Customer } from '@/types';
import { CommandInput, CommandItem, CommandList, CommandGroup, Command } from '@/components/ui/command';
import { adaptCustomerToCamelCase } from '@/lib/utils';

interface CustomerSelectionStepProps {
  customers: Customer[];
  onCustomerSelect: (customerId: string) => void;
  selectedCustomer: Customer | null;
  disabled?: boolean;
}

const CustomerSelectionStep: React.FC<CustomerSelectionStepProps> = ({
  customers,
  onCustomerSelect,
  selectedCustomer,
  disabled = false
}) => {
  const [customerSearch, setCustomerSearch] = useState('');

  // Process customers to ensure camelCase properties
  const processedCustomers = useMemo(() => {
    return customers.map(customer => adaptCustomerToCamelCase(customer));
  }, [customers]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    let filtered = [...processedCustomers];
    
    if (customerSearch.trim()) {
      const lowerSearch = customerSearch.toLowerCase();
      filtered = processedCustomers.filter(customer => {
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
  }, [processedCustomers, customerSearch]);

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    onCustomerSelect(customerId);
  };

  // Process selected customer
  const processedSelectedCustomer = selectedCustomer ? adaptCustomerToCamelCase(selectedCustomer) : null;

  return (
    <div className="space-y-4">
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search customers..." 
          onValueChange={setCustomerSearch}
          value={customerSearch}
          disabled={disabled}
        />
        
        <CommandList>
          <CommandGroup>
            {processedSelectedCustomer ? (
              <div className="flex items-center justify-start text-left p-2">
                <span className="font-medium">{processedSelectedCustomer.name}</span>
                {processedSelectedCustomer.accountNumber && (
                  <span className="ml-2 text-muted-foreground">({processedSelectedCustomer.accountNumber})</span>
                )}
                {processedSelectedCustomer.needsDetailedBoxLabels && (
                  <Package className="ml-2 h-4 w-4 text-blue-500" />
                )}
                {processedSelectedCustomer.onHold && (
                  <span className="ml-2 text-red-500">(On Hold)</span>
                )}
              </div>
            ) : (
              <p className="p-2 text-sm text-muted-foreground">
                Select a customer to begin...
              </p>
            )}
          </CommandGroup>

          {!processedSelectedCustomer && (
            <CommandGroup heading="Customers">
              {filteredCustomers.map(customer => (
                <CommandItem 
                  key={customer.id} 
                  value={customer.name}
                  onSelect={() => handleSelectCustomer(customer.id)}
                  className={customer.onHold ? "text-red-500 font-medium" : ""}
                  disabled={disabled}
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
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default CustomerSelectionStep;

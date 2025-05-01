
import React, { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { Customer } from '@/types';
import { CommandInput, CommandItem, CommandList, CommandGroup, Command } from '@/components/ui/command';

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

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    
    if (customerSearch.trim()) {
      const lowerSearch = customerSearch.toLowerCase();
      filtered = customers.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(lowerSearch);
        const emailMatch = customer.email ? customer.email.toLowerCase().includes(lowerSearch) : false;
        const phoneMatch = customer.phone ? customer.phone.includes(customerSearch) : false;
        const accountMatch = customer.account_number ? customer.account_number.toLowerCase().includes(lowerSearch) : false;
        
        return nameMatch || emailMatch || phoneMatch || accountMatch;
      });
    }
    
    // Sort by account number alphabetically
    return filtered.sort((a, b) => {
      const accountA = a.account_number || '';
      const accountB = b.account_number || '';
      return accountA.localeCompare(accountB);
    });
  }, [customers, customerSearch]);

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    onCustomerSelect(customerId);
  };

  return (
    <div className="space-y-4">
      <Command disabled={disabled} className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search customers..." 
          onValueChange={setCustomerSearch}
          value={customerSearch}
          disabled={disabled}
        />
        
        <CommandList>
          <CommandGroup>
            {selectedCustomer ? (
              <div className="flex items-center justify-start text-left p-2">
                <span className="font-medium">{selectedCustomer.name}</span>
                {selectedCustomer.account_number && (
                  <span className="ml-2 text-muted-foreground">({selectedCustomer.account_number})</span>
                )}
                {selectedCustomer.needs_detailed_box_labels && (
                  <Package className="ml-2 h-4 w-4 text-blue-500" />
                )}
                {selectedCustomer.on_hold && (
                  <span className="ml-2 text-red-500">(On Hold)</span>
                )}
              </div>
            ) : (
              <p className="p-2 text-sm text-muted-foreground">
                Select a customer to begin...
              </p>
            )}
          </CommandGroup>

          {!selectedCustomer && (
            <CommandGroup heading="Customers">
              {filteredCustomers.map(customer => (
                <CommandItem 
                  key={customer.id} 
                  value={customer.name} // Use name as the value for matching
                  onSelect={() => handleSelectCustomer(customer.id)}
                  className={customer.on_hold ? "text-red-500 font-medium" : ""}
                  disabled={disabled}
                >
                  <div className="flex items-center">
                    {customer.name}
                    {customer.needs_detailed_box_labels && (
                      <Package className="ml-2 h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {customer.account_number && <span className="ml-2 text-muted-foreground">({customer.account_number})</span>}
                  {customer.on_hold && " (On Hold)"}
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

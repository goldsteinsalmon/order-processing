
// Update the filteredCustomers memo to use the correct property names
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

// Update the customer display section to use correct property names
{selectedCustomer ? (
  <div className="flex items-center justify-start text-left">
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
  "Select a customer to begin..."
)}

// Update the customer items in the dropdown to use correct property names
{filteredCustomers.map(customer => (
  <CommandItem 
    key={customer.id} 
    value={customer.name} // Use name as the value for matching
    onSelect={() => handleSelectCustomer(customer.id)}
    className={customer.on_hold ? "text-red-500 font-medium" : ""}
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

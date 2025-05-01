
# Property Naming Conventions

## Background

This project has a mix of snake_case and camelCase property naming across different files:

- **Database**: Uses snake_case (e.g., `account_number`, `needs_detailed_box_labels`)
- **UI/React**: Uses camelCase (e.g., `accountNumber`, `needsDetailedBoxLabels`)

## Solution

We've implemented several strategies to handle this inconsistency:

1. **Adapter Functions**: Located in `src/utils/typeAdapters.ts`
   - `adaptCustomerToCamelCase()`: Converts database format to UI format
   - `adaptCustomerToSnakeCase()`: Converts UI format to database format
   - Similar functions exist for orders and other data types

2. **Property Helper Functions**: Located in `src/utils/propertyHelpers.ts`
   - These functions provide a safe way to access properties regardless of naming convention
   - Example: `getOrderDate(order)` will return `order.orderDate || order.order_date`

3. **DataContext Adapters**: The DataContext automatically adapts data between formats
   - Database data is converted to camelCase when provided to components
   - UI data is converted to snake_case when saving to the database

## Best Practices

1. When creating new components or modifying existing ones:
   - Use the property helper functions from `propertyHelpers.ts` for safer access
   - When working with customers, use the `accountNumber` and `needsDetailedBoxLabels` properties

2. When working with database operations:
   - Use the adapter functions to ensure proper format transformation
   - Log the data before and after conversion to verify proper transformation

3. Debugging data issues:
   - Check the console logs for information about data transformations
   - Verify that the data is being properly converted between formats

## Future Improvements

We should eventually standardize on one naming convention throughout the codebase to simplify development.

The recommended approach would be:
- Use camelCase for all JavaScript/TypeScript code
- Use snake_case only at the database layer
- Ensure all adapter functions are consistently used for the conversion

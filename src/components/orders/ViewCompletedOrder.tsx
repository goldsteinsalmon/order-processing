
// Import the useReactToPrint hook but update the options format
import { useReactToPrint } from 'react-to-print';

// Later in the component where you use the printer hook, update to use documentTitle instead of content
const handlePrint = useReactToPrint({
  documentTitle: `Order - ${selectedOrder?.customer?.name || 'Unknown'} - ${format(new Date(), 'yyyy-MM-dd')}`,
  // Use contentRef instead of direct content
  content: () => printRef.current
});

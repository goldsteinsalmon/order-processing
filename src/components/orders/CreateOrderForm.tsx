
import React from "react";
import { useNavigate } from "react-router-dom";
import CreateOrderSteps from "./create-order/CreateOrderSteps";

const CreateOrderForm: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate("/orders");
  };
  
  return <CreateOrderSteps onCancel={handleCancel} />;
};

export default CreateOrderForm;

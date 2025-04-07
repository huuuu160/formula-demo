// ButtonComponent.tsx
import React from 'react';
import { Button } from 'antd';

interface ButtonComponentProps {
  onClick: () => void;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({ onClick }) => {
  return (
    <Button type="primary" onClick={onClick}>
      点击我
    </Button>
  );
};

export default ButtonComponent;

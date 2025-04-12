// App.tsx
import React, { useState } from 'react';
import ButtonComponent from './main/ButtonComponent'; // 导入按钮组件
import ModalComponent from './main/ModalComponent'; // 导入模态框组件

const App: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleButtonClick = () => {
    setIsModalVisible(true); // 显示模态框
  };

  const handleModalOk = () => {
    setIsModalVisible(false); // 点击“确定”关闭模态框
  };


  const handleModalCancel = () => {
    setIsModalVisible(false); // 点击“取消”关闭模态框
  };

  return (
    <div>
      <h1>这是按钮1哈哈哈哈我是第三次修改的</h1>
      <ButtonComponent onClick={handleButtonClick} />
      <ModalComponent
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default App;

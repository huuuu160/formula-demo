import React, {useState, useEffect, useRef} from 'react';
import {Modal, Button, Select, Table, Row as AntdRow, Col, Divider, Input, message} from 'antd';
import {DndContext, PointerSensor, useDndContext, useSensor, useSensors} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';
import TextArea from "antd/es/input/TextArea";
import { v4 as uuidv4 } from 'uuid';
import './ModelComponent.css';
interface ModalComponentProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const { Option } = Select;

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

// 修改组件名称
const SortableRow: React.FC<Readonly<RowProps>> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
};

const ModalComponent: React.FC<ModalComponentProps> = ({ visible, onOk, onCancel }) => {
  const [selectedOption1, setSelectedOption1] = useState<string | null>(null);
  const [selectedOption2, setSelectedOption2] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);  // 用于第一个表格的数据
  const [secondTableData, setSecondTableData] = useState<any[]>([]); // 用于第二个表格的数据
  const [types, setTypes] = useState<any>({});
  const [devices, setDevices] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number | null>(null); // 存储当前选中的行索引
  const [updatedFields, setUpdatedFields] = useState<any>({});
  const [editingKey, setEditingKey] = useState<{ rowKey: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [firstTableEditingKey, setFirstTableEditingKey] = useState<{ rowKey: string; field: string } | null>(null);
  const [firstTableEditValue, setFirstTableEditValue] = useState('');
  const [selectedConditionKeys, setSelectedConditionKeys] = useState<React.Key[]>([]);
  const [selectedFormulaKeys, setSelectedFormulaKeys] = useState<React.Key[]>([]);
  const [editingImpactTag, setEditingImpactTag] = useState<{
  conditionKey: string;   // 当前编辑的条件行key
  field: string;         // 当前编辑的字段
} | null>(null)
  const conditionTableRef = useRef<HTMLDivElement>(null);
  const formulaTableRef = useRef<HTMLDivElement>(null);
  const isEditing = editingKey !== null;




  // 获取设备和类型的数据
  useEffect(() => {
    fetch('http://localhost:5000/formula')
      .then((response) => response.json())
      .then((data) => {
        setTypes(data.result.type);
        setDevices(data.result.device);
      })
      .catch((error) => console.error('请求失败:', error));

  }, [visible]);

  // 监听 selectedOption1 和 selectedOption2 的变化，当两个选项都有值时触发数据请求
  useEffect(() => {
    if (selectedOption1 && selectedOption2) {
      handleExitEdit();
      setSelectedFormulaKeys([]);
    setSelectedConditionKeys([]);
    setEditingKey(null);
    setEditValue('');
    setFirstTableEditingKey(null)
    setFirstTableEditValue('')
      const fetchData = async () => {
        try {
          const response = await fetch('http://localhost:5000/formula', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device: selectedOption1,
              type: selectedOption2,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('接口返回数据:', data); // 检查返回的数据结构

            const ifSymbolsList = data.result.if_symbols || [];
            const formulasList = data.result.formulas || [];

            // 填充第一个表格的数据
            setTableData(
               ifSymbolsList.map((if_symbol: any, index:number) => ({
                key: `first-${index}`, // 添加唯一标识
                term1: if_symbol[0],
                term2: if_symbol[1],
                term3: if_symbol[2],
  }))
            );
            // 填充第二个表格的数据
            setSecondTableData(
              formulasList.map((formula: any) => ({
                term1: formula[0],
                term2: formula[1],
                term3: formula[2],
                term4: formula[2],
                field1: formula[3], // 保存最后两个字段
                field2: formula[4], // 保存最后两个字段
              }))
            );
          } else {
            alert('请求失败');
          }
        } catch (error) {
          console.error('请求失败:', error);
        }
      };

      fetchData();
    }
  }, [selectedOption1, selectedOption2]);  // 当这两个选项变化时触发请求

    const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      const scrollContainer = ref.current?.querySelector('.ant-table-body');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 0);
  };

  // 修改后的新增条件处理
 const handleAddCondition = () => {
  const newRow = {
    key: uuidv4(),
    term1: '',
    term2: '',
    term3: '',
  };
  setTableData(prev => {
    const newData = [...prev, newRow];
    // 在状态更新后执行滚动
    setTimeout(() => {
      const scrollContainer = conditionTableRef.current?.querySelector('.ant-table-body');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 0);
    return newData;
  });
};

  // 修改后的新增公式处理
  const handleAddFormula = () => {
    const maxTerm3 = secondTableData.reduce((max, item) => Math.max(max, item.term3), 0);
    const newRow = {
      term1: '', // 默认值
      term2: '',
      term3: maxTerm3 + 1,
      term4: uuidv4(),
      field1: '',
      field2: '',
    };
    setSecondTableData(prev => [...prev, newRow]);
    scrollToBottom(formulaTableRef);
  };

  const handleReset = () => {
    setSelectedOption1(null);
    setSelectedOption2(null);
    setTableData([]);
    setSecondTableData([]);
  };

  const handleDropdown1Change = (value: string) => {
    setSelectedOption1(value);
  };

  const handleDropdown2Change = (value: string) => {
    setSelectedOption2(value);
  };

    const handleSubmit = () => {
  // 打印选择的设备、类型以及表格数据
  console.log('选择的设备:', selectedOption1);
  console.log('选择的数据类型:', selectedOption2);

  console.log('条件表数据:', tableData);
  console.log('公式表数 据:', secondTableData);

  alert('提交按钮被点击');
};

  const handleButtonClick = (record: any, index: number) => {
    // 为当前记录初始化 updatedFields 和记录的索引
    setCurrentRecordIndex(index);
    setUpdatedFields({
      field1: record.field1,  // 初始化为当前记录的值
      field2: record.field2,  // 初始化为当前记录的值
    });
    setModalVisible(true);
  };

  const handleModalOk = () => {
    if (currentRecordIndex !== null) {
      const updatedData = [...secondTableData];  // 创建一个副本，避免直接修改原数组

      // 根据行索引更新数据
      updatedData[currentRecordIndex] = {
        ...updatedData[currentRecordIndex],  // 保留原数据
        field1: updatedFields.field1,  // 更新字段1
        field2: updatedFields.field2,  // 更新字段2
      };

      setSecondTableData(updatedData);  // 更新数据
      setModalVisible(false);  // 关闭弹窗
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setUpdatedFields({ ...updatedFields, [field]: value });
  };

  const columns = [
  {
    title: '条件',
    dataIndex: 'term1',
    width: 250,
    render: (text: string, record: any) => {
      const isEditing = firstTableEditingKey?.rowKey === record.key && firstTableEditingKey?.field === 'term1';
      return isEditing ? (
        <TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
          value={firstTableEditValue}
          onChange={(e) => setFirstTableEditValue(e.target.value)}
          onPressEnter={handleFirstTableSave}
          onBlur={handleFirstTableSave}
          autoFocus
        />
      ) : (
        <div
          onClick={() => {
            // 点击其他列退出影响标签编辑状态
            handleExitEdit();
            handleFirstTableEdit(record.key, 'term1', text);
          }}
          style={{ minHeight: 32, cursor: 'pointer' }}
        >
          {text || <span style={{ color: '#bfbfbf' }}>点击输入</span>}
        </div>
      );
    },
  },
  {
    title: '条件失败处理',
    dataIndex: 'term2',
    render: (text: string, record: any) => {
      const isEditing = firstTableEditingKey?.rowKey === record.key && firstTableEditingKey?.field === 'term2';
      return isEditing ? (
        <TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
          value={firstTableEditValue}
          onChange={(e) => setFirstTableEditValue(e.target.value)}
          onPressEnter={handleFirstTableSave}
          onBlur={handleFirstTableSave}
          autoFocus
          placeholder="可为空"
        />
      ) : (
        <div
          onClick={() => {
            // 点击其他列退出影响标签编辑状态
            handleExitEdit();
            handleFirstTableEdit(record.key, 'term2', text);
          }}
          style={{ minHeight: 32, cursor: 'pointer' }}
        >
          {text || <span style={{ color: '#bfbfbf' }}>点击输入</span>}
        </div>
      );
    },
  },
  {
  title: '影响标签',
  dataIndex: 'term3',
  width: 130,
  render: (text: string, record: any) => (
    <div
      className={`impact-tag ${editingImpactTag?.conditionKey === record.key ? 'editing' : ''}`}
      onClick={() => {
        const isEditing = editingImpactTag?.conditionKey === record.key && editingImpactTag?.field === 'term3';
        setSelectedFormulaKeys([]); // 清空之前的选中
        if (isEditing) {
            // 点击已编辑项则退出
            handleExitEdit();
          } else {
           if (firstTableEditingKey) {
              handleExitEdit();
            }
            // 进入编辑模式
            handleImpactTagClick(record);
          }

      }}
    >
      {text || <span className="placeholder"></span>}
      {editingImpactTag?.conditionKey === record.key && (
        <div className="floating-indicator">
          <div className="dot-pulse"/>
          <span className="tip-text">正在编辑</span>
        </div>
      )}
    </div>
  ),
},
];

  const secondTableColumns = [
      {
    title: '输出变量',
    dataIndex: 'term1',
    width: 100,
    render: (text: string, record: any) => {
      const isEditing = editingKey?.rowKey === record.term4 && editingKey?.field === 'term1';
      return isEditing ? (
        <TextArea
          autoSize={{ minRows: 1, maxRows: 6 }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onPressEnter={handleSave}
          onBlur={handleSave}
          autoFocus
          placeholder="请输入变量（不可为空）"
        />
      ) : (
        <div
          onClick={() => handleEdit(record.term4, 'term1', text || '')} // 处理空值情况
          style={{
            cursor: 'pointer',
            background: text ? 'inherit' : '#fafafa',
            minHeight: 32
          }}
        >
          {text || <span style={{ color: '#bfbfbf' }}>点击输入</span>}
        </div>
      );
    },
  },
  {
  title: '公式',
  dataIndex: 'term2',
  render: (text: string, record: any) => {
    const isEditing = editingKey?.rowKey === record.term4 && editingKey?.field === 'term2';
    return isEditing ? (
      <TextArea
            autoSize={{ minRows: 1, maxRows: 6 }}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onPressEnter={handleSave}
        onBlur={handleSave}
        autoFocus
        placeholder="请输入公式（可为空）"
      />
    ) : (
      <div
        onClick={() => handleEdit(record.term4, 'term2', text || '')}
        style={{
          cursor: 'pointer',
          background: text ? 'inherit' : '#fafafa'
        }}
      >
        {text || <span style={{ color: '#bfbfbf' }}>请输入公式（可为空）</span>}
      </div>
    );
  },
},
    {
      title: '执行顺序',
      dataIndex: 'term3',
      width:80,
      render: (text: number) => text,
    },
    {
      title: '额外字段',
      key: 'action',
      width:100,
      render: (_: any, record: any, index: number) => (
        <Button onClick={() => handleButtonClick(record, index)} type="primary">
          执行
        </Button>
      ),
    },
  ];
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isEditing ? Number.MAX_SAFE_INTEGER : 1,
      },
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
  if (active.id !== over?.id) {
    setSecondTableData((prevSecond) => {
      // 步骤1：处理第二个表格的拖拽排序
      const activeIndex = prevSecond.findIndex(i => i.term4 === active.id);
      const overIndex = prevSecond.findIndex(i => i.term4 === over?.id);
      const newSecondTable = arrayMove(prevSecond, activeIndex, overIndex);

      // 步骤2：生成顺序映射表（旧顺序 → 新顺序）
      const orderMapping = new Map<number, number>();
      prevSecond.forEach((originalItem, originalIndex) => {
        const newOrder = newSecondTable.findIndex(item => item.term4 === originalItem.term4) + 1;
        orderMapping.set(originalItem.term3, newOrder);
      });

      // 步骤3：更新第一个表格数据
      setTableData(prevFirst =>
        prevFirst.map(firstItem => {
          // 拆分字符串为数组
          const numbers = firstItem.term3.split(',').map(Number);

          // 创建新数组（保持长度不变）
          const newNumbers = numbers.map((n: number) =>
            orderMapping.has(n) ? orderMapping.get(n)! : n
          );

          return {
            ...firstItem,
            term3: newNumbers.join(',')
          };
        })
      );

      // 步骤4：返回更新后的第二个表格数据
      return newSecondTable.map((item, index) => ({
        ...item,
        term3: index + 1
      }));
    });
  }
};
  const handleUpdateImpactTag = () => {
  if (!editingImpactTag || selectedFormulaKeys.length === 0) {
    message.warning('请先选择要关联的公式');
    return;
  }

  // 获取选中公式的执行顺序
  const selectedOrders = secondTableData
    .filter(item => selectedFormulaKeys.includes(item.term4))
    .map(item => item.term3)
    .sort((a, b) => a - b);

  // 更新条件表
  setTableData(prev =>
    prev.map(item =>
      item.key === editingImpactTag.conditionKey
        ? { ...item, [editingImpactTag.field]: selectedOrders.join(',') }
        : item
    )
  );

  // 重置状态
 handleExitEdit();
};

  const handleEdit = (rowKey: string, field: string, value: string) => {
  // 如果当前有正在编辑的必填字段且未通过验证
  if (editingKey && editingKey.field !== 'term2' && !editValue.trim()) {
    message.error('请先完成当前编辑项');
    return;
  }

  // 正常进入编辑状态
  setEditingKey({ rowKey, field });
  setEditValue(value);
};
  const handleFirstTableEdit = (rowKey: string, field: string, value: string) => {
  // 如果当前有正在编辑的必填字段且未通过验证
  if (firstTableEditingKey && firstTableEditingKey.field !== 'term2' && !firstTableEditValue.trim()) {
    message.error('请先完成当前编辑项');
    return;
  }

  // 正常进入编辑状态
  setFirstTableEditingKey({ rowKey, field });
  setFirstTableEditValue(value || '');
};
  const handleImpactTagClick = (record: any) => {
  // 进入编辑模式
  setEditingImpactTag({
          conditionKey: record.key,
          field: 'term3'
        });

  // 解析当前影响标签值
  const currentValues = record.term3.split(',').map(Number).filter(Boolean);

  // 查找匹配的公式行
  const matchedKeys = secondTableData
    .filter(item => currentValues.includes(item.term3))
    .map(item => item.term4);

  setSelectedFormulaKeys(matchedKeys);
};
  const handleExitEdit = () => {
  setEditingImpactTag(null);
  setSelectedFormulaKeys([]); // 清空选中
};

const handleSave = () => {
  if (!editingKey) return;

  // 根据字段类型判断是否允许为空
  const isRequiredField = editingKey.field !== 'term2'; // term2（公式）允许为空

  if (isRequiredField && !editValue.trim()) {
    message.error('该字段不能为空');
    return; // 阻止退出编辑状态
  }

  setSecondTableData(prev =>
    prev.map(item =>
      item.term4 === editingKey.rowKey
        ? { ...item, [editingKey.field]: editValue }
        : item
    )
  );
  setEditingKey(null);
  setEditValue('');
};

const handleFirstTableSave = () => {
  if (!firstTableEditingKey) return;

  const isRequiredField = firstTableEditingKey.field !== 'term2'; // term2（条件失败处理）允许为空

  if (isRequiredField && !firstTableEditValue.trim()) {
    message.error('该字段不能为空');
    return; // 阻止退出编辑状态
  }

  setTableData(prev =>
    prev.map(item =>
      item.key === firstTableEditingKey.rowKey
        ? { ...item, [firstTableEditingKey.field]: firstTableEditValue }
        : item
    )
  );
  setFirstTableEditingKey(null);
  setFirstTableEditValue('');
};
const conditionRowSelection = {
  selectedRowKeys: selectedConditionKeys,
  onChange: setSelectedConditionKeys,
  getCheckboxProps: (record: any) => ({ disabled: isEditing }),
};

const formulaRowSelection = {
  selectedRowKeys: selectedFormulaKeys,
  onChange: setSelectedFormulaKeys,
  getCheckboxProps: (record: any) => ({ disabled: isEditing }),
};

// 删除处理函数
const handleDeleteConditions = () => {
  setTableData(prev => prev.filter(item => !selectedConditionKeys.includes(item.key)));
  setSelectedConditionKeys([]);
};

const handleDeleteFormulas = () => {
   if (editingImpactTag) {
    message.warning('请先完成标签修改');
    return;
  }
  setSecondTableData((prev) => {
    // 1. 过滤出保留的公式行
    const remainingFormulas = prev.filter(
      (item) => !selectedFormulaKeys.includes(item.term4)
    );

    // 2. 创建旧term3到新term3的映射表（基于数组索引）
    const term3Mapping = new Map<number, number>();
    remainingFormulas.forEach((_, index) => {
      term3Mapping.set(remainingFormulas[index].term3, index + 1);
    });

    // 3. 更新条件表中的影响标签
    setTableData((prevConditions) =>
      prevConditions.map((condition) => {
        const numbers = condition.term3
          .split(",")
          .map(Number)
          .filter((n:number) => term3Mapping.has(n)) // 过滤已删除的term3
          .map((n:number) => term3Mapping.get(n)!);  // 映射到新的连续编号

        return {
          ...condition,
          term3: numbers.join(","),
        };
      })
    );

    // 4. 生成新的连续term3编号
    return remainingFormulas.map((item, index) => ({
      ...item,
      term3: index + 1, // 从1开始连续编号
    }));
  });

  setSelectedFormulaKeys([]); // 清空选中状态
};



  return (
    <>
      <Modal
        title="数据查询"
        visible={visible}
        onOk={onOk}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <div>
          <AntdRow justify="start" style={{marginBottom: '20px'}}>
            <Col>
              <Button key="reset" onClick={handleReset}>
                重置
              </Button>
            </Col>
            <Col>
              <Button key="submit" type="primary" onClick={handleSubmit} style={{marginLeft: '10px'}}>
                提交
              </Button>
            </Col>
          </AntdRow>

          <AntdRow gutter={16}>
            <Col span={12}>
              <Select
                  style={{width: '100%'}}
                  placeholder="设备"
                  value={selectedOption1}
                  onChange={handleDropdown1Change}
              >
                {Object.keys(devices).map((key) => (
                    <Option key={key} value={key}>
                      {devices[key]}
                    </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Select
                  style={{width: '100%'}}
                  placeholder="数据类型"
                  value={selectedOption2}
                  onChange={handleDropdown2Change}
              >
                {Object.keys(types).map((key) => (
                    <Option key={key} value={key}>
                      {types[key]}
                    </Option>
                ))}
              </Select>
            </Col>
          </AntdRow>

          <Divider style={{margin: '20px 0'}}/>
          <AntdRow justify="space-between" align="middle">
            <Col>条件栏</Col>
            <Col>
              <Button type="primary" onClick={handleAddCondition}>新增条件</Button>
              <Button
      danger
      onClick={handleDeleteConditions}
      disabled={selectedConditionKeys.length === 0}
      style={{ marginLeft: 8 }}
    >
      删除选中
    </Button>
            </Col>
          </AntdRow>

          <div ref={conditionTableRef}>
            <Table
                rowSelection={conditionRowSelection}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
                scroll={{y: 160}}
                style={{marginTop: '20px', marginBottom: '20px'}}
            />
          </div>

          <Divider style={{margin: '20px 0'}}/>
          <AntdRow justify="space-between" align="middle">
  <Col>公式栏</Col>
  <Col>
    <Button type="primary" onClick={handleAddFormula}>新增公式</Button>
    <Button
      danger
      onClick={editingImpactTag ? handleUpdateImpactTag : handleDeleteFormulas}
      style={{ marginLeft: 8 }}
      disabled={selectedFormulaKeys.length === 0}
    >
      {editingImpactTag ? "确认修改标签" : "删除选中"}
    </Button>
  </Col>
</AntdRow>
          <div ref={formulaTableRef}>
            <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
            >
              <SortableContext
                  items={secondTableData.map((i) => i.term4)}
                  strategy={verticalListSortingStrategy}
              >
                <Table
                    rowSelection={formulaRowSelection}
                    columns={secondTableColumns}
                    dataSource={secondTableData}
                    pagination={false}
                    size="small"
                    scroll={{y: 350}}
                    style={{marginTop: '20px'}}
                    rowKey="term4"
                    components={{
                      body: {
                        row: SortableRow,
                      },
                    }}
                />
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </Modal>

      {/* 修改额外字段的弹窗 */}
      <Modal
        title="修改额外字段"
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={400}
      >
        <div>
          <div style={{ marginBottom: '10px' }}>
            <Input
              placeholder="修改trend"
              value={updatedFields.field1}
              onChange={(e) => handleFieldChange('field1', e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <Input
              placeholder="修改trends"
              value={updatedFields.field2}
              onChange={(e) => handleFieldChange('field2', e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ModalComponent;

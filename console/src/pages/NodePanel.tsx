import React, { useEffect } from 'react';
import { Table, Tag, Typography, Alert, Card, Statistic, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNodeStore } from '../store/nodes';
import type { NodeInfo } from '../store/nodes';
import { Activity, Server, Cpu } from 'lucide-react';

const { Title } = Typography;

const NodePanel: React.FC = () => {
  const { nodes, loading, error, fetchNodes } = useNodeStore();

  useEffect(() => {
    fetchNodes();
  }, []);

  const columns: ColumnsType<NodeInfo> = [
    {
      title: 'Node ID',
      dataIndex: 'node_id',
      key: 'node_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Capabilities',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (caps: string[]) => (
        <>
          {caps.map(cap => <Tag key={cap}>{cap}</Tag>)}
        </>
      ),
    },
    {
      title: 'Genes/Capsules',
      key: 'counts',
      render: (_, record) => `${record.gene_count} / ${record.capsule_count}`,
    },
    {
      title: 'Last Seen',
      dataIndex: 'last_seen',
      key: 'last_seen',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Node Management</Title>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Nodes"
              value={nodes.filter(n => n.status === 'active').length}
              prefix={<Server size={18} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Genes"
              value={nodes.reduce((acc, n) => acc + (n.gene_count || 0), 0)}
              prefix={<Cpu size={18} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Activity"
              value="Healthy"
              valueStyle={{ color: '#3f8600' }}
              prefix={<Activity size={18} />}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Table 
        columns={columns} 
        dataSource={nodes} 
        rowKey="node_id" 
        loading={loading}
      />
    </div>
  );
};

export default NodePanel;

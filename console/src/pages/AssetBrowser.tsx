import React, { useEffect } from 'react';
import { Table, Tag, Space, Input, Switch, Card, Typography, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAssetStore } from '../store/assets';
import type { CapsuleSummary } from '../api/client';

const { Title } = Typography;
const { Search } = Input;

const AssetBrowser: React.FC = () => {
  const { 
    assets, 
    loading, 
    error, 
    filters, 
    setFilters, 
    fetchAssets 
  } = useAssetStore();

  useEffect(() => {
    fetchAssets();
  }, []);

  const columns: ColumnsType<CapsuleSummary> = [
    {
      title: 'Asset ID',
      dataIndex: 'asset_id',
      key: 'asset_id',
      render: (text) => <Typography.Text copyable>{text.substring(0, 8)}...</Typography.Text>,
    },
    {
      title: 'Gene ID',
      dataIndex: 'gene_id',
      key: 'gene_id',
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (val) => (
        <Tag color={val > 0.8 ? 'green' : val > 0.5 ? 'orange' : 'red'}>
          {(val * 100).toFixed(1)}%
        </Tag>
      ),
      sorter: (a, b) => a.confidence - b.confidence,
    },
    {
      title: 'Success Rate',
      dataIndex: 'success_rate',
      key: 'success_rate',
      render: (val) => `${(val * 100).toFixed(1)}%`,
    },
    {
      title: 'Actions',
      key: 'action',
      render: () => (
        <Space size="middle">
          <a>Details</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Asset Browser</Title>
      
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap size="large">
          <Search
            placeholder="Search project"
            onSearch={(val) => {
              setFilters({ project: val });
              fetchAssets();
            }}
            style={{ width: 200 }}
          />
          <Search
            placeholder="Search namespace"
            onSearch={(val) => {
              setFilters({ namespace: val });
              fetchAssets();
            }}
            style={{ width: 200 }}
          />
          <Space>
            <span>Include Candidate</span>
            <Switch 
              checked={filters.includeCandidate} 
              onChange={(checked) => {
                setFilters({ includeCandidate: checked });
                fetchAssets();
              }} 
            />
          </Space>
        </Space>
      </Card>

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
        dataSource={assets} 
        rowKey="asset_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AssetBrowser;

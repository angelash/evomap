import React, { useEffect } from 'react';
import { Table, Button, Space, Typography, Modal, Input, message, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useReviewStore } from '../store/review';
import { CapsuleSummary } from '../api/client';

const { Title } = Typography;

const ReviewTable: React.FC = () => {
  const { pendingAssets, loading, error, fetchPending, approve, reject } = useReviewStore();

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (assetId: string) => {
    Modal.confirm({
      title: 'Approve Asset',
      content: 'Are you sure you want to promote this candidate to promoted status?',
      onOk: () => approve(assetId),
    });
  };

  const handleReject = (assetId: string) => {
    let reason = '';
    Modal.confirm({
      title: 'Reject Asset',
      content: (
        <Input 
          placeholder="Reason for rejection" 
          onChange={(e) => reason = e.target.value} 
          style={{ marginTop: '10px' }}
        />
      ),
      onOk: () => {
        if (!reason) {
          message.error('Please provide a reason');
          return Promise.reject();
        }
        return reject(assetId, reason);
      },
    });
  };

  const columns: ColumnsType<CapsuleSummary> = [
    {
      title: 'Asset ID',
      dataIndex: 'asset_id',
      key: 'asset_id',
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Gene ID',
      dataIndex: 'gene_id',
      key: 'gene_id',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (val) => `${(val * 100).toFixed(1)}%`,
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleApprove(record.asset_id)}>
            Approve
          </Button>
          <Button danger onClick={() => handleReject(record.asset_id)}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Review Board</Title>
      <p>Candidates awaiting promotion</p>

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
        dataSource={pendingAssets} 
        rowKey="asset_id" 
        loading={loading}
      />
    </div>
  );
};

export default ReviewTable;

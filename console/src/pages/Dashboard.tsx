import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../api/client';
import { Activity, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.request({ url: '/stats', method: 'GET' });
        setData(response.data);
      } catch (e) {
        // Mock for dev
        setData({
          summary: {
            total_assets: 124,
            success_count: 890,
            failure_count: 12,
            uptime: '15d 4h',
          },
          history: [
            { name: 'Mon', success: 40, fail: 2 },
            { name: 'Tue', success: 30, fail: 1 },
            { name: 'Wed', success: 60, fail: 5 },
            { name: 'Thu', success: 45, fail: 0 },
            { name: 'Fri', success: 90, fail: 3 },
            { name: 'Sat', success: 20, fail: 1 },
            { name: 'Sun', success: 55, fail: 0 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Observability</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
                title="Total Assets" 
                value={data.summary.total_assets} 
                prefix={<TrendingUp size={18} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
                title="Reuse Success" 
                value={data.summary.success_count} 
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircle size={18} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
                title="Reuse Failure" 
                value={data.summary.failure_count} 
                valueStyle={{ color: '#cf1322' }}
                prefix={<XCircle size={18} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
                title="System Uptime" 
                value={data.summary.uptime} 
                prefix={<Activity size={18} />} 
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Traffic & Success Rate (Last 7 Days)">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="success" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSuccess)" />
                  <Area type="monotone" dataKey="fail" stroke="#ff4d4f" fill="#ffccc7" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

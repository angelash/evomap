import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  ClipboardCheck, 
  Server, 
  LogOut 
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import AssetBrowser from './pages/AssetBrowser';
import ReviewBoard from './pages/ReviewBoard';
import NodePanel from './pages/NodePanel';

const { Header, Content, Sider } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={18} />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/assets',
      icon: <Search size={18} />,
      label: <Link to="/assets">Assets</Link>,
    },
    {
      key: '/review',
      icon: <ClipboardCheck size={18} />,
      label: <Link to="/review">Review</Link>,
    },
    {
      key: '/nodes',
      icon: <Server size={18} />,
      label: <Link to="/nodes">Nodes</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>EvoMap Console</span>
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={[location.pathname]} 
          selectedKeys={[location.pathname]}
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '24px' }}>
          <Button type="text" icon={<LogOut size={16} />}>Logout</Button>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<AssetBrowser />} />
          <Route path="/review" element={<ReviewBoard />} />
          <Route path="/nodes" element={<NodePanel />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;

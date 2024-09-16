import { Affix, Drawer, Layout } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidenav from './Sidenav';

const { Header: AntHeader, Content, Sider } = Layout;

function Main({ children, navItems, RightComponent }) {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState('right');
  const [sidenavColor, setSidenavColor] = useState('#1890ff');
  const [sidenavType, setSidenavType] = useState('transparent');
  const [fixed, setFixed] = useState(false);
  const [sidenavOpen, setSidenavOpen] = useState(false);

  const openDrawer = () => setVisible(true);
  const handleSidenavType = (type) => setSidenavType(type);
  const handleSidenavColor = (color) => setSidenavColor(color);
  const handleFixedNavbar = (isFixed) => setFixed(isFixed);
  const toggleSidenav = () => {
    setSidenavOpen(!sidenavOpen);
  };

  let { pathname } = useLocation();
  pathname = pathname.replace('/', '');

  useEffect(() => {
    if (pathname === 'rtl') {
      setPlacement('left');
    } else {
      setPlacement('right');
    }
  }, [pathname]);

  return (
    <Layout
      className={`layout-dashboard ${
        pathname === 'profile' ? 'layout-profile' : ''
      } ${pathname === 'rtl' ? 'layout-dashboard-rtl' : ''} ${sidenavOpen ? '' : 'collapsed'}`}
    >
      <Drawer
        title={false}
        placement={placement === 'right' ? 'left' : 'right'}
        closable={false}
        onClose={() => setVisible(false)}
        visible={visible}
        key={placement === 'right' ? 'left' : 'right'}
        width={250}
        className={`drawer-sidebar ${
          pathname === 'rtl' ? 'drawer-sidebar-rtl' : ''
        } `}
      >
        <Layout
          className={`layout-dashboard ${
            pathname === 'rtl' ? 'layout-dashboard-rtl' : ''
          }`}
        >
          <Sider
            trigger={null}
            width={250}
            theme='light'
            className={`sider-primary ant-layout-sider-primary ${
              sidenavType === '#fff' ? 'active-route' : ''
            }`}
            style={{ background: sidenavType }}
            collapsible
            collapsed={sidenavOpen}
          >
            <Sidenav color={sidenavColor} navItems={navItems} />
          </Sider>
        </Layout>
      </Drawer>
      <Sider
        breakpoint='lg'
        collapsedWidth='0'
        onCollapse={(collapsed, type) => {
          setSidenavOpen(!collapsed);
        }}
        trigger={null}
        width={250}
        theme='light'
        className={`sider-primary ant-layout-sider-primary ${
          sidenavType === '#fff' ? 'active-route' : ''
        }`}
        style={{ background: sidenavType }}
        collapsible
        collapsed={!sidenavOpen}
      >
        <Sidenav
          isOpen={sidenavOpen}
          toggleSidenav={toggleSidenav}
          color={sidenavColor}
          navItems={navItems}
        />
      </Sider>
      <Layout className={`main-content ${sidenavOpen ? '' : 'collapsed'}`}>
        {fixed ? (
          <Affix>
            <AntHeader className={`${fixed ? 'ant-header-fixed' : ''}`}>
              <Header
                toggleSidenav={toggleSidenav}
                sidenavOpen={sidenavOpen}
                onPress={openDrawer}
                name={pathname}
                subName={pathname}
                handleSidenavColor={handleSidenavColor}
                handleSidenavType={handleSidenavType}
                handleFixedNavbar={handleFixedNavbar}
                RightComponent={RightComponent}
              />
            </AntHeader>
          </Affix>
        ) : (
          <AntHeader className={`${fixed ? 'ant-header-fixed' : ''}`}>
            <Header
              toggleSidenav={toggleSidenav}
              sidenavOpen={sidenavOpen}
              onPress={openDrawer}
              name={pathname}
              subName={pathname}
              handleSidenavColor={handleSidenavColor}
              handleSidenavType={handleSidenavType}
              handleFixedNavbar={handleFixedNavbar}
              RightComponent={RightComponent}
            />
          </AntHeader>
        )}
        <Content className='content-ant'>
          {children}
        </Content>
      </Layout>
      {sidenavOpen && (
        <div className="backdrop" onClick={toggleSidenav}></div>
      )}
    </Layout>
  );
}

export default Main;

import React from 'react';
import { Menu } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const StyledMenu = styled(Menu)`
  .ant-menu-title-content {
    display: block;
  }
`;

function Sidenav({ color, navItems, isOpen }) {
  const { pathname } = useLocation();
  const page = pathname.replace('/', '');

  return (
    <>
      <div className='brand' style={{ display: 'flex', alignItems: 'center' }}>
        <img src='/logo.png' alt='' />
        <h2 style={{ color: '#060270', marginLeft: '10px' }} className='d-inline'>Internship</h2>
      </div>
      <hr />
      <StyledMenu theme='light' mode='inline'>
        {navItems.map(({ key, to, label, icon }) => (
          <Menu.Item key={key} >
            <NavLink to={to}>
              <span
                className='icon'
                style={{
                  background: page === to.replace('/', '') ? color : '',
                }}
              >
                {React.cloneElement(icon, {
                  style: { color: page === to.replace('/', '') ? '#fff' : color },
                })}
              </span>
              <span className='label'>{label}</span>
            </NavLink>
          </Menu.Item>
        ))}
      </StyledMenu>
    </>
  );
}

export default Sidenav;

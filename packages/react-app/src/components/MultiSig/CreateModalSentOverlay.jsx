import React from "react";
import { Spin } from 'antd';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

export default function CreateModalSentOverlay(props) {
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 10,
        top: 55,
        bottom: 53,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
      }}>
      {props.txError && (
        <>
          <div style={{ fontSize: '1.5rem' }}>{props.errorText}</div>
          <StopOutlined style={{ color: 'red', fontSize: '4rem' }} />
        </>
      )}
      {props.txSuccess && (
        <>
          <div style={{ fontSize: '1.5rem' }}>{props.successText}</div>
          <CheckCircleOutlined style={{ color: 'green', fontSize: '4rem' }} />
        </>
      )}
      {!props.txError && !props.txSuccess && (
        <>
          <div style={{ fontSize: '1.5rem' }}>{props.pendingText}</div>
          <div style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" style={{ transform: 'scale(1.5)' }} />
          </div>
        </>
      )}
    </div>
  );
};
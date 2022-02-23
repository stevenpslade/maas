import React, { useState } from "react";
import { Button, List } from "antd";

import { Address, Balance, Blockie } from "..";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { EllipsisOutlined } from "@ant-design/icons";
import { parseEther, formatEther } from "@ethersproject/units";

export default function TransactionListItem({ item, mainnetProvider, blockExplorer, price, readContracts, contractName, children }) {
  item = item.args ? item.args : item;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnInfo, setTxnInfo] = useState(null);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  let txnData;
  try {
    // TODO: this might be fine but also try getting name from external contracts
    txnData = item.data != "0x" ? readContracts[contractName].interface.parseTransaction(item) : null;
  } catch (error) {
    console.log("ERROR", error)
  }

  return <>
    <TransactionDetailsModal
      visible={isModalVisible}
      txnInfo={txnData}
      handleOk={handleOk}
      mainnetProvider={mainnetProvider}
      price={price}
    />
    {<List.Item key={item.hash} style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 55,
          fontSize: 12,
          opacity: 0.5,
          display: "flex",
          flexDirection: "row",
          width: "90%",
          justifyContent: "space-between",
        }}
      >
        <p>
          <b>Event Name :&nbsp;</b>
          {/* TODO: Change the below */}
          {txnData ? txnData.functionFragment?.name : "Transfer Funds"}&nbsp;
        </p>
        <p>
          <b>Addressed to :&nbsp;</b>
          {txnData ? txnData.args[0] : item?.to}
        </p>
      </div>
      {<b style={{ padding: 16 }}>#{typeof(item.nonce)=== "number" ? item.nonce : item.nonce.toNumber()}</b>}
      <span>
        <Blockie size={4} scale={8} address={item.hash} /> {item.hash.substr(0, 6)}
      </span>
      <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
      <Balance balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))} dollarMultiplier={price} />
      <>
        {
          children
        }
      </>
      <Button
        onClick={showModal}
      >
        <EllipsisOutlined />
      </Button>

    </List.Item>}
  </>
};

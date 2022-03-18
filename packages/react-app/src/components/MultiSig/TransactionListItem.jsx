import React, { useState, useEffect } from "react";
import { Button, List } from "antd";

import { Address, Balance, Blockie } from "..";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { EllipsisOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { parseExternalContractTransaction } from "../../helpers";

const axios = require("axios");

export default function TransactionListItem({ item, mainnetProvider, blockExplorer, price, readContracts, contractName, children }) {
  console.log("item:", item);
  item = item.args ? item.args : item;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnData, setTxnData] = useState(null);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (!txnData) {
      try {
        const parsedData = item.data != "0x" ? readContracts[contractName].interface.parseTransaction(item) : null;
        setTxnData(parsedData);
      } catch (argumentError) {
        console.log("ERROR", argumentError);

        const getParsedTransaction = async () => {
          const parsedTransaction = await parseExternalContractTransaction(item.to, item.data);
          setTxnData(parsedTransaction);
        }

        getParsedTransaction();
      }
    }
  }, [item]);

  return <>
    <TransactionDetailsModal
      visible={isModalVisible}
      txnInfo={txnData}
      handleOk={handleOk}
      mainnetProvider={mainnetProvider}
      price={price}
    />
    {<List.Item
      key={item.hash}
      style={{ position: "relative", display: "flex", flexWrap: "wrap" }}
    >
      {<b style={{ padding: 16 }}>#{typeof(item.nonce)=== "number" ? item.nonce : item.nonce.toNumber()}</b>}
      <span>
        <Blockie size={4} scale={8} address={item.hash} /> {item.hash.substr(0, 6)}
      </span>
      {ethers.utils.isAddress(txnData?.args[0]) &&
        <Address address={txnData.args[0]} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
      }
      <Balance balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))} dollarMultiplier={price} />
      <>
        {
          children
        }
      </>
      <Button
        disabled={!txnData}
        onClick={showModal}
      >
        <EllipsisOutlined />
      </Button>
      <div
        style={{
          fontSize: 12,
          opacity: 0.5,
          display: "flex",
          justifyContent: "space-evenly",
          width: "100%",
        }}
      >
        <p>
          <b>Event Name :&nbsp;</b>
          {txnData ? txnData.functionFragment?.name : "Transfer Funds"}&nbsp;
        </p>
        <p>
          <b>Addressed to :&nbsp;</b>
          <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={12} />
        </p>
      </div>
    </List.Item>}
  </>
};

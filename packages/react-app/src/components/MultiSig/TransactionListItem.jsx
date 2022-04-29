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
  //console.log("coming in item:", item);
  item = item.args ? item.args : item;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnData, setTxnData] = useState({});

  const showModal = () => {
    setIsModalVisible(true);
  };



  useEffect(() => {
    if (!txnData[item.hash]) {
      try {
        const parsedData = item.data != "0x" ? readContracts[contractName].interface.parseTransaction(item) : null;
        //console.log("SET",JSON.stringify(item),JSON.stringify(parsedData))
        const newData = {}
        newData[item.hash] = parsedData
        setTxnData({...txnData,...newData});
      } catch (argumentError) {
        const getParsedTransaction = async () => {
          const parsedTransaction = await parseExternalContractTransaction(item.to, item.data);
          const newData = {}
          newData[item.hash] = parsedTransaction
          setTxnData({...txnData,...newData});
        }
        getParsedTransaction();
      }
    }
  }, [item]);




  const txDisplay = ()=>{
    const toSelf = (item?.to == readContracts[contractName].address)

    if(toSelf && txnData[item.hash]?.functionFragment?.name == "addSigner")
    {
      return (
        <>
          <span style={{fontSize:16,fontWeight:"bold"}}>
            Add Signer
          </span>
          {ethers.utils.isAddress(txnData[item.hash]?.args[0]) &&
            <Address address={txnData[item.hash]?.args[0]} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          }
          <span style={{fontSize:16}}>
            with threshold {txnData[item.hash]?.args[1]?.toNumber()}
          </span>
          <>
            {
              children
            }
          </>
        </>
      )
    }
    else if(toSelf && txnData[item.hash]?.functionFragment?.name == "removeSigner")
    {
      return (
        <>
          <span style={{fontSize:16,fontWeight:"bold"}}>
            Remove Signer
          </span>
          {ethers.utils.isAddress(txnData[item.hash]?.args[0]) &&
            <Address address={txnData[item.hash]?.args[0]} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          }
          <span style={{fontSize:16}}>
            with threshold {txnData[item.hash]?.args[1]?.toNumber()}
          </span>
          <>
            {
              children
            }
          </>
        </>
      )
    }else if(!txnData[item.hash]?.functionFragment?.name)
    {
      return (
        <>
          <span style={{fontSize:16,fontWeight:"bold"}}>
            Transfer
          </span>
          <Balance balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))} dollarMultiplier={price} />
          to
          <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          <>
            {
              children
            }
          </>
        </>
      )
    }else if(txnData[item.hash]?.signature!="")
    {

      //console.log("CALL",txnData)

      return (
        <>
          <span style={{fontSize:16,fontWeight:"bold"}}>
            Call
          </span>
          <span style={{fontSize:16}}>
            {txnData[item.hash]?.signature}
            <Button
              style={{margin:4}}
              disabled={!txnData[item.hash]}
              onClick={showModal}
            >
              <EllipsisOutlined />
            </Button>
          </span>
          <span style={{fontSize:16}}>
            on
          </span>
          <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          <>
            {
              children
            }
          </>
        </>
      )
    }else{

      return (
        <>
          <div><i>Unknown transaction type...If you are reading this please screenshot and send to @austingriffith</i></div>
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
            disabled={!txnData[item.hash]}
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
              {txnData ? txnData[item.hash].functionFragment?.name : "Transfer Funds"}&nbsp;
            </p>
            <p>
              <b>To:&nbsp;</b>
              <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={12} />
            </p>
          </div>
        </>
      )
    }
  }

  return <>
    <TransactionDetailsModal
      visible={isModalVisible}
      txnInfo={txnData[item.hash]}
      handleOk={() => setIsModalVisible(false)}
      handleCancel={() => setIsModalVisible(false)}
      mainnetProvider={mainnetProvider}
      price={price}
    />
    {<List.Item
      key={item.hash}
      style={{ position: "relative", display: "flex", flexWrap: "wrap", width:800 }}
    >
      <>
        <a href={blockExplorer+"tx/"+item.hash} target="_blank">
          <b style={{ padding: 16 }}>#{typeof(item.nonce)=== "number" ? item.nonce : item.nonce.toNumber()}</b>
        </a>
        {txDisplay()}
        <Blockie size={4} scale={8} address={item.hash} />
      </>
    </List.Item>}
  </>
};

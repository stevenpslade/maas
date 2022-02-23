import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, Select, InputNumber, Space } from "antd";
import { AddressInput, EtherInput } from "../components";
import { useContractReader } from "eth-hooks";
import { useLocalStorage } from "../hooks";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { set } from "store";
const { Option } = Select;

const axios = require("axios");

export default function CreateTransaction({
  poolServerUrl,
  contractName,
  contractAddress,
  mainnetProvider,
  localProvider,
  price,
  readContracts,
  userSigner,
  nonce,
  signaturesRequired,
}) {
  const history = useHistory();

  const [methodName, setMethodName] = useLocalStorage("methodName", "transferFunds")
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired)
  const [amount, setAmount] = useState("0");
  const [to, setTo] = useLocalStorage("to");
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    padding: 10,
  };

  const createTransaction = async () => {
    try {
      setLoading(true)

      let callData;
      let executeToAddress;
      if (methodName == "transferFunds") {
        callData = "0x";
        executeToAddress = to;
      } else {
        callData = readContracts[contractName]?.interface?.encodeFunctionData(methodName, [to, newSignaturesRequired]);
        executeToAddress = contractAddress;
      }

      const newHash = await readContracts[contractName].getTransactionHash(
        nonce,
        executeToAddress,
        parseEther("" + parseFloat(amount).toFixed(12)),
        callData,
      );

      const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
      console.log("signature: ", signature);

      const recover = await readContracts[contractName].recover(newHash, signature);
      console.log("recover: ", recover);

      const isOwner = await readContracts[contractName].isOwner(recover);
      console.log("isOwner: ", isOwner);

      if (isOwner) {
        const res = await axios.post(poolServerUrl, {
          chainId: localProvider._network.chainId,
          address: readContracts[contractName]?.address,
          nonce: nonce.toNumber(),
          to: executeToAddress,
          amount,
          data: callData,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
        });

        console.log("RESULT", res.data);
        setTimeout(() => {
          history.push("/pool");
          setLoading(false);
        }, 1000);
      } else {
        console.log("ERROR, NOT OWNER.");
      }
    } catch(error) {
      console.log("Error: ", error);
      setLoading(false);
    }
  }

  return (
    <div>

      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8 }}>
          <div style={{ margin: 8, padding: 8 }}>
            <Select value={methodName} style={{ width: "100%" }} onChange={setMethodName}>
              <Option key="transferFunds">Send ETH</Option>
              <Option key="addSigner">Add Signer</Option>
              <Option key="removeSigner">Remove Signer</Option>
            </Select>
          </div>
          <div style={inputStyle}>
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder={methodName == "transferFunds" ? "Recepient address" : "Owner address"}
              value={to}
              onChange={setTo}
            />
          </div>
          <div style={inputStyle}>
            {methodName == "transferFunds" ? 
              <EtherInput
                price={price}
                mode="USD"
                value={amount}
                onChange={setAmount}
              />
            :
              <InputNumber
                style={{ width: "100%" }}
                placeholder="New # of signatures required"
                value={newSignaturesRequired}
                onChange={setNewSignaturesRequired}
              />
            }
          </div>
          <Space style={{ marginTop: 32 }}>
            <Button
              loading={loading}
              onClick={createTransaction}
              type="primary"
            >
              Propose
            </Button>
          </Space>
        </div>

      </div>
    </div>
  );
}

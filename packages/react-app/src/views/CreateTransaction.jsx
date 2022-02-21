import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, Select, Input, Space } from "antd";
import { AddressInput, EtherInput } from "../components";
import { useContractReader } from "eth-hooks";
import { useLocalStorage } from "../hooks";
import { ethers } from "ethers";
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

  const [selectDisabled, setSelectDisabled] = useState(false);
  const [methodName, setMethodName] = useLocalStorage("methodName", "transferFunds")
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired)
  const [amount, setAmount] = useState("0");
  const [to, setTo] = useLocalStorage("to");
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    padding: 10,
  };

  const confirmTransaction = async () => {
    setLoading(true)
    let callData;
    methodName == "transferFunds" ? callData = "0x" :
      callData = readContracts[contractName]?.interface?.encodeFunctionData(methodName, [to, newSignaturesRequired])

    const newHash = await readContracts?.MetaMultiSigWallet?.getTransactionHash(
      nonce.toNumber(),
      callData == "0x" ? to : contractAddress,
      ethers.utils.parseEther("" + parseFloat(amount).toFixed(12)),
      callData,
    );

    const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash))
    console.log("signature", signature);

    const recover = await readContracts?.MetaMultiSigWallet?.recover(newHash, signature);
    console.log("recover", recover);

    const isOwner = await readContracts?.MetaMultiSigWallet?.isOwner(recover);
    console.log("isOwner", isOwner);

    if (isOwner) {
      const res = await axios.post(poolServerUrl, {
        chainId: localProvider._network.chainId,
        address: readContracts[contractName]?.address,
        nonce: nonce.toNumber(),
        to,
        amount,
        data: callData,
        hash: newHash,
        signatures: [signature],
        signers: [recover],
      });
      console.log("RESULT", res.data);
      setTimeout(() => {
        history.push("/pool");
        setLoading(false)
        setSelectDisabled(false)

      }, 2777);
    } else {
      console.log("ERROR, NOT OWNER.");
    }



  }

  return (
    <div>

      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8 }}>
          <div style={{ margin: 8, padding: 8 }}>
            <Select value={methodName} disabled={selectDisabled} style={{ width: "100%" }} onChange={setMethodName}>
              <Option key="transferFunds">Send ETH</Option>
              <Option key="addSigner">Add Signer</Option>
              <Option key="removeSigner">Remove Signer</Option>
            </Select>
          </div>
          <div style={inputStyle}>
            <AddressInput
              autoFocus
              disabled={selectDisabled}
              ensProvider={mainnetProvider}
              placeholder={methodName == "transferFunds" ? "to address" : "Owner address"}
              value={to}
              onChange={setTo}
            />
          </div>
          {methodName != "transferFunds" &&
            <div style={{ margin: 8, padding: 8 }}>
              <Input
                placeholder="new # of signatures required"
                value={newSignaturesRequired}
                disabled={selectDisabled}
                onChange={(e) => { setNewSignaturesRequired(e.target.value) }}
              />
            </div>
          }

          {methodName == "transferFunds" && <div style={inputStyle}>
            <EtherInput
              price={price}
              mode="USD"
              value={amount}
              onChange={setAmount}
              disabled={selectDisabled}
            />
          </div>}

          {!selectDisabled && <Button
            style={{ marginTop: 32 }}
            type="primary"
            onClick={() => {
              setSelectDisabled(true)
            }}

          > Create
          </Button>
          }

          {selectDisabled &&
            <Space style={{ marginTop: 32 }}>
              <Button
                loading={loading}
                onClick={confirmTransaction}
                type="primary"

              >
                Confirm
              </Button>
              <Button
                onClick={() => {
                  setSelectDisabled(false)
                }}
              >
                Cancel
              </Button>
            </Space>}

        </div>

      </div>
    </div>
  );
}

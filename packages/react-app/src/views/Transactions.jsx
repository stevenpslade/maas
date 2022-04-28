import React, { useCallback, useEffect, useState } from "react";
import { Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin } from "antd";
import { ConsoleSqlOutlined, SyncOutlined } from "@ant-design/icons";
import { parseEther, formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { Address, AddressInput, Balance, Blockie, TransactionListItem } from "../components";
import { usePoller } from "eth-hooks";

const axios = require("axios");

const DEBUG = false;

export default function Transactions({
  poolServerUrl,
  contractName,
  signaturesRequired,
  address,
  nonce,
  userSigner,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  blockExplorer,
}) {
  const [transactions, setTransactions] = useState();
  usePoller(() => {
    const getTransactions = async () => {
      const res = await axios.get(
        poolServerUrl + readContracts[contractName].address + "_" + localProvider._network.chainId,
      );

      console.log("backend stuff res", res.data);

      const newTransactions = [];
      for (const i in res.data) {
        console.log("backend stuff res.data[i]", res.data[i]);
        const thisNonce = ethers.BigNumber.from(res.data[i].nonce);
        if (thisNonce && nonce && thisNonce.gte(nonce)) {
          const validSignatures = [];
          for (const sig in res.data[i].signatures) {
            const signer = await readContracts[contractName].recover(res.data[i].hash, res.data[i].signatures[sig]);
            const isOwner = await readContracts[contractName].isOwner(signer);
            if (signer && isOwner) {
              validSignatures.push({ signer, signature: res.data[i].signatures[sig] });
            }
          }

          const update = { ...res.data[i], validSignatures };
          newTransactions.push(update);
        }
      }

      console.log("backend stuff newTransactions", newTransactions);

      setTransactions(newTransactions);
    };
    if (readContracts[contractName]) getTransactions();
  }, 3777);

  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[contractName].recover(newHash, allSigs[sig]);
      sigList.push({ signature: allSigs[sig], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer));
    });

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const sig in sigList) {
      if (!used[sigList[sig].signature]) {
        finalSigList.push(sigList[sig].signature);
        finalSigners.push(sigList[sig].signer);
      }
      used[sigList[sig].signature] = true;
    }

    return [finalSigList, finalSigners];
  };

  if (!signaturesRequired) {
    return <Spin />;
  }

  return (
    <div style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}>
      <h1>
        <b style={{ padding: 16 }}>#{nonce ? nonce.toNumber() : <Spin />}</b>
      </h1>

      <List
        bordered
        dataSource={transactions}
        renderItem={item => {
          const hasSigned = item.signers.indexOf(address) >= 0;
          const hasEnoughSignatures = item.signatures.length <= signaturesRequired.toNumber();

          console.log("transaction details:", item);

          return (
            <TransactionListItem
              item={item}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              price={price}
              readContracts={readContracts}
              contractName={contractName}
            >
              <div style={{padding:16}}>
              <span style={{padding:4}}>
                {item.signatures.length}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
              </span>
              <span style={{padding:4}}>
                <Button
                  type="secondary"
                  onClick={async () => {
                    const newHash = await readContracts[contractName].getTransactionHash(
                      item.nonce,
                      item.to,
                      parseEther("" + parseFloat(item.amount).toFixed(12)),
                      item.data,
                    );

                    const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
                    const recover = await readContracts[contractName].recover(newHash, signature);
                    const isOwner = await readContracts[contractName].isOwner(recover);
                    if (isOwner) {
                      const [finalSigList, finalSigners] = await getSortedSigList(
                        [...item.signatures, signature],
                        newHash,
                      );
                      const res = await axios.post(poolServerUrl, {
                        ...item,
                        signatures: finalSigList,
                        signers: finalSigners,
                      });
                    }
                  }}
                >
                  Sign
                </Button>
                <Button
                  key={item.hash}
                  type={hasEnoughSignatures ? "primary" : "secondary"}
                  onClick={async () => {
                    const newHash = await readContracts[contractName].getTransactionHash(
                      item.nonce,
                      item.to,
                      parseEther("" + parseFloat(item.amount).toFixed(12)),
                      item.data,
                    );

                    const [finalSigList, finalSigners] = await getSortedSigList(item.signatures, newHash);

                    console.log("writeContracts: ", item.to, parseEther("" + parseFloat(item.amount).toFixed(12)), item.data, finalSigList);

                    tx(
                      writeContracts[contractName].executeTransaction(
                        item.to,
                        parseEther("" + parseFloat(item.amount).toFixed(12)),
                        item.data,
                        finalSigList,
                      ),
                    );
                  }}
                >
                  Exec
                </Button>
              </span>
            </div>
          </TransactionListItem>
          );
        }}
      />
    </div>
  );
}

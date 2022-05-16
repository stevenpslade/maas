import React, { useState, useEffect } from "react";
import { useBalance } from "eth-hooks";
import { BigNumber } from 'ethers';

const { utils } = require("ethers");
const zero = BigNumber.from(0);

/** 
  ~ What it does? ~

  Displays a balance of given address in ether & dollar

  ~ How can I use? ~

  <Balance
    address={address}
    provider={mainnetProvider}
    price={price}
  />

  ~ If you already have the balance as a bignumber ~
  <Balance
    balance={balance}
    price={price}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to given address
  - Provide provider={mainnetProvider} to access balance on mainnet or any other network (ex. localProvider)
  - Provide price={price} of ether and get your balance converted to dollars
**/

export default function Balance(props) {
  const [dollarMode, setDollarMode] = useState(true);
  const [balance, setBalance] = useState();
  const {provider, address} = props;

  const balanceContract = useBalance(props.provider, props.address);
  useEffect(() => {
    setBalance(balanceContract);
  }, [balanceContract]);

  useEffect(() => {
    async function getBalance() {
      if (provider && address) {
        const newBalance = await provider.getBalance(address);
        if (!newBalance.eq(balance ?? zero)) {
          setBalance(newBalance);
        }
      }
    }
    getBalance();
  }, [address, provider]);

  let floatBalance = parseFloat("0.00");
  let usingBalance = balance;

  if (typeof props.balance !== "undefined") usingBalance = props.balance;
  if (typeof props.value !== "undefined") usingBalance = props.value;

  if (usingBalance) {
    const etherBalance = utils.formatEther(usingBalance);
    parseFloat(etherBalance).toFixed(2);
    floatBalance = parseFloat(etherBalance);
  }

  let displayBalance = floatBalance.toFixed(4);

  const price = props.price || props.dollarMultiplier || 1;

  if (dollarMode) {
    displayBalance = "$" + (floatBalance * price).toFixed(2);
  }

  return (
    <span
      style={{
        verticalAlign: "middle",
        fontSize: props.size ? props.size : 24,
        padding: "0 0.5rem",
        cursor: "pointer",
      }}
      onClick={() => {
        setDollarMode(!dollarMode);
      }}
    >
      {displayBalance}
    </span>
  );
}

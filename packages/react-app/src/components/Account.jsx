import { Button } from "antd";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";

import Address from "./Address";
import Balance from "./Balance";
import Wallet from "./Wallet";

/** 
  ~ What it does? ~

  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out

  ~ How can I use? ~

  <Account
    useBurner={boolean}
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
    isContract={boolean}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
**/

export default function Account({
  useBurner,
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  isContract,
}) {
  const { currentTheme } = useThemeSwitcher();

  let accountButton;
  if (web3Modal?.cachedProvider) {
    accountButton = { name: 'Logout', action: logoutOfWeb3Modal };
  } else {
    accountButton = { name: 'Connect', action: loadWeb3Modal };
  }

  return (
    <div style={{ display: "flex" }}>
      <div style={{
        border: "1px solid #d9d9d9",
        borderRadius: "9999px",
        paddingLeft: "0.875rem",
        display: "flex",
        alignItems: "center",
      }}>
        <Balance address={address} provider={localProvider} price={price} size={"1.125rem"} />
        <Wallet
          address={address}
          provider={localProvider}
          signer={userSigner}
          ensProvider={mainnetProvider}
          price={price}
          color={currentTheme === "light" ? "#1890ff" : "#2caad9"}
          size={"1.4rem"}
          padding={"0px"}
        />
        <div style={{
          border: "1px solid transparent",
          borderRadius: "9999px",
          backgroundColor: currentTheme === "light" ? "#f1f5f9" : "#262626",
          marginLeft: "0.5rem",
          padding: "0.375rem 0.875rem",
        }}>
          {address && (
            <Address
              address={address}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={"1.125rem"}
              blockieSize={5}
            />
          )}
        </div>
      </div>
      <Button
        style={{ verticalAlign: "top", marginLeft: 8, height: "auto" }}
        shape="round"
        size="large"
        onClick={accountButton.action}
      >
        {accountButton.name}
      </Button>
    </div>
  );
}

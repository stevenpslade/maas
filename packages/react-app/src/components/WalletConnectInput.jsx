import { Button, Input, Badge } from "antd";
import { CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import WalletConnect from "@walletconnect/client";
import QrReader from "react-qr-reader";
import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks";
import { parseExternalContractTransaction } from "../helpers";
import TransactionDetailsModal from "./MultiSig/TransactionDetailsModal";

const WalletConnectInput = ({ chainId, address, loadWalletConnectData, mainnetProvider, price }) => {
  const [walletConnectConnector, setWalletConnectConnector] = useLocalStorage("walletConnectConnector");
  const [wallectConnectConnectorSession, setWallectConnectConnectorSession] = useLocalStorage(
    "wallectConnectConnectorSession",
  );
  const [walletConnectUri, setWalletConnectUri] = useLocalStorage("walletConnectUri", "");
  const [isConnected, setIsConnected] = useLocalStorage("isConnected", false);
  const [peerMeta, setPeerMeta] = useLocalStorage("peerMeta");
  const [data, setData] = useState();
  const [to, setTo] = useState();
  const [value, setValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [scan, setScan] = useState(false);

  useEffect(() => {
    if (walletConnectUri) {
      setupAndSubscribe();
    }
  }, [walletConnectUri]);

  useEffect(() => {
    if (address && !isConnected) {
      resetConnection();
    }
  }, [address], isConnected);

  const setupAndSubscribe = () => {
    const connector = setupConnector();
    if (connector) {
      subscribeToEvents(connector);
      setWalletConnectConnector(connector);
    }
  };

  const setupConnector = () => {
    console.log(" 📡 Connecting to Wallet Connect....", walletConnectUri);
    let connector;
    try {
      connector = new WalletConnect({ uri: walletConnectUri });
     // return connector;
    } catch (error) {
      console.error("setupConnector error:", error);
      localStorage.removeItem("walletConnectUri");
      setWalletConnectUri("");
      return;
    }
    setWalletConnectConnector(connector);
    return connector;
  };

  const subscribeToEvents = connector => {
    connector.on("session_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: session_request", payload);
      setPeerMeta(payload.params[0].peerMeta);

      connector.approveSession({
        accounts: [address],
        chainId,
      });

      if (connector.connected) {
        setIsConnected(true);
        console.log("Session successfully connected.");
      }
    });
    //
    connector.on("call_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: call_request", payload);
      parseCallRequest(payload);
    });
    //

    connector.on("disconnect", (error, payload) => {
      localStorage.removeItem("walletconnect"); // lololol
      console.log("Event: disconnect", payload);
      resetConnection();
      if (error) {
        throw error;
      }
    });
  };
  //
  useEffect(() => {
    if (!isConnected) {
      let nextSession = localStorage.getItem("wallectConnectNextSession");
      if (nextSession) {
        localStorage.removeItem("wallectConnectNextSession");
        console.log("FOUND A NEXT SESSION IN CACHE");
        console.log("this is the", nextSession);
        setWalletConnectUri(nextSession);
      } else if (walletConnectConnector) {
        console.log("NOT CONNECTED AND walletConnectConnector", walletConnectConnector);
        setupConnector(walletConnectConnector);
        setIsConnected(true);
      } else if (walletConnectUri /*&&!walletConnectUriSaved*/) {
        //CLEAR LOCAL STORAGE?!?
        console.log(" old uri was", walletConnectUri);
        console.log("clear local storage and connect...", nextSession);
        localStorage.removeItem("walletconnect"); // lololol
        setupConnector(
          {
            // Required
            uri: walletConnectUri,
            // Required
          } /*,
              {
                // Optional
                url: "<YOUR_PUSH_SERVER_URL>",
                type: "fcm",
                token: token,
                peerMeta: true,
                language: language,
              }*/,
        );
      }
    }
  }, [walletConnectUri]);

  const parseCallRequest = payload => {
    const callData = payload.params[0];
    setValue(callData.value);
    setTo(callData.to);
    setData(callData.data);
  };
  //

  useEffect(() => {
    if (data && to) {
      decodeFunctionData();
    }
  }, [data]);
  //

  const decodeFunctionData = async () => {
    try {
      const parsedTransactionData = await parseExternalContractTransaction(to, data);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (error) {
      console.log(error);
      setParsedTransactionData(null);
    }
  };
  //

  const killSession = () => {
    setIsConnected(false);
    console.log("ACTION", "killSession");
    if (isConnected) {
      walletConnectConnector.killSession();
    }
    resetConnection();
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("walletConnectUri");
    localStorage.removeItem("walletConnectConnector");
    localStorage.setItem("wallectConnectNextSession", walletConnectUri);
    console.log("the connection was reset");
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };
  //

  const hideModal = () => setIsModalVisible(false);

  const handleOk = () => {
    loadWalletConnectData({
      data,
      to,
      value,
    });
  };

  const resetConnection = () => {
    setWalletConnectUri("");
    setIsConnected(false);
    setWalletConnectConnector(null);
    setData();
    setValue();
    setTo();
  };

  return (
    <>
      {scan ? (
        <div
          style={{
            zIndex: 256,
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
          }}
          onClick={() => {
            setScan(false);
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            onError={e => {
              console.log("SCAN ERROR", e);
              setScan(false);
            }}
            onScan={newValue => {
              if (newValue) {
                console.log("SCAN VALUE", newValue);
                setScan(false);
                setWalletConnectUri(newValue);
              }
            }}
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        ""
      )}

      <Input.Group compact>
        <Input
          style={{ width: "calc(100% - 31px)", marginBottom: 20 }}
          placeholder="Paste WalletConnect URI"
          disabled={isConnected}
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
        />
        <Button
          disabled={isConnected}
          onClick={() => setScan(!scan)}
          icon={
            <Badge count={<CameraOutlined style={{ fontSize: 9 }} />}>
              <QrcodeOutlined style={{ fontSize: 18 }} />
            </Badge>
          }
        />
      </Input.Group>

      {isConnected && (
        <>
          <div style={{ marginTop: 10 }}>
            <img src={peerMeta.icons[0]} style={{ width: 25, height: 25 }} />
            <p>
              <a href={peerMeta.url} target="_blank" rel="noreferrer">
                {peerMeta.url}
              </a>
            </p>
          </div>
          <Button onClick={killSession} type="primary">
            Disconnect
          </Button>
        </>
      )}

      {!isConnected && (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            localStorage.removeItem("walletconnect");
            setTimeout(() => {
              window.location.reload(true);
            }, 500);
          }}
        >
          🗑
        </div>
      )}

      {isModalVisible && (
        <TransactionDetailsModal
          visible={isModalVisible}
          txnInfo={parsedTransactionData}
          handleOk={handleOk}
          handleCancel={hideModal}
          showFooter={true}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      )}
    </>
  );
};
export default WalletConnectInput;

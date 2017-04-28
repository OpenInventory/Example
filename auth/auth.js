import React from "react";

const domain = process.env.NODE_ENV === "production"
  ? "https://authenticator-hnlvparggr.now.sh"
  : "http://localhost:4000";

const openWindow = () => {
  const width = Math.min(400, window.screen.width - 20);
  const height = Math.min(600, window.screen.height - 30);
  const top = (window.screen.height - height) / 2;
  const left = (window.screen.width - width) / 2;
  const popup = window.open(
    domain,
    "auth",
    `width=${width},height=${height},top=${top},left=${left},directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no`
  );
  return popup;
};

export const signer = {
  signTransaction: (tx, callback) => {
    const popup = openWindow();
    // ping the popup until it has loaded and responds
    const pingInterval = 500;
    const pinger = setInterval(() => {
      popup.postMessage({ type: "inventory:ping" }, domain);
    }, pingInterval);

    // add listener to incoming messages
    const messageHandler = event => {
      if (event.origin !== domain) {
        return;
      }
      switch (event.data.type) {
        case "inventory:ping-received": {
          clearInterval(pinger);
          popup.postMessage(
            { type: "inventory:request-tx-signature", tx },
            domain
          );
          break;
        }
        case "inventory:transaction-signed": {
          callback(event.data.signed);
          window.removeEventListener("message", messageHandler);
          break;
        }
        case "inventory:error": {
          callback(null);
          break;
        }
      }
    };
    window.addEventListener("message", messageHandler, false);
  },
  hasAddress: (address, callback) => callback(null, true)
};

export class Auth extends React.Component {
  constructor(props) {
    super(props);
    this.auth = this.auth.bind(this);
  }

  render() {
    return (
      <button onClick={() => this.auth()}>
        Sign In
      </button>
    );
  }

  async auth() {
    const address = await new Promise(resolve => {
      const popup = openWindow();
      // ping the popup until it has loaded and responds
      const pingInterval = 500;
      const pinger = setInterval(() => {
        popup.postMessage({ type: "inventory:ping" }, domain);
      }, pingInterval);

      // add listener to incoming messages
      const messageHandler = event => {
        if (event.origin !== domain) {
          return;
        }
        switch (event.data.type) {
          case "inventory:ping-received": {
            clearInterval(pinger);
            popup.postMessage({ type: "inventory:authentication" }, domain);
            break;
          }
          case "inventory:authenticated": {
            resolve(event.data.address);
            window.removeEventListener("message", messageHandler);
            break;
          }
          case "inventory:error": {
            resolve(null);
            break;
          }
        }
      };
      window.addEventListener("message", messageHandler, false);
    });
    this.props.onAuth(address);
  }
}

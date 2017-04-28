import React from "react";
import Web3 from "web3";
import HookedWeb3Provider from "hooked-web3-provider";

import { Auth, signer } from "../auth";

export default class extends React.Component {
  constructor(props) {
    super(props);
    const web3 = new Web3();
    const url = INFURA_URL;
    const web3Provider = new HookedWeb3Provider({
      host: url
    });
    web3.setProvider(web3Provider);

    this.state = {
      signedIn: false,
      address: null,
      to: "",
      amount: "",
      text: [],
      web3
    };
    this.send = this.send.bind(this);
    this.updateBalance = this.updateBalance.bind(this);
  }

  render() {
    const balance = this.state.web3
      .fromWei(this.state.balance, "ether")
      .toString();
    if (this.state.signedIn) {
      return (
        <div>
          <div>logged in as {this.state.address}</div>
          <div>balance {balance}</div>
          <div>
            <input
              placeholder="Amount in Ether"
              value={this.state.amount}
              onChange={value => this.setState({ amount: value.target.value })}
            />
          </div>
          <div>
            <input
              placeholder="Address"
              value={this.state.to}
              onChange={value => this.setState({ to: value.target.value })}
            />
          </div>
          <button onClick={() => this.send()}>Send</button>
          <button onClick={() => this.updateBalance()}>Update Balance</button>
          {this.state.text.map(text => <div key={text}>{text}</div>)}
        </div>
      );
    }
    return (
      <Auth
        onAuth={address => {
          this.setState({ signedIn: true, address });
          this.updateBalance();
        }}
      />
    );
  }

  async send() {
    this.setState({ text: [...this.state.text, "creating transaction"] });
    const { web3, address, to, amount } = this.state;
    const value = web3.toHex(web3.toWei(amount, "ether"));
    const nonce = web3.eth.getTransactionCount(address);
    const tx = {
      from: address,
      to,
      nonce,
      value,
      gasPrice: 20000000000,
      gas: 21000
    };
    this.setState({ text: [...this.state.text, "requesting signature"] });
    const signedTx = await new Promise(resolve =>
      signer.signTransaction(tx, sign => resolve(sign))
    );
    await new Promise(resolve =>
      web3.eth.sendRawTransaction(signedTx, (err, txHash) => {
        this.setState({ text: [...this.state.text, "signed", txHash] });
        resolve(txHash);
      })
    );
    this.updateBalance();
  }

  updateBalance() {
    this.state.web3.eth.getBalance(this.state.address, (err, balance) => {
      this.setState({ balance });
    });
  }
}

"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abiJson from "../abi/DonationJar.json";
import AccountCard from "@/entities/AccountCard/ui/account-card";

const CONTRACT_ADDRESS = "0x8def9A62A963e466EFB47EDaA77e21D21Bfb5495";

type Donation = {
  donator: string;
  recipient: string;
  amount: bigint;
  message: string;
  timestamp: bigint;
};

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [message, setMessage] = useState("");
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    if (walletConnected) fetchDonations();
  }, [walletConnected]);

  const switchToSepolia = async (): Promise<boolean> => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "SepoliaETH",
                  symbol: "SepETH",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://eth-sepolia.g.alchemy.com/v2/EP6VnoP_Lq35TaHS6Fbx-",
                ],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  const connectWallet = async () => {
    await switchToSepolia();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    setWalletConnected(true);
  };

  const fetchDonations = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const accounts = await provider.send("eth_requestAccounts", []);
    if (accounts.length === 0) {
      alert("No wallet connected");
      return;
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, signer);
    const result = await contract.getMyDonates();

    setDonations(result);
  };

  const sendDonation = async () => {
    if (!recipient || !message || !amount) return;

    await switchToSepolia();

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, signer);

    const tx = await contract.addDonate(recipient, message, {
      value: ethers.parseEther(amount),
    });
    await tx.wait();

    alert("Donation sent!");
    setMessage("");
    setRecipient("");
    setAmount("0.01");
    fetchDonations();
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Donation Jar</h1>

      {!walletConnected ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded mb-6"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <AccountCard />
          <div>
            <label className="block mb-1 text-sm">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you!"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Amount (ETH)</label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>

          <button
            onClick={sendDonation}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Send Donation
          </button>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">My Donations</h2>
            {donations.length === 0 ? (
              <p className="text-gray-400">No donations yet.</p>
            ) : (
              <ul className="space-y-2">
                {donations.map((d, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded bg-gray-800 border border-gray-700"
                  >
                    <p className="text-sm text-gray-400">
                      To: {d.recipient} — {ethers.formatEther(d.amount)} ETH
                    </p>
                    <p>{d.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(Number(d.timestamp) * 1000).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

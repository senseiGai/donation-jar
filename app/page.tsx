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
  const [receivedDonations, setReceivedDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletConnected && account) {
      fetchDonations();
      fetchReceivedDonations();
    }
  }, [walletConnected, account]);

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
    const switched = await switchToSepolia();
    if (!switched) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    setAccount(accounts[0]);
    setWalletConnected(true);
  };

  const fetchDonations = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, signer);
    const result = await contract.getMyDonates();
    setDonations(result);
  };

  const fetchReceivedDonations = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, signer);
    const result = await contract.getReceivedDonations();
    setReceivedDonations(result);
  };

  const sendDonation = async () => {
    if (!recipient || !message || !amount) return;

    const switched = await switchToSepolia();
    if (!switched) return;

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson, signer);

      const tx = await contract.addDonate(recipient, message, {
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      alert("✅ Donation sent!");
      setMessage("");
      setRecipient("");
      setAmount("0.01");
      await fetchDonations();
      await fetchReceivedDonations();
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      alert("Transaction failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      {loading ? (
        <div className="text-lg animate-pulse text-gray-300">
          ⏳ Sending transaction...
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-4xl font-bold text-center">Donation Jar</h1>

          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded w-full"
            >
              Connect Wallet
            </button>
          ) : (
            <>
              <AccountCard />

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
                />
                <input
                  type="text"
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
                />
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
                />
                <button
                  onClick={sendDonation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                >
                  Send Donation
                </button>
              </div>

              <div>
                <h2 className="text-xl font-semibold mt-6">My Donations</h2>
                {donations.length === 0 ? (
                  <p className="text-gray-400">No donations yet.</p>
                ) : (
                  <ul className="space-y-2 mt-2">
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
                          {new Date(
                            Number(d.timestamp) * 1000
                          ).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mt-6">
                  Received Donations
                </h2>
                {receivedDonations.length === 0 ? (
                  <p className="text-gray-400">No donations yet.</p>
                ) : (
                  <ul className="space-y-2 mt-2">
                    {receivedDonations.map((d, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded bg-gray-800 border border-gray-700"
                      >
                        <p className="text-sm text-gray-400">
                          From: {d.donator} — {ethers.formatEther(d.amount)} ETH
                        </p>
                        <p>{d.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            Number(d.timestamp) * 1000
                          ).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
